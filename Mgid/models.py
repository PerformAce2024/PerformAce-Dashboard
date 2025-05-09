from pydantic import BaseModel
from typing import List, Optional

class CrawlerRequest(BaseModel):
    campaignId: str
    startDate: str  # Format: YYYY-MM-DD
    endDate: str  # Format: YYYY-MM-DD
    timezone: str = "+05:00"

class CampaignPerformance(BaseModel):
    campaignId: str
    startDate: str
    endDate: str
    performanceByRegion: List[dict]
    performanceByOS: List[dict]
    performanceBySite: List[dict]
    performanceByBrowser: List[dict]
    performanceByCountry: List[dict]
    performanceByDeviceType: List[dict]

