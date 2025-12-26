"""Amazon S3 service for file storage"""
import boto3
from uuid import uuid4
from datetime import datetime
from config import get_settings


class S3Service:
    """Handle S3 operations for receipts and audio files"""
    
    def __init__(self):
        settings = get_settings()
        self.s3 = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.bucket = settings.s3_bucket_name
    
    def upload_receipt(self, file_content: bytes, content_type: str) -> str:
        """Upload receipt image to S3"""
        date_prefix = datetime.utcnow().strftime("%Y/%m/%d")
        file_id = str(uuid4())
        extension = self._get_extension(content_type)
        key = f"receipts/{date_prefix}/{file_id}{extension}"
        
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=file_content,
            ContentType=content_type,
            ServerSideEncryption='AES256'
        )
        
        return f"s3://{self.bucket}/{key}"
    
    def upload_audio(self, file_content: bytes, content_type: str) -> str:
        """Upload audio file to S3"""
        date_prefix = datetime.utcnow().strftime("%Y/%m/%d")
        file_id = str(uuid4())
        extension = self._get_extension(content_type)
        key = f"audio/{date_prefix}/{file_id}{extension}"
        
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=file_content,
            ContentType=content_type,
            ServerSideEncryption='AES256'
        )
        
        return f"s3://{self.bucket}/{key}"
    
    def get_presigned_url(self, s3_uri: str, expiration: int = 3600) -> str:
        """Generate presigned URL for viewing"""
        # Parse s3://bucket/key format
        parts = s3_uri.replace("s3://", "").split("/", 1)
        bucket = parts[0]
        key = parts[1] if len(parts) > 1 else ""
        
        return self.s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=expiration
        )
    
    def _get_extension(self, content_type: str) -> str:
        """Get file extension from content type"""
        mapping = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'audio/webm': '.webm',
            'audio/mp3': '.mp3',
            'audio/mpeg': '.mp3',
            'audio/wav': '.wav',
            'audio/ogg': '.ogg',
        }
        return mapping.get(content_type, '.bin')


# Singleton instance
s3_service = S3Service()
