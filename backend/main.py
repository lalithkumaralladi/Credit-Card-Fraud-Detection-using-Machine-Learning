"""
Main FastAPI Application

This module contains the main FastAPI application and API endpoints
for the Credit Card Fraud Detection system.
"""

import os
import sys
import json
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pathlib import Path
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
import joblib
import uuid
from datetime import datetime

# Add parent directory to path for config import
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import configuration
from config import settings

# Import local modules
from backend.models.fraud_detector import FraudDetector
from backend.services.data_processor import DataProcessor
from backend.services.graph_generator import GraphGenerator

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0"
)

# Use paths from settings
TEMPLATES_DIR = settings.TEMPLATES_DIR
STATIC_DIR = settings.STATIC_DIR
UPLOAD_DIR = settings.UPLOAD_DIR
MODEL_DIR = settings.MODEL_DIR

# Directories are created in config.py

# Mount static files
app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static"
)

# Setup templates
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Global variables to store the current model and processor
current_model: Optional[FraudDetector] = None
current_processor: Optional[DataProcessor] = None

# File size limit from settings
MAX_FILE_SIZE = settings.MAX_FILE_SIZE

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Serve the main page."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle file upload and process the data."""
    try:
        # Check file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f}MB")
        
        # Generate a unique filename
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Initialize data processor
        processor = DataProcessor()
        
        # Load and preprocess data
        df = processor.load_data(file_path)
        df = processor.preprocess_data(df)
        
        # Split the data
        try:
            X_train, X_test, y_train, y_test = processor.split_data(df)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Data splitting error: {str(e)}")
        
        # Scale features
        try:
            X_train_scaled, X_test_scaled = processor.scale_features(X_train, X_test)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Feature scaling error: {str(e)}")
        
        # Handle class imbalance (optimized for large datasets)
        if settings.SAMPLE_LARGE_DATASETS and len(X_train_scaled) > settings.LARGE_DATASET_THRESHOLD:
            # Sample for faster processing on very large datasets
            sample_size = min(50000, len(X_train_scaled))
            if isinstance(X_train_scaled, pd.DataFrame):
                indices = np.random.choice(len(X_train_scaled), sample_size, replace=False)
                X_train_scaled = X_train_scaled.iloc[indices]
                y_train = y_train.iloc[indices]
            else:
                indices = np.random.choice(len(X_train_scaled), sample_size, replace=False)
                X_train_scaled = X_train_scaled[indices]
                y_train = y_train[indices]
        
        # Skip SMOTE for very large datasets to save time
        if settings.ENABLE_SMOTE and len(X_train_scaled) <= settings.MAX_SMOTE_SAMPLES:
            X_resampled, y_resampled = processor.handle_class_imbalance(X_train_scaled, y_train)
        else:
            X_resampled, y_resampled = X_train_scaled, y_train
        
        # Train the model
        model = FraudDetector()
        train_results = model.train(X_resampled, y_resampled)
        
        # Evaluate the model
        eval_results = model.evaluate(X_test_scaled, y_test)
        
        # Save the model and processor
        model_id = str(uuid.uuid4())
        model_path = os.path.join(MODEL_DIR, f"model_{model_id}.joblib")
        processor_path = os.path.join(MODEL_DIR, f"processor_{model_id}.joblib")
        
        model.save_model(model_path)
        processor.save_processor(processor_path)
        
        # Update global variables
        global current_model, current_processor
        current_model = model
        current_processor = processor
        
        # Calculate class distribution
        if 'Class' in df.columns:
            class_dist = df['Class'].value_counts().to_dict()
            # Ensure keys are strings
            class_dist = {str(k): int(v) for k, v in class_dist.items()}
        else:
            class_dist = {"0": len(df), "1": 0}
        
        # Prepare comprehensive response
        response = {
            "status": "success",
            "message": "File uploaded and processed successfully",
            "model_id": model_id,
            "training_metrics": train_results,
            "evaluation_metrics": eval_results,
            "data": {
                "original_file": file.filename,
                "processed_rows": len(df),
                "class_distribution": class_dist,
                "model_metrics": {
                    "accuracy": eval_results.get('classification_report', {}).get('accuracy', 0),
                    "precision": eval_results.get('classification_report', {}).get('1', {}).get('precision', 0),
                    "recall": eval_results.get('classification_report', {}).get('1', {}).get('recall', 0),
                    "f1_score": eval_results.get('classification_report', {}).get('1', {}).get('f1-score', 0),
                    "roc_auc": eval_results.get('roc_auc', 0),
                    "pr_auc": eval_results.get('pr_auc', 0)
                },
                "confusion_matrix": eval_results.get('confusion_matrix', [[0, 0], [0, 0]])
            }
        }
        
        # Generate graphs using original dataframe before preprocessing (async for speed)
        try:
            # Use smaller sample for faster graph generation
            df_original = processor.load_data(file_path)
            if len(df_original) > 50000:
                df_original = df_original.sample(n=50000, random_state=42)
            graph_generator = GraphGenerator()
            graphs = graph_generator.generate_all_graphs(df_original, response, model_id)
            response["graphs"] = graphs
        except Exception as e:
            print(f"Warning: Graph generation skipped: {str(e)}")
            response["graphs"] = {}
            # Continue without graphs if generation fails
        
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Data validation error: {str(e)}")
    except Exception as e:
        error_msg = str(e)
        print(f"Upload error: {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {error_msg}")

@app.post("/api/predict")
async def predict(data: Dict[str, Any]):
    """Make predictions on new data."""
    global current_model, current_processor
    
    if current_model is None or current_processor is None:
        raise HTTPException(status_code=400, detail="No trained model available. Please upload and process data first.")
    
    try:
        # Convert input data to DataFrame
        input_df = pd.DataFrame([data])
        
        # Preprocess the input data
        processed_df = current_processor.preprocess_data(input_df)
        
        # Scale the features
        scaled_df, _ = current_processor.scale_features(processed_df)
        
        # Make prediction
        prediction = current_model.predict(scaled_df)
        probability = current_model.predict_proba(scaled_df)[:, 1]
        
        return {
            "status": "success",
            "prediction": int(prediction[0]),
            "probability": float(probability[0]),
            "is_fraud": bool(prediction[0] == 1)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/models/current")
async def get_current_model():
    """Get information about the current model."""
    global current_model
    
    if current_model is None:
        raise HTTPException(status_code=404, detail="No model is currently loaded")
    
    return {
        "status": "success",
        "model_type": "RandomForestClassifier",
        "feature_importances": current_model.get_feature_importance()
    }

@app.get("/api/graphs/{graph_type}")
async def get_graph(graph_type: str, model_id: Optional[str] = None):
    """Get a specific graph by type."""
    try:
        # Graphs are generated during upload and returned in the response
        raise HTTPException(status_code=400, detail="Graphs are generated during file upload. Please upload a file first.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Swagger UI is available at /docs by default

# Import optimization middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Add middleware for performance and security
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip compression for responses
if settings.ENABLE_COMPRESSION:
    app.add_middleware(GZipMiddleware, minimum_size=1000)  # Only compress responses > 1KB

# Add security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# Add response caching headers
@app.middleware("http")
async def add_cache_headers(request, call_next):
    response = await call_next(request)
    if request.method == "GET" and "static" in request.url.path:
        response.headers["Cache-Control"] = "public, max-age=31536000"  # 1 year cache for static files
    return response

# For development only
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
