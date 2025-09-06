from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
import pandas as pd
import io
import json
from collections import Counter

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class ProcessingLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    status: str  # 'processing', 'completed', 'failed'
    records_processed: int = 0
    records_failed: int = 0
    errors: List[str] = []
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processing_time: Optional[float] = None

class DataStats(BaseModel):
    total_records: int
    total_revenue: float
    unique_customers: int
    unique_products: int
    date_range: Dict[str, str]
    top_products: List[Dict[str, Any]]
    top_customers: List[Dict[str, Any]]
    daily_revenue: List[Dict[str, Any]]

class CustomerInsight(BaseModel):
    customer_id: str
    total_orders: int
    total_spent: float
    avg_order_value: float
    first_purchase: str
    last_purchase: str

class ProductInsight(BaseModel):
    product_id: str
    product_name: str
    total_quantity: int
    total_revenue: float
    avg_price: float
    orders_count: int

# Utility functions
def clean_dataframe(df):
    """Clean and standardize the dataframe"""
    errors = []
    original_count = len(df)
    
    # Remove duplicates
    df = df.drop_duplicates()
    duplicates_removed = original_count - len(df)
    if duplicates_removed > 0:
        errors.append(f"Removed {duplicates_removed} duplicate records")
    
    # Handle missing values
    missing_before = df.isnull().sum().sum()
    df = df.dropna()
    missing_removed = missing_before - df.isnull().sum().sum()
    if missing_removed > 0:
        errors.append(f"Removed {len(df)} records with missing values")
    
    return df, errors

def standardize_schema(df):
    """Standardize column names and data types"""
    errors = []
    
    # Common column mappings
    column_mappings = {
        'invoiceno': 'order_id',
        'invoice': 'order_id',
        'orderid': 'order_id',
        'stockcode': 'product_id',
        'productid': 'product_id',
        'sku': 'product_id',
        'description': 'product_name',
        'productname': 'product_name',
        'product': 'product_name',
        'quantity': 'quantity',
        'qty': 'quantity',
        'unitprice': 'unit_price',
        'price': 'unit_price',
        'customerid': 'customer_id',
        'customer': 'customer_id',
        'invoicedate': 'order_date',
        'date': 'order_date',
        'orderdate': 'order_date',
        'country': 'country'
    }
    
    # Normalize column names
    df.columns = df.columns.str.lower().str.replace(' ', '').str.replace('_', '')
    
    # Map columns
    df = df.rename(columns=column_mappings)
    
    # Ensure required columns exist
    required_columns = ['order_id', 'product_id', 'quantity', 'unit_price']
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        errors.append(f"Missing required columns: {missing_columns}")
        return df, errors
    
    # Convert data types
    try:
        df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')
        df['unit_price'] = pd.to_numeric(df['unit_price'], errors='coerce')
        
        # Calculate total price if not exists
        if 'total_price' not in df.columns:
            df['total_price'] = df['quantity'] * df['unit_price']
        
        # Parse dates
        if 'order_date' in df.columns:
            df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce')
        
    except Exception as e:
        errors.append(f"Error converting data types: {str(e)}")
    
    return df, errors

async def store_processed_data(df, filename):
    """Store processed data in MongoDB"""
    try:
        # Convert DataFrame to dict records
        records = df.to_dict('records')
        
        # Add metadata
        for record in records:
            record['_id'] = str(uuid.uuid4())
            record['source_file'] = filename
            record['processed_at'] = datetime.now(timezone.utc)
            
            # Convert pandas timestamps to ISO strings
            if 'order_date' in record and pd.notna(record['order_date']):
                if hasattr(record['order_date'], 'isoformat'):
                    record['order_date'] = record['order_date'].isoformat()
        
        # Insert into MongoDB
        await db.ecommerce_data.insert_many(records)
        return len(records)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing data: {str(e)}")

