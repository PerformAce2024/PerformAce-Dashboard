import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pandas as pd
import time
from datetime import datetime
import pickle
import requests
from dotenv import load_dotenv
import io
import numpy as np
from pymongo import MongoClient

load_dotenv()

class DV360DataFetcher:
    def __init__(self, credentials_path):
        self.SCOPES = [
            'https://www.googleapis.com/auth/doubleclickbidmanager',
            'https://www.googleapis.com/auth/spreadsheets'
        ]
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.credentials_path = os.path.join(self.script_dir, credentials_path)
        self.token_path = os.path.join(self.script_dir, 'token.pickle')
        self.creds = None
        self.mongo_client = MongoClient(os.getenv('MONGODB_URI'))
        self.db = self.mongo_client.campaignAnalytics
        self.collection = self.db.dv360Data

    def authenticate(self):
        try:
            if os.path.exists(self.token_path):
                with open(self.token_path, 'rb') as token:
                    self.creds = pickle.load(token)

            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    self.creds.refresh(Request())
                else:
                    if not os.path.exists(self.credentials_path):
                        raise FileNotFoundError(f"Credentials file not found at: {self.credentials_path}")
                    
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, self.SCOPES)
                    self.creds = flow.run_local_server(port=0)

                with open(self.token_path, 'wb') as token:
                    pickle.dump(self.creds, token)

            self.dbm_service = build('doubleclickbidmanager', 'v2', credentials=self.creds)
            return True
        except Exception as e:
            print(f"Authentication error: {e}")
            return False
        
    def create_query(self, start_date, end_date, filters):
        query_obj = {
            "metadata": {
                "title": f"Performance Report {start_date} to {end_date}",
                "dataRange": {
                    "range": "CUSTOM_DATES",
                    "customStartDate": {
                        "year": int(start_date[:4]),
                        "month": int(start_date[5:7]),
                        "day": int(start_date[8:])
                    },
                    "customEndDate": {
                        "year": int(end_date[:4]),
                        "month": int(end_date[5:7]),
                        "day": int(end_date[8:])
                    }
                },
                "format": "CSV"
            },
            "params": {
                "type": "STANDARD",
                "groupBys": [
                    "FILTER_DATE",
                    "FILTER_MEDIA_PLAN",
                    "FILTER_ADVERTISER",
                    "FILTER_ADVERTISER_CURRENCY",
                    "FILTER_BROWSER",
                    "FILTER_OS",
                    "FILTER_REGION",
                    "FILTER_COUNTRY"
                ],
                "metrics": [
                    "METRIC_IMPRESSIONS",
                    "METRIC_CLICKS",
                    "METRIC_CONVERSIONS_PER_MILLE",
                    "METRIC_REVENUE_ADVERTISER",
                    "METRIC_MEDIA_COST_ADVERTISER",
                    "METRIC_TRACKED_ADS"
                ],
                "filters": [{"type": k, "value": v} for k, v in filters.items() if v]
            },
            "schedule": {"frequency": "ONE_TIME"}
        }
        return self.dbm_service.queries().create(body=query_obj).execute()

    def process_performance_data(self, df, dimension):
        if dimension not in df.columns:
            return {
                "last-used-rawdata-update-time": None,
                "last-used-rawdata-update-time-gmt-millisec": None,
                "timezone": None,
                "results": [],
                "recordCount": 0,
                "metadata": {}
            }

        grouped = df.groupby(dimension).agg({
            'Impressions': 'sum',
            'Clicks': 'sum',
            'Total Conversions': 'sum',
            'Post-Click Conversions': 'sum',
            'Post-View Conversions': 'sum',
            'Media Cost (Advertiser Currency)': 'sum',
            'Revenue (Adv Currency)': 'sum'
        }).reset_index()

        results = []
        for _, row in grouped.iterrows():
            results.append({
                "dimensionValue": str(row[dimension]),
                "impressions": int(row['Impressions']),
                "clicks": int(row['Clicks']),
                "conversions": int(row['Total Conversions']),
                "postClickConversions": int(row['Post-Click Conversions']),
                "postViewConversions": int(row['Post-View Conversions']),
                "amountSpent": float(row['Media Cost (Advertiser Currency)']),
                "revenue": float(row['Revenue (Adv Currency)'])
            })

        return {
            "last-used-rawdata-update-time": datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
            "last-used-rawdata-update-time-gmt-millisec": int(time.time() * 1000),
            "timezone": "IST",
            "results": results,
            "recordCount": len(results)
        }

    def store_in_mongodb(self, df, date):
        try:
            df = df[df['Advertiser'] == 'Bajaj Electricals'].copy()
            
            document = {
                "campaignId": "55089520",
                "startDate": date,
                "endDate": date,
                "dateStored": datetime.now(),
                "campaignPerformance": {
                    "last-used-rawdata-update-time": datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
                    "last-used-rawdata-update-time-gmt-millisec": int(time.time() * 1000),
                    "timezone": "IST",
                    "results": [{
                        "impressions": int(df['Impressions'].fillna(0).sum()),
                        "clicks": int(df['Clicks'].fillna(0).sum()),
                        "conversions": int(df['Total Conversions'].fillna(0).sum()),
                        "postClickConversions": int(df['Post-Click Conversions'].fillna(0).sum()),
                        "postViewConversions": int(df['Post-View Conversions'].fillna(0).sum()),
                        "amountSpent": float(df['Media Cost (Advertiser Currency)'].fillna(0).sum()),
                        "revenue": float(df['Revenue (Adv Currency)'].fillna(0).sum()),
                        "advertiserId": str(df['Advertiser ID'].iloc[0]),
                        "advertiserCurrency": df['Advertiser Currency'].iloc[0],
                        "insertionOrders": len(df['Insertion Order'].unique()),
                        "lineItems": len(df['Line Item'].unique()),
                        "campaignDetails": {
                            "advertiserName": df['Advertiser'].iloc[0],
                            "insertionOrders": df['Insertion Order'].unique().tolist()
                        }
                    }],
                    "recordCount": len(df)
                },
                "performanceByBrowser": self.process_performance_data(df, 'Browser'),
                "performanceByCountry": self.process_performance_data(df, 'Country'),
                "performanceByOS": self.process_performance_data(df, 'Operating System'),
                "performanceByRegion": self.process_performance_data(df, 'Region')
            }

            self.collection.update_one(
                {"campaignId": "55089520", "startDate": date},
                {"$set": document},
                upsert=True
            )
            return True
        except Exception as e:
            print(f"Error storing data in MongoDB: {e}")
            return False

    def get_latest_report(self, query_id):
        """Get the latest report for a query"""
        try:
            response = self.dbm_service.queries().reports().list(queryId=query_id).execute()
            if 'reports' in response and response['reports']:
                return response['reports'][-1]
            return None
        except Exception as e:
            print(f"Error getting latest report: {e}")
            return None

    def get_report_url(self, query_id):
        try:
            response = self.dbm_service.queries().reports().list(queryId=query_id).execute()
            if 'reports' in response and response['reports']:
                latest_report = response['reports'][-1]
                return latest_report.get('metadata', {}).get('googleCloudStoragePath')
            return None
        except Exception as e:
            print(f"Error getting report URL: {e}")
            return None
        
    def process_report(self, url):
        import traceback
        try:
            print(f"Downloading report from URL: {url}")
            response = requests.get(url)
            if response.status_code != 200:
                return False

            df = pd.read_csv(io.StringIO(response.content.decode('utf-8')))
            print("Column names in report:", df.columns.tolist())
            
            for date, date_df in df.groupby('Date'):
                formatted_date = pd.to_datetime(date).strftime('%Y-%m-%d')
                print(f"Processing data for date: {formatted_date}")
                
                # Calculate conversions from Conversions per 1000 Impressions
                conv_per_mille = date_df['Conversions per 1000 Impressions'].fillna(0).astype(float)
                impressions = date_df['Impressions'].fillna(0).astype(int)
                total_conversions = (conv_per_mille * impressions / 1000).round().astype(int)
                
                document = {
                    "campaignId": "55089520",
                    "startDate": formatted_date,
                    "endDate": formatted_date,
                    "dateStored": datetime.now(),
                    "campaignPerformance": {
                        "last-used-rawdata-update-time": datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
                        "last-used-rawdata-update-time-gmt-millisec": int(time.time() * 1000),
                        "timezone": "IST",
                        "results": [{
                            "impressions": int(impressions.sum()),
                            "clicks": int(date_df['Clicks'].fillna(0).sum()),
                            "conversions": int(total_conversions.sum()),
                            "postClickConversions": 0,  # Not available in current data
                            "postViewConversions": 0,  # Not available in current data
                            "amountSpent": float(date_df['Media Cost (Advertiser Currency)'].fillna(0).sum()),
                            "revenue": float(date_df['Revenue (Adv Currency)'].fillna(0).sum()),
                            "advertiserId": str(date_df['Advertiser ID'].iloc[0]),
                            "advertiserCurrency": date_df['Advertiser Currency'].iloc[0],
                            "insertionOrders": 0,  # Not available in current data
                            "lineItems": 0,  # Not available in current data
                            "campaignDetails": {
                                "advertiserName": "Bajaj Electricals",
                                "insertionOrders": []  # Not available in current data
                            }
                        }],
                        "recordCount": len(date_df)
                    },
                    "performanceByBrowser": self.process_performance_metrics(date_df, 'Browser'),
                    "performanceByCountry": self.process_performance_metrics(date_df, 'Country'),
                    "performanceByOS": self.process_performance_metrics(date_df, 'Operating System'),
                    "performanceByRegion": self.process_performance_metrics(date_df, 'Region ID')
                }

                try:
                    result = self.collection.update_one(
                        {"campaignId": "55089520", "startDate": formatted_date},
                        {"$set": document},
                        upsert=True
                    )
                    print(f"Successfully stored data for {formatted_date}")
                except Exception as e:
                    print(f"Error storing in MongoDB for {formatted_date}: {e}")
            
            return True

        except Exception as e:
            print(f"Error processing report: {e}")
            traceback.print_exc()
            return False


    
    def process_performance_metrics(self, df, dimension):
        try:
            if dimension not in df.columns:
                return self.get_empty_performance()
                
            grouped = df.groupby(dimension).agg({
                'Impressions': 'sum',
                'Clicks': 'sum',
                'Conversions per 1000 Impressions': lambda x: (x * df['Impressions'] / 1000).sum(),
                'Media Cost (Advertiser Currency)': 'sum',
                'Revenue (Adv Currency)': 'sum'
            }).reset_index()
            
            results = [{
                "dimensionValue": str(row[dimension]),
                "impressions": int(row['Impressions']),
                "clicks": int(row['Clicks']),
                "conversions": int(row['Conversions per 1000 Impressions']),
                "postClickConversions": 0,
                "postViewConversions": 0,
                "amountSpent": float(row['Media Cost (Advertiser Currency)']),
                "revenue": float(row['Revenue (Adv Currency)'])
            } for _, row in grouped.iterrows()]

            return {
                "last-used-rawdata-update-time": datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
                "last-used-rawdata-update-time-gmt-millisec": int(time.time() * 1000),
                "timezone": "IST",
                "results": results,
                "recordCount": len(results)
            }
        except Exception as e:
            print(f"Error processing {dimension} metrics: {e}")
            return self.get_empty_performance()
        
    def get_empty_performance(self):
        return {
            "last-used-rawdata-update-time": None,
            "last-used-rawdata-update-time-gmt-millisec": None,
            "timezone": None,
            "results": [],
            "recordCount": 0,
            "metadata": {}
        }
    

    def fetch_data(self, start_date, end_date, filters):
        if not self.authenticate():
            return False

        try:
            query_response = self.create_query(start_date, end_date, filters)
            query_id = query_response["queryId"]
            print(f"Created query: {query_id}")
            
            self.dbm_service.queries().run(queryId=query_id, body={}).execute()
            print("Query execution triggered")
            
            max_attempts = 10
            wait_time = 60
            
            for attempt in range(max_attempts):
                print(f"Checking report status (Attempt {attempt + 1}/{max_attempts})")
                latest_report = self.get_latest_report(query_id)
                
                if latest_report:
                    status = latest_report.get('metadata', {}).get('status', {}).get('state')
                    if status == 'DONE':
                        url = self.get_report_url(query_id)
                        if url:
                            print(f"Report URL found: {url}")
                            return self.process_report(url)
                
                print(f"Waiting {wait_time} seconds...")
                time.sleep(wait_time)
            
            print("Timed out waiting for report")
            return False

        except Exception as e:
            print(f"Error fetching data: {e}")
            import traceback
            traceback.print_exc()
            return False
    
def main():
    filters = {
        'FILTER_MEDIA_PLAN': '55089520',
        'FILTER_ADVERTISER': '6783985134'
    }
    
    fetcher = DV360DataFetcher(os.getenv('CREDENTIALS_PATH'))
    fetcher.fetch_data('2024-11-29', '2024-12-29', filters)

if __name__ == '__main__':
    main()