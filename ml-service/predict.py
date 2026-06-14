import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List

from utils import get_logger, get_absolute_path

logger = get_logger("predict")

# Globals for caching models to optimize API latency
_model = None
_scaler = None

# Exact order of columns as used during training
FEATURE_ORDER = [
    'Time', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10',
    'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20',
    'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'Amount'
]

def load_model() -> tuple:
    """
    Loads and caches the Random Forest model and standard scaler.
    Raises FileNotFoundError if model artifacts are missing.
    """
    global _model, _scaler
    if _model is not None and _scaler is not None:
        return _model, _scaler
        
    model_path = get_absolute_path("models/fraud_model.pkl")
    scaler_path = get_absolute_path("models/scaler.pkl")
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        logger.error(f"Required model binaries missing (checked {model_path} and {scaler_path}).")
        raise FileNotFoundError(
            "Model files are missing. Please execute train.py first to train and serialize the model."
        )
        
    logger.info("Deserializing and caching model and scaler artifacts...")
    _model = joblib.load(model_path)
    _scaler = joblib.load(scaler_path)
    return _model, _scaler

def preprocess_data(data: Dict[str, Any]) -> pd.DataFrame:
    """
    Transforms the input transaction dictionary into a standardized Pandas DataFrame
    conforming to the training feature structure, and applies the fitted StandardScaler.
    """
    _, scaler = load_model()
    
    # Build feature record with safety default values
    record = {}
    for feature in FEATURE_ORDER:
        if feature not in data:
            logger.warning(f"Feature '{feature}' was omitted in transaction payload. Imputing with 0.0.")
            record[feature] = 0.0
        else:
            try:
                record[feature] = float(data[feature])
            except (ValueError, TypeError) as e:
                logger.error(f"Invalid numeric value for '{feature}': {data[feature]}")
                raise ValueError(f"Feature '{feature}' must be a valid numeric representation.")
                
    # Create DataFrame and enforce strict feature alignment
    df = pd.DataFrame([record])
    df = df[FEATURE_ORDER]
    
    # Scale variables
    scaled_array = scaler.transform(df)
    return pd.DataFrame(scaled_array, columns=FEATURE_ORDER)

def calculate_risk_score(fraud_probability: float) -> int:
    """
    Translates model predicted class probability (0.0 to 1.0) into 0-100 risk score.
    """
    return int(round(fraud_probability * 100))

def get_risk_level(risk_score: int) -> str:
    """
    Classifies risk score bounds.
    """
    if risk_score <= 30:
        return "SAFE"
    elif risk_score <= 70:
        return "SUSPICIOUS"
    else:
        return "HIGH_RISK"

def predict_transaction(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs full inference pipeline on a single input transaction dictionary.
    Returns prediction, risk score, and risk level.
    """
    model, _ = load_model()
    
    # Preprocess payload
    scaled_df = preprocess_data(data)
    
    # Classify prediction and retrieve probabilites
    prediction = int(model.predict(scaled_df)[0])
    probabilities = model.predict_proba(scaled_df)[0]
    
    # Extract probability of Class=1 (Fraud)
    fraud_prob = float(probabilities[1])
    risk_score = calculate_risk_score(fraud_prob)
    risk_level = get_risk_level(risk_score)
    
    logger.info(f"Transaction inference result - Prediction: {prediction}, Score: {risk_score}, Level: {risk_level}")
    return {
        "prediction": prediction,
        "risk_score": risk_score,
        "risk_level": risk_level
    }
