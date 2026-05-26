from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import json

class TestNotice(BaseModel):
    title: str
    end_at: Optional[datetime] = None

# Test 1: Parse from JSON string
json_str = '{"title": "Test", "end_at": "2026-05-30T23:59:59"}'
parsed = TestNotice.model_validate_json(json_str)
print(f"Parsed from JSON: {parsed}")
print(f"end_at value: {parsed.end_at}")
print(f"end_at type: {type(parsed.end_at)}")

# Test 2: Parse from dict
data = {"title": "Test", "end_at": "2026-05-30T23:59:59"}
parsed2 = TestNotice.model_validate(data)
print(f"\nParsed from dict: {parsed2}")
print(f"end_at value: {parsed2.end_at}")
print(f"end_at type: {type(parsed2.end_at)}")

