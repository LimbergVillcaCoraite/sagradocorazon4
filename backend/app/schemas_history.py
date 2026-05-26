from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class HistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    content: Optional[str]
    last_updated_by: Optional[UUID]
    updated_at: datetime

class HistoryUpdate(BaseModel):
    content: str

