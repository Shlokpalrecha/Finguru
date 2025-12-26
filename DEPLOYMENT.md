# FinGuru Deployment Guide

## Prerequisites

- AWS Account (Free Tier eligible)
- AWS CLI configured with credentials
- Python 3.11+
- Node.js 18+
- OpenAI API key (for reasoning engine)

## Step 1: AWS Setup

### Option A: Using Setup Script (Recommended)

```powershell
# Windows PowerShell
cd finguru/scripts
.\setup-aws.ps1 -BucketName "your-bucket-name" -TableName "finguru-ledger" -Region "ap-south-1"
```

```bash
# Linux/Mac
cd finguru/scripts
chmod +x setup-aws.sh
./setup-aws.sh your-bucket-name finguru-ledger ap-south-1
```

### Option B: Manual Setup

```bash
# Create S3 bucket
aws s3 mb s3://finguru-uploads-YOUR-ID --region ap-south-1

# Create DynamoDB table
aws dynamodb create-table \
  --table-name finguru-ledger \
  --attribute-definitions AttributeName=transaction_id,AttributeType=S \
  --key-schema AttributeName=transaction_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

## Step 2: Backend Setup

```bash
cd finguru/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables (.env)

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=finguru-uploads-YOUR-ID
DYNAMODB_TABLE_NAME=finguru-ledger
OPENAI_API_KEY=your_openai_key
CONFIDENCE_THRESHOLD=0.85
DEBUG=false
```

### Run Backend

```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

## Step 3: Frontend Setup

```bash
cd finguru/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with backend URL
```

### Environment Variables (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

### Run Frontend

```bash
# Development
npm run dev

# Build for production
npm run build
```

## Step 4: EC2 Deployment (Production)

### Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Select Amazon Linux 2023 AMI
3. Choose t2.micro (Free Tier)
4. Configure Security Group:
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - Custom TCP (8000) from anywhere
5. Create/select key pair
6. Launch instance

### Setup EC2

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install dependencies
sudo yum update -y
sudo yum install -y python3.11 python3.11-pip nodejs npm git

# Clone your repo (or upload files)
git clone your-repo-url finguru
cd finguru

# Setup backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
nano .env
# Add your environment variables

# Run with systemd (create service file)
sudo nano /etc/systemd/system/finguru.service
```

### Systemd Service File

```ini
[Unit]
Description=FinGuru API
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/finguru/backend
Environment="PATH=/home/ec2-user/finguru/backend/venv/bin"
ExecStart=/home/ec2-user/finguru/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable finguru
sudo systemctl start finguru

# Check status
sudo systemctl status finguru
```

### Frontend Deployment (S3 Static Hosting)

```bash
# Build frontend
cd finguru/frontend
npm run build

# Create S3 bucket for hosting
aws s3 mb s3://finguru-frontend-YOUR-ID

# Enable static hosting
aws s3 website s3://finguru-frontend-YOUR-ID --index-document index.html --error-document index.html

# Upload build
aws s3 sync dist/ s3://finguru-frontend-YOUR-ID --acl public-read

# Update VITE_API_URL to point to EC2 backend
```

## Step 5: Verify Deployment

1. Access frontend: `http://finguru-frontend-YOUR-ID.s3-website-ap-south-1.amazonaws.com`
2. Test receipt upload
3. Test voice recording
4. Check ledger entries
5. View dashboard summary

## Troubleshooting

### Backend Issues

```bash
# Check logs
sudo journalctl -u finguru -f

# Test API
curl http://localhost:8000/health
```

### AWS Permission Issues

Ensure IAM user/role has these permissions:
- `s3:PutObject`, `s3:GetObject` on your bucket
- `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Scan`, `dynamodb:DeleteItem`
- `textract:AnalyzeExpense`, `textract:DetectDocumentText`
- `transcribe:StartTranscriptionJob`, `transcribe:GetTranscriptionJob`

### CORS Issues

If frontend can't reach backend, check CORS settings in `main.py`.

## Free Tier Limits

| Service | Free Tier Limit | FinGuru Usage |
|---------|-----------------|---------------|
| EC2 | 750 hrs/month t2.micro | ~24/7 running |
| S3 | 5GB storage | Receipts + Audio |
| DynamoDB | 25GB + 25 RCU/WCU | Ledger entries |
| Textract | 1000 pages/month | Receipt scans |
| Transcribe | 60 mins/month | Voice recordings |

Monitor usage in AWS Console → Billing → Free Tier.
