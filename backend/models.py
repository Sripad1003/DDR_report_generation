from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class SeverityLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    CRITICAL = "Critical"

class ImageData(BaseModel):
    image_id: str
    filename: str
    base64_data: str
    source_document: str  # "inspection" or "thermal"
    page_number: int
    description: Optional[str] = None

class Observation(BaseModel):
    area: str
    description: str
    thermal_data: Optional[str] = None
    images: List[str] = Field(default_factory=list)  # Image IDs

class DDRReport(BaseModel):
    property_issue_summary: str
    area_wise_observations: List[Observation]
    probable_root_cause: str
    severity_assessment: str
    severity_level: SeverityLevel
    recommended_actions: List[str]
    additional_notes: str
    missing_information: List[str]
    images: List[ImageData]
    
class ProcessingStatus(BaseModel):
    status: str  # "processing", "completed", "failed"
    progress: int  # 0-100
    message: str
