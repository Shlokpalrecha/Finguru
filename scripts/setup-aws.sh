#!/bin/bash
# FinGuru AWS Setup Script
# Run this to create required AWS resources

set -e

# Configuration
BUCKET_NAME="${1:-finguru-uploads-$(date +%s)}"
TABLE_NAME="${2:-finguru-ledger}"
REGION="${3:-ap-south-1}"

echo "🚀 Setting up FinGuru AWS Resources"
echo "=================================="
echo "Bucket: $BUCKET_NAME"
echo "Table: $TABLE_NAME"
echo "Region: $REGION"
echo ""

# Create S3 Bucket
echo "📦 Creating S3 bucket..."
aws s3 mb "s3://$BUCKET_NAME" --region "$REGION" 2>/dev/null || echo "Bucket may already exist"

# Enable encryption
echo "🔒 Enabling S3 encryption..."
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }' 2>/dev/null || echo "Encryption may already be enabled"

# Block public access
echo "🛡️ Blocking public access..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration '{
        "BlockPublicAcls": true,
        "IgnorePublicAcls": true,
        "BlockPublicPolicy": true,
        "RestrictPublicBuckets": true
    }' 2>/dev/null || echo "Public access block may already be set"

# Create DynamoDB Table
echo "📊 Creating DynamoDB table..."
aws dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --attribute-definitions \
        AttributeName=transaction_id,AttributeType=S \
    --key-schema \
        AttributeName=transaction_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" 2>/dev/null || echo "Table may already exist"

# Wait for table to be active
echo "⏳ Waiting for table to be active..."
aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"

echo ""
echo "✅ AWS Setup Complete!"
echo ""
echo "Add these to your backend/.env file:"
echo "=================================="
echo "S3_BUCKET_NAME=$BUCKET_NAME"
echo "DYNAMODB_TABLE_NAME=$TABLE_NAME"
echo "AWS_REGION=$REGION"
echo ""
