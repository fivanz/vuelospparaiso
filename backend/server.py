from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union
import uuid
from datetime import datetime

# Root directory and environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# In-memory storage for flights and positions (instead of MongoDB)
flights_data: Dict[str, dict] = {}
positions_data: Dict[str, dict] = {}

# Define Models
class GeoPosition(BaseModel):
    id: str
    latitude: float
    longitude: float
    altitude: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class FlightStatus(BaseModel):
    id: str
    pilot_name: str
    passenger_name: str
    status: str  # "scheduled", "paused", "flying", "landed"
    scheduled_departure: Optional[datetime] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Flight Control Dashboard API"}

@api_router.post("/webhook/position")
async def update_position(position: GeoPosition):
    """Webhook endpoint to receive position updates from external systems"""
    positions_data[position.id] = position.dict()
    return {"status": "success", "message": f"Position updated for ID: {position.id}"}

@api_router.post("/webhook/flight")
async def update_flight(flight: FlightStatus):
    """Webhook endpoint to receive flight status updates from external systems"""
    flights_data[flight.id] = flight.dict()
    return {"status": "success", "message": f"Flight status updated for ID: {flight.id}"}

@api_router.get("/positions")
async def get_positions():
    """Get all current positions"""
    return list(positions_data.values())

@api_router.get("/flights")
async def get_flights():
    """Get all current flights"""
    return list(flights_data.values())

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
