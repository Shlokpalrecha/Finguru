"""Configuration management for FinGuru"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings from environment"""
    
    # AWS
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-south-1"
    
    # S3
    s3_bucket_name: str = "finguru-uploads"
    
    # DynamoDB
    dynamodb_table_name: str = "finguru-ledger"
    
    # LLM API (OpenAI or OpenRouter)
    openai_api_key: str = ""
    openrouter_api_key: str = ""
    groq_api_key: str = ""  # For free Whisper transcription
    
    # App
    confidence_threshold: float = 0.85
    debug: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
