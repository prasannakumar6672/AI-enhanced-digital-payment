# AI Fraud Detection Service

A lightweight, real-time machine learning microservice built with **FastAPI** and **Scikit-Learn** to detect fraudulent transactions using a Random Forest Classifier trained on the Kaggle Credit Card Fraud Detection dataset.

## Project Structure

```
ml-service/
│
├── dataset/
│   └── creditcard.csv      # Source training data (~150MB, containing PCA features V1-V28)
│
├── models/
│   ├── fraud_model.pkl    # Serialized Random Forest Classifier
│   ├── scaler.pkl         # Serialized StandardScaler
│   └── metadata.json      # Evaluation metrics and model parameters
│
├── train.py                # Training and evaluation pipeline
├── app.py                  # FastAPI server and endpoints
├── predict.py              # Inference pipeline & risk scoring
├── utils.py                # Logging and path resolution helpers
├── requirements.txt        # Service Python dependencies
├── README.md               # Setup and usage guide
└── .env                    # Environment variables configuration
```

## Setup Instructions

### 1. Initialize Virtual Environment
Navigate to the `ml-service` directory and run:

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Unix/macOS
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Train the Model
Run the model training script to preprocess the data, handle class imbalances, train the Random Forest Classifier, and save the binary artifacts:

```bash
python train.py
```

*Note: The script outputs classification metrics (Accuracy, Precision, Recall, F1 Score, ROC AUC) as well as the confusion matrix and top feature importances.*

### 4. Start the FastAPI Server
To launch the API server locally:

```bash
# Runs the server on http://localhost:8000
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

---

## API Documentation

### 1. Liveness & Welcome Status
* **Endpoint:** `GET /`
* **Response:**
```json
{
  "status": "online",
  "service": "AI Fraud Detection Service",
  "endpoints": { ... }
}
```

### 2. Health Readiness Check
* **Endpoint:** `GET /health`
* **Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### 3. Single Prediction
* **Endpoint:** `POST /predict`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "Time": 100,
  "V1": 0.5,
  "V2": 1.2,
  "V3": -0.2,
  "V4": 0.8,
  "V5": 1.1,
  "V6": -0.5,
  "V7": 0.4,
  "V8": 0.7,
  "V9": -0.1,
  "V10": 0.3,
  "V11": 0.5,
  "V12": 0.2,
  "V13": 0.1,
  "V14": -0.7,
  "V15": 0.3,
  "V16": 0.2,
  "V17": 0.4,
  "V18": 0.5,
  "V19": 0.1,
  "V20": 0.2,
  "V21": 0.4,
  "V22": 0.1,
  "V23": 0.3,
  "V24": 0.5,
  "V25": 0.2,
  "V26": 0.1,
  "V27": 0.4,
  "V28": 0.3,
  "Amount": 1500
}
```
* **Response:**
```json
{
  "prediction": 0,
  "risk_score": 20,
  "risk_level": "SAFE"
}
```

### 4. Batch Prediction
* **Endpoint:** `POST /predict-batch`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
[
  { "Time": 100, "V1": 0.5, ..., "Amount": 1500 },
  { "Time": 105, "V1": -1.2, ..., "Amount": 300 }
]
```
* **Response:**
```json
{
  "batch_size": 2,
  "predictions": [
    { "index": 0, "prediction": 0, "risk_score": 20, "risk_level": "SAFE" },
    { "index": 1, "prediction": 1, "risk_score": 85, "risk_level": "HIGH_RISK" }
  ]
}
```

### 5. Model Information
* **Endpoint:** `GET /model-info`
* **Response:**
```json
{
  "algorithm": "Random Forest Classifier",
  "accuracy": 0.99951,
  "precision": 0.92307,
  "recall": 0.81632,
  "f1_score": 0.86639,
  "roc_auc": 0.94121,
  "features": ["Time", "V1", ..., "Amount"],
  "n_estimators": 100,
  "max_depth": 15
}
```

---

## Node.js Axios Integration Example

To run fraud checks dynamically from a Node.js Express server:

```javascript
const axios = require('axios');

async function checkTransactionFraud(transactionPayload) {
    try {
        const response = await axios.post('http://localhost:8000/predict', transactionPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 2000 // 2 seconds safety threshold
        });
        return response.data; // { prediction: 0|1, risk_score: number, risk_level: string }
    } catch (error) {
        console.error('Fraud detection microservice offline. Falling back to heuristic rules...', error.message);
        // Fallback implementation here...
    }
}
```
