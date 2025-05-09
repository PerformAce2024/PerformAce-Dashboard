import zendriver as uc
import os
import asyncio
from datetime import datetime
import logging
from utils import (
    generate_statistics_report_url,
    parse_csv_to_dict,
    cleanup_files,
)
import requests

logger = logging.getLogger("mgid-crawler")

# Create a directory for browser profiles (to store cookies)
BROWSER_PROFILES_DIR = os.path.join(
    os.environ.get("tmp", "C:\\Windows\\tmp"), "browser_profiles"
)
os.makedirs(BROWSER_PROFILES_DIR, exist_ok=True)


async def ensure_browser_session():
    """Ensure we have a valid browser session"""
    browser_session = None
    page = None

    try:
        browser_session = await uc.start(
            headless=True,
            user_data_dir=BROWSER_PROFILES_DIR,
            no_sandbox=True,
            # browser_args=["--headless=new"],
        )

        # Login
        page = await browser_session.get("https://ads.mgid.com/auth/sign-in")
        await asyncio.sleep(5)

        # Check if already logged in
        current_url = await page.evaluate("window.location.href")
        if "/campaigns" in str(current_url):
            logger.info("Browser session already logged in")
            cookies = await page.get_cookies()
            logger.info(f"Cookies after login: {cookies}")
            requests_style_cookies = await browser_session.cookies.get_all(requests_cookie_format=True)
            return browser_session, page

        # Fill email
        email_input = await page.select(
            'input[type="email"][placeholder="example@email.com"]'
        )
        await email_input.clear_input()
        await asyncio.sleep(1)
        await email_input.send_keys("ashish.dhawan@performacemedia.com")
        await asyncio.sleep(1)

        # Fill password
        pwd_input = await page.select('input[type="password"]')
        await pwd_input.clear_input()
        await asyncio.sleep(1)
        await pwd_input.send_keys("Pmpl@2024")
        await asyncio.sleep(1)

        # Click sign in
        submit_btn = await page.select('button[type="submit"]')
        await submit_btn.click()

        # Wait for login
        for _ in range(30):
            current_url = await page.evaluate("window.location.href")
            if "/campaigns" in str(current_url):
                break
            await asyncio.sleep(1)

        cookies = await page.get_cookies()
        logger.info(f"Cookies after login: {cookies}")

        logger.info("Browser session created and logged in successfully")

    except Exception as e:
        logger.error(f"Error creating browser session: {e}")
        raise Exception("Failed to create browser session", e)

    return browser_session, page


async def download_dimension_report(
    page: uc.Tab, campaign_id, start_date, end_date, dimension,
):
    """Download a specific dimension report and return the downloaded file path"""

    url = generate_statistics_report_url(
        start_date,
        end_date,
        [dimension],
        886,
        campaign_id,
        1000,
        0,
        dimension,
        "desc",
    )

    logger.info(f"Downloading {dimension} report: {url}")
    # Use the environment's tmp directory or fallback to Windows temp
    download_dir = os.path.join(os.environ.get("tmp", "C:\\Windows\\tmp"), "mgid_csvs")
    os.makedirs(download_dir, exist_ok=True)

    # Log the download directory and its permissions
    logger.info(f"Download directory: {download_dir}")
    try:
        can_read = os.access(download_dir, os.R_OK)
        can_write = os.access(download_dir, os.W_OK)
        can_execute = os.access(download_dir, os.X_OK)
        logger.info(f"Permissions for {download_dir} - Read: {can_read}, Write: {can_write}, Execute: {can_execute}")
        logger.info(f"Files in download directory before download: {os.listdir(download_dir)}")
    except Exception as perm_e:
        logger.error(f"Error checking permissions or listing files in {download_dir}: {perm_e}")

    try:
        # Navigate to the report URL to trigger download
        await page.set_download_path(download_dir)

        requests_style_cookies = await page.cookies.get_all(requests_cookie_format=True)
        session = requests.Session()
        for cookie in requests_style_cookies:
            session.cookies.set_cookie(cookie)

        download_url = f"https://ads.mgid.com{url}"
        response = session.get(download_url)
        if response.status_code == 200:
            file_path = os.path.join(download_dir, f"customreport_{campaign_id}_${dimension}.csv")
            with open(file_path, "wb") as f:
                f.write(response.content)
            logger.info(f"Downloaded {dimension} report to {file_path}")
            return file_path
        else:
            logger.error(f"Failed to download {dimension} report: {response.status_code} {response.text}")
            raise Exception(f"Failed to download {dimension} report: {response.status_code}")

    except Exception as e:
        logger.error(f"Error downloading {dimension} report: {e}")
        raise


async def process_campaign(campaign_id, start_date, end_date,):
    """Process a campaign: download reports, parse CSVs, create JSON"""
    try:
        # Ensure we have a valid browser session
        browser, page = await ensure_browser_session()

        # Download all dimension reports
        dimensions = {
            "region": "performanceByRegion",
            "os": "performanceByOS",
            "source": "performanceBySite",
            "browser": "performanceByBrowser",
            "country": "performanceByCountry",
            "deviceType": "performanceByDeviceType",
        }

        csv_files = {}
        for dim_key, _ in dimensions.items():
            try:
                filename = await download_dimension_report(
                    page, campaign_id, start_date, end_date, dim_key
                )
                csv_files[dim_key] = filename
            except Exception as e:
                logger.error(f"Error downloading {dim_key} report: {e}")
                csv_files[dim_key] = None

        # Stop the browser
        browser.stop()

        if not any(csv_files.values()):
            raise Exception("Failed to download any reports")

        # Create campaign performance object
        campaign_performance = {
            "campaignId": campaign_id,
            "startDate": start_date,
            "endDate": end_date,
        }

        # Parse each CSV file
        successful_dimensions = 0
        for dim_key, result_key in dimensions.items():
            if dim_key in csv_files and csv_files[dim_key]:
                try:
                    data = parse_csv_to_dict(csv_files[dim_key])
                    campaign_performance[result_key] = data
                    successful_dimensions += 1
                    logger.info(
                        f"Successfully parsed {len(data)} records for {dim_key}"
                    )
                except Exception as e:
                    logger.error(f"Error parsing {dim_key} CSV: {e}")
                    campaign_performance[result_key] = []
            else:
                logger.warning(f"No CSV file available for {dim_key}")
                campaign_performance[result_key] = []

        # Clean up CSV files
        cleanup_files(csv_files)

        if successful_dimensions == 0:
            raise Exception("Failed to parse any dimension data")

        if successful_dimensions < len(dimensions):
            logger.warning(
                f"Only {successful_dimensions}/{len(dimensions)} dimensions were successfully processed"
            )

        return campaign_performance

    except Exception as e:
        logger.error(f"Error processing campaign {campaign_id}: {str(e)}")
        raise Exception(f"Error processing campaign: {str(e)}")
