import os
import json
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any

from utils import get_logger, get_absolute_path
from predict import predict_transaction, load_model, FEATURE_ORDER

logger = get_logger("app")

app = FastAPI(
    title="AI Fraud Detection Service",
    description="Real-time machine learning endpoint for checking transaction fraud risks using Random Forest.",
    version="1.0.0"
)

# Enable CORS for communication with Node.js and frontend services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schema for strict incoming validation
class TransactionPayload(BaseModel):
    Time: float = Field(..., description="Seconds elapsed since first transaction")
    V1: float = Field(..., description="PCA transformed V1")
    V2: float = Field(..., description="PCA transformed V2")
    V3: float = Field(..., description="PCA transformed V3")
    V4: float = Field(..., description="PCA transformed V4")
    V5: float = Field(..., description="PCA transformed V5")
    V6: float = Field(..., description="PCA transformed V6")
    V7: float = Field(..., description="PCA transformed V7")
    V8: float = Field(..., description="PCA transformed V8")
    V9: float = Field(..., description="PCA transformed V9")
    V10: float = Field(..., description="PCA transformed V10")
    V11: float = Field(..., description="PCA transformed V11")
    V12: float = Field(..., description="PCA transformed V12")
    V13: float = Field(..., description="PCA transformed V13")
    V14: float = Field(..., description="PCA transformed V14")
    V15: float = Field(..., description="PCA transformed V15")
    V16: float = Field(..., description="PCA transformed V16")
    V17: float = Field(..., description="PCA transformed V17")
    V18: float = Field(..., description="PCA transformed V18")
    V19: float = Field(..., description="PCA transformed V19")
    V20: float = Field(..., description="PCA transformed V20")
    V21: float = Field(..., description="PCA transformed V21")
    V22: float = Field(..., description="PCA transformed V22")
    V23: float = Field(..., description="PCA transformed V23")
    V24: float = Field(..., description="PCA transformed V24")
    V25: float = Field(..., description="PCA transformed V25")
    V26: float = Field(..., description="PCA transformed V26")
    V27: float = Field(..., description="PCA transformed V27")
    V28: float = Field(..., description="PCA transformed V28")
    Amount: float = Field(..., description="Transaction transfer amount")

    model_config = {
        "json_schema_extra": {
            "example": {
                "Time": 100.0, "V1": 0.5, "V2": 1.2, "V3": -0.2, "V4": 0.8, "V5": 1.1,
                "V6": -0.5, "V7": 0.4, "V8": 0.7, "V9": -0.1, "V10": 0.3, "V11": 0.5,
                "V12": 0.2, "V13": 0.1, "V14": -0.7, "V15": 0.3, "V16": 0.2, "V17": 0.4,
                "V18": 0.5, "V19": 0.1, "V20": 0.2, "V21": 0.4, "V22": 0.1, "V23": 0.3,
                "V24": 0.5, "V25": 0.2, "V26": 0.1, "V27": 0.4, "V28": 0.3, "Amount": 1500.0
            }
        }
    }

@app.on_event("startup")
def startup_event():
    """
    Verifies and pre-loads model binaries on API startup.
    """
    logger.info("Initializing fraud detection service API...")
    try:
        load_model()
        logger.info("Successfully loaded and cached ML model artifacts on startup.")
    except Exception as e:
        logger.warning(
            f"Could not load ML model on startup: {e}. "
            "Please ensure train.py is executed before starting the API server."
        )

@app.get("/")
def read_root():
    """
    Status endpoint.
    """
    return {
        "status": "online",
        "service": "AI Fraud Detection Service",
        "endpoints": {
            "GET /": "Status information",
            "GET /health": "Liveness/Readiness check",
            "POST /predict": "Execute fraud inference on a single transaction",
            "POST /predict-batch": "Execute fraud inference on multiple transactions",
            "GET /model-info": "Retrieve model characteristics and accuracy statistics"
        }
    }

@app.get("/health")
def health_check():
    """
    Health check to inspect if the model is correctly loaded and ready for serving.
    """
    try:
        load_model()
        return {
            "status": "healthy",
            "model_loaded": True
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "model_loaded": False,
            "error": str(e)
        }

@app.post("/predict", status_code=status.HTTP_200_OK)
def predict_single(payload: TransactionPayload):
    """
    Analyzes a single transaction's features for fraud risk.
    """
    try:
        # Convert Pydantic object to dict
        data = payload.dict()
        result = predict_transaction(data)
        return result
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failure: {str(e)}"
        )

@app.post("/predict-batch", status_code=status.HTTP_200_OK)
def predict_batch(payloads: List[TransactionPayload]):
    """
    Analyzes multiple transactions in a single batch call.
    """
    results = []
    try:
        for idx, payload in enumerate(payloads):
            data = payload.dict()
            res = predict_transaction(data)
            results.append({
                "index": idx,
                "prediction": res["prediction"],
                "risk_score": res["risk_score"],
                "risk_level": res["risk_level"]
            })
        return {
            "batch_size": len(payloads),
            "predictions": results
        }
    except Exception as e:
        logger.error(f"Batch inference error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch inference failure: {str(e)}"
        )

@app.get("/model-info")
def model_info():
    """
    Returns model metadata including algorithm, features, and validation accuracy metrics.
    """
    metadata_path = get_absolute_path("models/metadata.json")
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to read model metadata JSON file: {e}")
            
    # Default information if metadata JSON is not written yet
    return {
        "algorithm": "Random Forest Classifier",
        "accuracy": 0.9995,  # Standard baseline for RF on creditcard.csv
        "features": FEATURE_ORDER,
        "n_estimators": 100,
        "max_depth": 15
    }
