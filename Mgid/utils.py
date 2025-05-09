import os
import urllib.parse
import pandas as pd
import shutil
import logging

logger = logging.getLogger("mgid-crawler")

TEMP_DIR = os.path.join(os.environ.get("tmp", "C:\\Windows\\tmp"), "mgid_csvs")
os.makedirs(TEMP_DIR, exist_ok=True)

def generate_statistics_report_url(
    start_date,
    end_date,
    dimensions,
    template_id=886,
    campaign_id=None,
    limit=1000,
    offset=0,
    sort_field=None,
    sort_order="desc",
    timezone="+05:00",
):
    # Format dates with timezone
    formatted_start = f"{start_date}T00:00:00.000{timezone}"
    formatted_end = f"{end_date}T23:59:59.999{timezone}"

    # Use a list of tuples to preserve multiple parameters with the same key
    params_list = [
        ("limit", limit),
        ("offset", offset),
        ("filters[dateRange][dateFrom]", formatted_start),
        ("filters[dateRange][dateTo]", formatted_end),
    ]

    # Add campaign ID filter if provided
    if campaign_id:
        params_list.append((f"filters[campaigns][0]", campaign_id))

    # Add sort field if provided
    if sort_field:
        params_list.append((f"orders[{sort_field}]", sort_order))

    # Add dimensions
    for dim in dimensions:
        params_list.append(("dimensions[]", dim))

    # Add metrics
    metrics = [
        "adRequests",
        "clicks",
        "cpc",
        "ctr",
        "cpcWithoutDataFee",
        "conversionsCostBuy",
        "conversionsBuy",
        "conversionsRateBuy",
        "spent",
        "revenue",
        "profit",
        "roas",
        "epc",
    ]

    for metric in metrics:
        params_list.append(("metrics[]", metric))

    # Encode parameters
    encoded_params = urllib.parse.urlencode(params_list)

    # Construct the final URL
    base_url = f"/api/statistics/reports/templates/{template_id}/export"
    full_url = f"{base_url}?{encoded_params}"

    return full_url

def parse_csv_to_dict(filename):
    """Parse a CSV file into a list of dictionaries"""
    if not os.path.exists(filename):
        logger.warning(f"CSV file not found: {filename}")
        return []

    try:
        df = pd.read_csv(filename)

        column_mapping = {
            "Browser": "browser",
            "Source": "source",
            "Device Type": "deviceType",
            "Country": "country",
            "OS": "os",
            "Region": "region",
            "Clicks": "clicks",
            "CPC, INR": "cpc",
            "Impressions Total": "impressions",
            "CTR": "ctr",
            "Avg. CPC excl. data fee, INR": "avgCpcExclDataFee",
            "Conversion cost - Main goal, INR": "conversionCost",
            "Conversions - Main goal": "conversions",
            "Conversion rate - Main goal": "conversionRate",
            "Spent, INR": "spent",
            "Revenue, INR": "revenue",
            "Profit, INR": "profit",
            "ROAS, %": "roas",
            "EPC, INR": "epc",
        }

        df = df.rename(columns=column_mapping)
        return df.to_dict(orient="records")
    except Exception as e:
        logger.error(f"Error parsing CSV {filename}: {e}")  
        return []

def cleanup_files(csv_files):
    """Remove CSV files after processing"""
    for filename in csv_files.values():
        try:
            if os.path.exists(filename):
                os.remove(filename)
                logger.info(f"Removed file: {filename}")
        except Exception as e:
            logger.error(f"Error removing file {filename}: {e}")

