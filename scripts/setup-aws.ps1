# FinGuru AWS Setup Script (PowerShell)
# Run this to create required AWS resources

param(
    [string]$BucketName = "finguru-uploads-$(Get-Date -Format 'yyyyMMddHHmmss')",
    [string]$TableName = "finguru-ledger",
    [string]$Region = "ap-south-1"
)

Write-Host "🚀 Setting up FinGuru AWS Resources" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Bucket: $BucketName"
Write-Host "Table: $TableName"
Write-Host "Region: $Region"
Write-Host ""

# Create S3 Bucket
Write-Host "📦 Creating S3 bucket..." -ForegroundColor Yellow
try {
    aws s3 mb "s3://$BucketName" --region $Region
} catch {
    Write-Host "Bucket may already exist" -ForegroundColor Gray
}

# Enable encryption
Write-Host "🔒 Enabling S3 encryption..." -ForegroundColor Yellow
$encryptionConfig = @"
{
    "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
        }
    }]
}
"@
try {
    aws s3api put-bucket-encryption --bucket $BucketName --server-side-encryption-configuration $encryptionConfig
} catch {
    Write-Host "Encryption may already be enabled" -ForegroundColor Gray
}

# Block public access
Write-Host "🛡️ Blocking public access..." -ForegroundColor Yellow
$publicAccessConfig = @"
{
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
}
"@
try {
    aws s3api put-public-access-block --bucket $BucketName --public-access-block-configuration $publicAccessConfig
} catch {
    Write-Host "Public access block may already be set" -ForegroundColor Gray
}

# Create DynamoDB Table
Write-Host "📊 Creating DynamoDB table..." -ForegroundColor Yellow
try {
    aws dynamodb create-table `
        --table-name $TableName `
        --attribute-definitions AttributeName=transaction_id,AttributeType=S `
        --key-schema AttributeName=transaction_id,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $Region
} catch {
    Write-Host "Table may already exist" -ForegroundColor Gray
}

# Wait for table
Write-Host "⏳ Waiting for table to be active..." -ForegroundColor Yellow
aws dynamodb wait table-exists --table-name $TableName --region $Region

Write-Host ""
Write-Host "✅ AWS Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Add these to your backend/.env file:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "S3_BUCKET_NAME=$BucketName"
Write-Host "DYNAMODB_TABLE_NAME=$TableName"
Write-Host "AWS_REGION=$Region"
Write-Host ""
