# FinGuru - AI Financial Assistant for Indian MSMEs

## AWS ImpactX Challenge Submission

FinGuru is a production-ready AI financial assistant that helps small business owners in India manage their expenses through receipt scanning and voice input in Hinglish.

## 🎯 Problem Statement

Indian MSMEs struggle with:
- Manual bookkeeping leading to errors
- GST compliance complexity
- Language barriers (most prefer Hinglish)
- Lack of affordable accounting tools

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│              (Vite + Tailwind + shadcn/ui)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────────┐
│                 FastAPI Backend (EC2)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Receipt   │  │    Voice    │  │     Reasoning       │  │
│  │   Handler   │  │   Handler   │  │      Engine         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
┌─────────▼────────┐ ┌─────▼──────┐    ┌───────▼───────┐
│  Amazon Textract │ │   Local    │    │   Spec-Driven │
│  (Receipt OCR)   │ │  Whisper   │    │   Rules Engine│
└─────────┬────────┘ └─────┬──────┘    └───────────────┘
          │                │
┌─────────▼────────────────▼──────────────────────────────────┐
│                      Amazon S3                               │
│            (Receipt Images + Audio Files)                    │
└─────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Amazon DynamoDB                           │
│              (Ledger Entries + Summaries)                    │
└─────────────────────────────────────────────────────────────┘
```

## 🎤 Why Local Whisper (Not AWS Transcribe)

FinGuru uses **OpenAI Whisper running locally** instead of cloud transcription services:

### Why This Matters
1. **No External AI Dependencies**: Runs completely offline after model download
2. **Better Hinglish Support**: Whisper handles code-switching (Hindi + English) excellently
3. **Zero Per-Request Cost**: No API calls = no usage fees
4. **Privacy**: Audio never leaves your server
5. **Hackathon-Ready**: Works without API keys or cloud quotas

### Why NOT AWS Transcribe
- AWS Transcribe has limited Hinglish support
- Requires internet connectivity
- Per-minute billing adds up
- This project demonstrates we can build AI features WITHOUT being a cloud API wrapper

### Model Options
| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| tiny | 39MB | Fastest | Basic |
| base | 74MB | Fast | Good (default) |
| small | 244MB | Medium | Better |
| medium | 769MB | Slow | Great |

Default is `base` - good balance of speed and accuracy for Hinglish.

## 🤖 How GenAI is Used (NOT a Wrapper)

FinGuru uses Generative AI as a **core reasoning engine**, not a chatbot wrapper:

1. **Structured Input Only**: AI receives parsed data from Textract/Whisper
2. **Spec-Driven Rules**: Accounting/GST rules are explicit specs, not prompts
3. **Strict JSON Output**: All AI outputs are validated against schemas
4. **Explainability**: Every decision includes human-readable reasoning
5. **Confidence Scoring**: Low confidence triggers user confirmation

### Why This Matters
- Traditional approach: "Hey AI, what category is this?"
- FinGuru approach: AI applies defined accounting specs to structured data

## 🚀 Features

### 1. Receipt Photo → Ledger Entry
- Upload receipt image
- Amazon Textract extracts: amount, date, vendor, GST
- Reasoning engine categorizes and validates
- Stored with full audit trail

### 2. Voice Expense → Ledger Entry (Local Whisper)
- Record Hinglish voice message
- **Local Whisper** converts to text (no cloud API)
- Reasoning engine parses and categorizes
- Example: "Aaj chai ke 120 rupaye kharch hue"

### 3. Daily Summary Dashboard
- Total spend breakdown
- Category-wise analysis
- GST liability snapshot
- Explainable categorizations

## 💰 Free Tier Deployment

| Service | Usage | Free Tier Limit |
|---------|-------|-----------------|
| EC2 | Backend API | 750 hrs/month t2.micro |
| S3 | File storage | 5GB storage |
| DynamoDB | Database | 25GB + 25 RCU/WCU |
| Textract | OCR | 1000 pages/month |
| Whisper | Speech-to-text | **FREE (local)** |

## 📦 Quick Start

### Prerequisites
- AWS Account with Free Tier
- Node.js 18+
- Python 3.11+
- AWS CLI configured
- FFmpeg installed (for audio processing)

### Install FFmpeg (Required for Whisper)
```bash
# Windows (with Chocolatey)
choco install ffmpeg

# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your AWS credentials

# First run will download Whisper model (~74MB for base)
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev
```

### AWS Setup
```bash
# Create S3 bucket
aws s3 mb s3://finguru-uploads-{your-id}

# Create DynamoDB table
aws dynamodb create-table \
  --table-name finguru-ledger \
  --attribute-definitions AttributeName=transaction_id,AttributeType=S \
  --key-schema AttributeName=transaction_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## 🎬 Demo Instructions

1. **Start Backend**: `uvicorn main:app --host 0.0.0.0 --port 8000`
   - First startup downloads Whisper model (~74MB)
   - Subsequent starts are instant
2. **Start Frontend**: `npm run dev`
3. **Demo Receipt Upload**:
   - Click "Upload Receipt"
   - Drop a receipt image
   - Watch extraction + categorization
   - See explanation for categorization
4. **Demo Voice Input**:
   - Click "Record Expense"
   - Say: "Aaj office supplies ke 500 rupaye kharch hue"
   - See transcription + categorization
   - Note: Uses browser's Web Speech API for real-time feedback
5. **View Dashboard**:
   - See daily summary
   - Check GST breakdown

## 📁 Project Structure

```
finguru/
├── backend/
│   ├── main.py              # FastAPI app (preloads Whisper)
│   ├── routers/
│   │   ├── receipts.py      # Receipt upload API
│   │   ├── voice.py         # Voice upload API (Whisper)
│   │   └── ledger.py        # Ledger CRUD API
│   ├── services/
│   │   ├── textract.py      # Amazon Textract integration
│   │   ├── transcribe.py    # LOCAL Whisper integration
│   │   ├── reasoning.py     # AI reasoning engine
│   │   └── dynamodb.py      # DynamoDB operations
│   ├── specs/
│   │   └── accounting.yaml  # Accounting rules spec
│   └── models/
│       └── schemas.py       # Pydantic models
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   └── lib/             # Utilities
│   └── package.json
└── README.md
```

## 🔒 Security

- IAM roles with least privilege
- No secrets in frontend code
- S3 server-side encryption
- DynamoDB encryption at rest
- Input validation on all endpoints
- Audio processed locally (never sent to external APIs)

## 🎯 Voice Flow Output Format

Every voice entry returns structured JSON:
```json
{
  "transcript": "Aaj chai ke 120 rupaye kharch hue",
  "amount": 120,
  "category": "Food",
  "gst_rate": 5,
  "gst_amount": 6,
  "confidence": 0.91,
  "explanation": "The phrase 'chai' indicates a food expense under food services."
}
```

No unstructured text. No hallucinated fields.

## 👥 Team

Built for AWS ImpactX Challenge - Techfest, IIT Bombay

## 📄 License

MIT License
