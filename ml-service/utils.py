import os
import logging
from pathlib import Path

# Base Directory of the ml-service components
BASE_DIR = Path(__file__).resolve().parent

def get_logger(name: str) -> logging.Logger:
    """
    Creates and configures a standard logger instance.
    Logs are written to both console and a rolling file in ml-service/logs/.
    """
    logger = logging.getLogger(name)
    # Avoid duplicate handlers if logger is imported multiple times
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Define log format
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] - %(message)s'
        )
        
        # Console Handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # File Handler
        log_dir = BASE_DIR / "logs"
        try:
            log_dir.mkdir(exist_ok=True)
            file_handler = logging.FileHandler(log_dir / "ml_service.log", encoding="utf-8")
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            # Fallback if unable to create directory or log file
            print(f"Warning: Could not configure file logger: {e}")
            
    return logger

def get_absolute_path(relative_path: str) -> str:
    """
    Resolves a relative path to an absolute path based on the microservice base directory.
    """
    return str((BASE_DIR / relative_path).resolve())
