from fastapi import FastAPI, HTTPException, BackgroundTasks
from datetime import datetime
import logging
import uvicorn
import asyncio
from models import CrawlerRequest, CampaignPerformance
from crawler import process_campaign

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("api.log"), logging.StreamHandler()],
)
logger = logging.getLogger("mgid-crawler")

app = FastAPI(title="MGID Dashboard Crawler API")


@app.get("/health")
async def health_check():
    """Health check endpoint for the API"""
    return {"status": "ok", "timestamp": datetime.now().isoformat(), "version": "1.0.0"}


@app.post("/trigger", response_model=CampaignPerformance)
async def trigger_crawler(request: CrawlerRequest, background_tasks: BackgroundTasks):
    """Trigger the crawler to collect data for a specific campaign"""
    try:
        # Validate date formats
        try:
            start_date = datetime.strptime(request.startDate, "%Y-%m-%d")
            end_date = datetime.strptime(request.endDate, "%Y-%m-%d")

            if start_date > end_date:
                raise HTTPException(
                    status_code=400, detail="Start date cannot be after end date"
                )

            date_range = (end_date - start_date).days
            if date_range > 365:
                raise HTTPException(
                    status_code=400,
                    detail="Date range too large, maximum allowed is 365 days",
                )

        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid date format. Use YYYY-MM-DD format"
            )

        logger.info(
            f"Processing request for campaign {request.campaignId} from {request.startDate} to {request.endDate}"
        )

        try:
            performance_data = await asyncio.wait_for(
                process_campaign(
                    request.campaignId,
                    request.startDate,
                    request.endDate,
                ),
                timeout=300,  # 5 minutes timeout
            )

            return performance_data

        except asyncio.TimeoutError:
            logger.error(f"Operation timed out for campaign {request.campaignId}")
            raise HTTPException(
                status_code=504,
                detail="Operation timed out. Please try again with a smaller date range or contact support.",
            )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error in trigger endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the request: {str(e)}",
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

