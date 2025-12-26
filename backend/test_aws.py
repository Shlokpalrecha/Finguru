import boto3
from dotenv import load_dotenv
import os

load_dotenv()

key = os.getenv('AWS_ACCESS_KEY_ID')
secret = os.getenv('AWS_SECRET_ACCESS_KEY')
region = os.getenv('AWS_REGION')
bucket = os.getenv('S3_BUCKET_NAME')

print(f"Region: {region}")
print(f"Bucket: {bucket}")

s3 = boto3.client('s3',
    aws_access_key_id=key,
    aws_secret_access_key=secret,
    region_name=region
)

# Check if bucket exists
try:
    s3.head_bucket(Bucket=bucket)
    print(f"✓ S3 bucket '{bucket}' exists!")
except Exception as e:
    print(f"✗ S3 bucket error: {e}")

# Check DynamoDB table
dynamodb = boto3.client('dynamodb',
    aws_access_key_id=key,
    aws_secret_access_key=secret,
    region_name=region
)

table = os.getenv('DYNAMODB_TABLE_NAME')
try:
    dynamodb.describe_table(TableName=table)
    print(f"✓ DynamoDB table '{table}' exists!")
except Exception as e:
    print(f"✗ DynamoDB error: {e}")
