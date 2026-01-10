# Railway Deployment Guide

## Quick Deploy (Both Frontend + Backend)

### Step 1: Deploy Backend

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `Finguru` repository
4. Click **"Add Service"** → **"GitHub Repo"** (same repo)
5. Configure the backend service:
   - Click on the service → **Settings**
   - Set **Root Directory**: `finguru/backend`
   - Set **Watch Paths**: `/finguru/backend/**`

6. Add Environment Variables (click **Variables** tab):
   ```
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=ap-south-1
   S3_BUCKET_NAME=finguru-receipts
   DYNAMODB_TABLE_NAME=finguru-ledger
   OPENAI_API_KEY=your_openai_key
   CONFIDENCE_THRESHOLD=0.85
   ```

7. Deploy will start automatically

### Step 2: Deploy Frontend

1. In the same Railway project, click **"New"** → **"GitHub Repo"**
2. Select the same `Finguru` repository again
3. Configure the frontend service:
   - Click on the service → **Settings**
   - Set **Root Directory**: `finguru/frontend`
   - Set **Build Command**: `npm run build`
   - Set **Start Command**: `npx serve dist -s -l $PORT`
   - Set **Watch Paths**: `/finguru/frontend/**`

4. Add Environment Variable:
   ```
   VITE_API_URL=https://YOUR_BACKEND_URL/api
   ```
   (Get the backend URL from the backend service's **Settings** → **Domains**)

5. Generate a domain for frontend: **Settings** → **Domains** → **Generate Domain**

### Step 3: Update Frontend API URL

After backend deploys:
1. Copy the backend URL (e.g., `https://finguru-backend-production.up.railway.app`)
2. Go to frontend service → **Variables**
3. Set `VITE_API_URL` to `https://YOUR_BACKEND_URL/api`
4. Redeploy frontend

## Environment Variables Reference

### Backend
| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_REGION` | AWS region (e.g., `ap-south-1`) |
| `S3_BUCKET_NAME` | S3 bucket for receipts |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4.1 |
| `CONFIDENCE_THRESHOLD` | AI confidence threshold (0.85) |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

## Troubleshooting

**Build fails on backend:**
- Check if all environment variables are set
- Whisper model download may take time on first deploy

**Frontend can't connect to backend:**
- Ensure `VITE_API_URL` is set correctly with `/api` suffix
- Check CORS settings in backend

**Voice feature not working:**
- Whisper requires FFmpeg (included in nixpacks.toml)
- First request may be slow as model loads

## Free Tier Limits

Railway free tier includes:
- $5/month credit
- Enough for demo/hackathon usage
- Services sleep after inactivity (wake on request)
