import os
import time
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

from utils import get_logger, get_absolute_path

logger = get_logger("train")

def run_training_pipeline():
    logger.info("Starting the Machine Learning model training pipeline...")
    
    # 1. Resolve paths
    dataset_path = get_absolute_path("dataset/creditcard.csv")
    models_dir = Path(get_absolute_path("models"))
    models_dir.mkdir(exist_ok=True)
    
    model_save_path = models_dir / "fraud_model.pkl"
    scaler_save_path = models_dir / "scaler.pkl"
    
    # Check if dataset exists
    if not os.path.exists(dataset_path):
        logger.error(f"Dataset not found at: {dataset_path}")
        raise FileNotFoundError(f"Dataset not found at: {dataset_path}")
        
    # 2. Load dataset
    logger.info(f"Loading dataset from {dataset_path}...")
    start_time = time.time()
    df = pd.read_csv(dataset_path)
    logger.info(f"Dataset loaded successfully in {time.time() - start_time:.2f} seconds. Shape: {df.shape}")
    
    # 3. Analyze dataset & Handle missing values
    logger.info("Performing exploratory analysis and checking for missing values...")
    null_counts = df.isnull().sum()
    total_nulls = null_counts.sum()
    
    if total_nulls > 0:
        logger.warning(f"Found {total_nulls} missing values across features. Imputing using column medians...")
        df.fillna(df.median(), inplace=True)
    else:
        logger.info("Zero missing values detected in the dataset. Proceeding...")
        
    # Analyze class distribution
    class_counts = df['Class'].value_counts()
    fraud_pct = (class_counts.get(1, 0) / len(df)) * 100
    logger.info(f"Class Distribution: Safe = {class_counts.get(0, 0)}, Fraud = {class_counts.get(1, 0)} ({fraud_pct:.3f}%)")
    
    # 4. Split data (80% train, 20% test)
    logger.info("Splitting dataset into 80% training and 20% test sets (stratified)...")
    X = df.drop(columns=['Class'])
    y = df['Class']
    
    # Stratified split to ensure train/test sets have the same ratio of fraud cases
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
    
    # 5. Scale features
    # Strict Featurization Ordering: fit scaler on training data ONLY, then transform both
    logger.info("Fitting and applying StandardScaler on features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save the fitted scaler
    logger.info(f"Saving fitted scaler to {scaler_save_path}...")
    joblib.dump(scaler, scaler_save_path)
    
    # 6. Train RandomForestClassifier (Handling class imbalance natively)
    logger.info("Training RandomForestClassifier model (class_weight='balanced', n_jobs=-1)...")
    model_start_time = time.time()
    # n_jobs=-1 executes training in parallel across all CPU threads
    # max_depth=15 prevents excessive tree growth and limits file size / overfitting
    # min_samples_split=5 helps regularize the tree structures
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
        verbose=0
    )
    model.fit(X_train_scaled, y_train)
    logger.info(f"Model training completed in {time.time() - model_start_time:.2f} seconds.")
    
    # 7. Evaluate model
    logger.info("Evaluating model performance on test dataset...")
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_prob)
    
    # 8. Print evaluation report
    print("\n" + "="*50)
    print("           MODEL EVALUATION REPORT")
    print("="*50)
    print(f"Accuracy:  {accuracy:.6f}")
    print(f"Precision: {precision:.6f} (Proportion of predicted fraud that is actual fraud)")
    print(f"Recall:    {recall:.6f} (Proportion of actual fraud correctly caught)")
    print(f"F1 Score:  {f1:.6f} (Harmonic mean of precision and recall)")
    print(f"ROC AUC:   {roc_auc:.6f}")
    print("="*50)
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, digits=6))
    
    # 9. Save model
    logger.info(f"Saving trained RandomForest model to {model_save_path}...")
    joblib.dump(model, model_save_path)
    
    # 10. Save metadata info
    import json
    metadata = {
        "algorithm": "Random Forest Classifier",
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "roc_auc": roc_auc,
        "features": list(X.columns),
        "n_estimators": 100,
        "max_depth": 15
    }
    metadata_path = models_dir / "metadata.json"
    logger.info(f"Saving model metadata to {metadata_path}...")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)
    
    # 11. Generate confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print("\nConfusion Matrix:")
    print(f"True Negatives (Legitimate correctly identified): {cm[0][0]}")
    print(f"False Positives (Legitimate flagged as fraud):    {cm[0][1]}")
    print(f"False Negatives (Fraud missed):                   {cm[1][0]}")
    print(f"True Positives (Fraud correctly identified):      {cm[1][1]}")
    print("="*50)
    
    # 12. Display feature importance (Top 10 features)
    importances = model.feature_importances_
    feature_names = X.columns
    indices = np.argsort(importances)[::-1]
    
    print("\nTop 10 Feature Importances:")
    for rank in range(min(10, len(feature_names))):
        idx = indices[rank]
        print(f"{rank + 1}. Feature: {feature_names[idx]:<10} Importance: {importances[idx]:.6f}")
    print("="*50 + "\n")
    
    logger.info("Training and evaluation pipeline finished successfully.")

if __name__ == "__main__":
    run_training_pipeline()
