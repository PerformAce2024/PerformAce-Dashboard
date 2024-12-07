from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

class MongoDBHandler:
    def __init__(self):
        self.client = MongoClient(os.getenv('MONGODB_URI'))
        self.db = self.client.campaignAnalytics
        self.collection = self.db.dv360Data

    def save_dv360_data(self, data):
        try:
            result = self.collection.insert_one(data)
            print(f"Data saved to MongoDB with ID: {result.inserted_id}")
            return True
        except Exception as e:
            print(f"Error saving to MongoDB: {e}")
            return False

    def close(self):
        self.client.close()