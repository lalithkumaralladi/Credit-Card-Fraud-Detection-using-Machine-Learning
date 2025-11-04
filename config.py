"""
Configuration module for Credit Card Fraud Detection Application
Loads settings from environment variables with sensible defaults
"""

import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings loaded from environment variables"""
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent
    
    # Application Settings
    APP_NAME: str = os.getenv("APP_NAME", "Credit Card Fraud Detection")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    WORKERS: int = int(os.getenv("WORKERS", "4"))
    
    # Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-to-random-string-in-production")
    ALLOWED_HOSTS: List[str] = os.getenv("ALLOWED_HOSTS", "*").split(",")
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # Directory Configuration
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(BASE_DIR / "frontend" / "uploads"))
    MODEL_DIR: str = os.getenv("MODEL_DIR", str(BASE_DIR / "models" / "saved_models"))
    TEMPLATES_DIR: str = os.getenv("TEMPLATES_DIR", str(BASE_DIR / "frontend" / "templates"))
    STATIC_DIR: str = os.getenv("STATIC_DIR", str(BASE_DIR / "frontend" / "static"))
    
    # File Upload Settings
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "500"))
    MAX_FILE_SIZE: int = MAX_FILE_SIZE_MB * 1024 * 1024  # Convert to bytes
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    ACCESS_LOG: bool = os.getenv("ACCESS_LOG", "True").lower() == "true"
    
    # Performance Settings
    ENABLE_COMPRESSION: bool = os.getenv("ENABLE_COMPRESSION", "True").lower() == "true"
    CACHE_STATIC_FILES: bool = os.getenv("CACHE_STATIC_FILES", "True").lower() == "true"
    TIMEOUT_KEEP_ALIVE: int = int(os.getenv("TIMEOUT_KEEP_ALIVE", "30"))
    LIMIT_CONCURRENCY: int = int(os.getenv("LIMIT_CONCURRENCY", "1000"))
    LIMIT_MAX_REQUESTS: int = int(os.getenv("LIMIT_MAX_REQUESTS", "10000"))
    
    # Feature Flags
    ENABLE_SMOTE: bool = os.getenv("ENABLE_SMOTE", "True").lower() == "true"
    MAX_SMOTE_SAMPLES: int = int(os.getenv("MAX_SMOTE_SAMPLES", "100000"))
    SAMPLE_LARGE_DATASETS: bool = os.getenv("SAMPLE_LARGE_DATASETS", "True").lower() == "true"
    LARGE_DATASET_THRESHOLD: int = int(os.getenv("LARGE_DATASET_THRESHOLD", "50000"))
    
    # Firebase/Google Authentication Credentials
    FIREBASE_API_KEY: str = os.getenv("FIREBASE_API_KEY", "")
    FIREBASE_AUTH_DOMAIN: str = os.getenv("FIREBASE_AUTH_DOMAIN", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_STORAGE_BUCKET: str = os.getenv("FIREBASE_STORAGE_BUCKET", "")
    FIREBASE_MESSAGING_SENDER_ID: str = os.getenv("FIREBASE_MESSAGING_SENDER_ID", "")
    FIREBASE_APP_ID: str = os.getenv("FIREBASE_APP_ID", "")
    
    @classmethod
    def create_directories(cls):
        """Create necessary directories if they don't exist"""
        os.makedirs(cls.UPLOAD_DIR, exist_ok=True)
        os.makedirs(cls.MODEL_DIR, exist_ok=True)
        
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production environment"""
        return cls.APP_ENV.lower() == "production"
    
    @classmethod
    def is_development(cls) -> bool:
        """Check if running in development environment"""
        return cls.APP_ENV.lower() == "development"

# Create a settings instance
settings = Settings()

# Create necessary directories
settings.create_directories()