# API Routes
@api_router.get("/")
async def root():
    return {"message": "E-commerce Data Processing API"}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Create processing log
    log_entry = ProcessingLog(
        filename=file.filename,
        status='processing'
    )
    
    start_time = datetime.now(timezone.utc)
    
    try:
        # Read file content
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        original_count = len(df)
        
        # Clean data
        df, cleaning_errors = clean_dataframe(df)
        
        # Standardize schema
        df, schema_errors = standardize_schema(df)
        
        all_errors = cleaning_errors + schema_errors
        
        # Store processed data
        records_stored = await store_processed_data(df, file.filename)
        
        # Update log
        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()
        log_entry.status = 'completed'
        log_entry.records_processed = records_stored
        log_entry.records_failed = original_count - records_stored
        log_entry.errors = all_errors
        log_entry.processing_time = processing_time
        
        # Store log
        await db.processing_logs.insert_one(log_entry.dict())
        
        return {
            "message": "File processed successfully",
            "records_processed": records_stored,
            "records_failed": original_count - records_stored,
            "errors": all_errors,
            "processing_time": processing_time
        }
        
    except Exception as e:
        # Log error
        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()
        log_entry.status = 'failed'
        log_entry.errors = [str(e)]
        log_entry.processing_time = processing_time
        
        await db.processing_logs.insert_one(log_entry.dict())
        
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@api_router.get("/analytics/overview")
async def get_analytics_overview():
    """Get overall analytics overview"""
    try:
        # Get basic stats
        total_records = await db.ecommerce_data.count_documents({})
        
        if total_records == 0:
            return {
                "total_records": 0,
                "message": "No data available. Please upload a CSV file first."
            }
        
        # Aggregate data for analytics
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": "$total_price"},
                    "unique_customers": {"$addToSet": "$customer_id"},
                    "unique_products": {"$addToSet": "$product_id"},
                    "min_date": {"$min": "$order_date"},
                    "max_date": {"$max": "$order_date"}
                }
            }
        ]
        
        result = await db.ecommerce_data.aggregate(pipeline).to_list(1)
        stats = result[0] if result else {}
        
        # Get top products
        top_products_pipeline = [
            {
                "$group": {
                    "_id": {
                        "product_id": "$product_id",
                        "product_name": "$product_name"
                    },
                    "total_quantity": {"$sum": "$quantity"},
                    "total_revenue": {"$sum": "$total_price"},
                    "order_count": {"$sum": 1}
                }
            },
            {"$sort": {"total_revenue": -1}},
            {"$limit": 5}
        ]
        
        top_products = await db.ecommerce_data.aggregate(top_products_pipeline).to_list(5)
        
        # Get top customers
        top_customers_pipeline = [
            {
                "$group": {
                    "_id": "$customer_id",
                    "total_spent": {"$sum": "$total_price"},
                    "order_count": {"$sum": 1}
                }
            },
            {"$sort": {"total_spent": -1}},
            {"$limit": 5}
        ]
        
        top_customers = await db.ecommerce_data.aggregate(top_customers_pipeline).to_list(5)
        
        # Get daily revenue
        daily_revenue_pipeline = [
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$dateFromString": {"dateString": "$order_date"}}}},
                    "revenue": {"$sum": "$total_price"},
                    "orders": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}},
            {"$limit": 30}
        ]
        
        daily_revenue = await db.ecommerce_data.aggregate(daily_revenue_pipeline).to_list(30)
        
        return {
            "total_records": total_records,
            "total_revenue": stats.get("total_revenue", 0),
            "unique_customers": len(stats.get("unique_customers", [])),
            "unique_products": len(stats.get("unique_products", [])),
            "date_range": {
                "start": stats.get("min_date", ""),
                "end": stats.get("max_date", "")
            },
            "top_products": [
                {
                    "product_id": item["_id"]["product_id"],
                    "product_name": item["_id"]["product_name"],
                    "total_revenue": item["total_revenue"],
                    "total_quantity": item["total_quantity"],
                    "order_count": item["order_count"]
                }
                for item in top_products
            ],
            "top_customers": [
                {
                    "customer_id": item["_id"],
                    "total_spent": item["total_spent"],
                    "order_count": item["order_count"]
                }
                for item in top_customers
            ],
            "daily_revenue": [
                {
                    "date": item["_id"],
                    "revenue": item["revenue"],
                    "orders": item["orders"]
                }
                for item in daily_revenue
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")

@api_router.get("/logs")
async def get_processing_logs():
    """Get processing logs"""
    try:
        logs = await db.processing_logs.find().sort("timestamp", -1).to_list(50)
        return [ProcessingLog(**log) for log in logs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching logs: {str(e)}")

@api_router.delete("/data/clear")
async def clear_all_data():
    """Clear all processed data and logs"""
    try:
        await db.ecommerce_data.delete_many({})
        await db.processing_logs.delete_many({})
        return {"message": "All data cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing data: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()