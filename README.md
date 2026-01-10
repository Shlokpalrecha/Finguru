# FinGuru - AI Financial Assistant for Indian MSMEs

## OpenAI Academy × NxtWave Buildathon Submission

FinGuru is a **spec-driven, human-in-the-loop GenAI system** that helps small business owners in India manage their expenses through receipt scanning and voice input in Hinglish.

> **This is NOT a chatbot.** GPT-4.1 is used as a constrained reasoning engine with structured outputs, confidence scoring, and mandatory human oversight.

---

## 🎯 Why This Approach?

### Why GPT-4.1 (Not a Chatbot)
Traditional chatbots let AI "decide everything" with free-form responses. FinGuru takes a different approach:

| Chatbot Approach ❌ | FinGuru Approach ✅ |
|---------------------|---------------------|
| "Hey AI, categorize this" | AI applies explicit accounting specs |
| Free-form text output | Strict JSON schema enforcement |
| AI guesses silently | Confidence scores trigger human review |
| Hidden reasoning | Every decision is explainable |
| No constraints | Spec-driven, auditable logic |

### Why Human-in-the-Loop
```
IF confidence < 0.85:
    → Ask user to confirm
    → Show explanation
    → Never auto-commit
```

This builds trust in regulated domains like accounting.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│              (Clean fintech UI, no chatbot)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────────┐
│                 FastAPI Backend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Perception  │  │  Reasoning  │  │    Validation       │  │
│  │   Layer     │  │   Layer     │  │      Layer          │  │
│  │ (OCR/STT)   │  │  (GPT-4.1)  │  │  (Rules+Confidence) │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
┌─────────▼────────┐ ┌─────▼──────┐    ┌───────▼───────┐
│  Amazon Textract │ │  GPT-4.1   │    │   Accounting  │
│  (Receipt OCR)   │ │ Structured │    │     Specs     │
│                  │ │   Output   │    │   (YAML)      │
│  Local Whisper   │ │            │    │               │
│  (Voice STT)     │ │            │    │               │
└──────────────────┘ └────────────┘    └───────────────┘
```

---

## 🤖 GPT-4.1 Usage (The Right Way)

### System Prompt = Policy
```python
"""You are FinGuru's Expense Reasoning Engine.
You are NOT a chatbot. You are a constrained reasoning engine that:
1. Analyzes expense data
2. Applies Indian GST rules from the specification
3. Produces structured JSON output
4. Explains every decision"""
```

### JSON Schema Enforcement
```python
response_format={
    "type": "json_schema",
    "json_schema": {
        "name": "expense_reasoning",
        "strict": True,
        "schema": {
            "amount": {"type": "number"},
            "category": {"type": "string", "enum": [...]},
            "confidence": {"type": "number"},
            "rule_applied": {"type": "string"},
            "explanation": {"type": "string"}
        }
    }
}
```

### Output Example
```json
{
  "amount": 450,
  "category": "food",
  "confidence": 0.91,
  "rule_applied": "Food services category matched via keywords: chai, restaurant",
  "gst_reasoning": "5% GST applied per Indian GST rules for food services",
  "explanation": "This expense is categorized as Food & Beverages based on the mention of 'chai'. GST of 5% is applicable."
}
```

---

## 📋 Spec-Driven Development

All accounting logic is defined in `specs/accounting.yaml`:

```yaml
expense_categories:
  food:
    display_name: "Food & Beverages"
    gst_rate: 5
    keywords: [chai, tea, coffee, lunch, dinner, restaurant]
  
  transport:
    display_name: "Transportation"
    gst_rate: 5
    keywords: [auto, taxi, uber, ola, petrol, diesel]

rules:
  explanation_required: true
  confidence_threshold: 0.85

output_format: strict_json
```

**Why specs matter:**
- Source of truth for all decisions
- Auditable and version-controlled
- GPT-4.1 references specs, doesn't invent rules
- Easy to update without code changes

---

## 🚀 Features

### 1. Receipt Photo → Ledger Entry
- Upload receipt image
- Textract extracts text
- GPT-4.1 reasons with specs
- Shows "Why?" explanation
- Confidence-based confirmation

### 2. Voice Expense → Ledger Entry
- Speak in Hinglish: "Aaj chai ke 120 rupaye kharch hue"
- Local Whisper transcribes
- GPT-4.1 extracts amount, category
- Human confirms if uncertain

### 3. "Why This Entry?" Button
Every entry shows:
- Which rule was applied
- Why GST rate was chosen
- Confidence score
- Full reasoning chain

### 4. CA Companion
- Daily expense summary
- Category breakdown
- GST liability snapshot
- AI-generated insights

---

## 🔒 Human-in-the-Loop Design

```
┌─────────────────────────────────────────┐
│           User Input                     │
│    (Receipt / Voice / Text)             │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│         GPT-4.1 Reasoning               │
│    (Constrained, Spec-Driven)           │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│      Confidence Check                    │
│                                          │
│   confidence >= 0.85?                    │
│      YES → Auto-commit                   │
│      NO  → Ask user to confirm           │
└─────────────────────────────────────────┘
```

---

## 📦 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key (for GPT-4.1)
- AWS credentials (for Textract, S3, DynamoDB)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your OPENAI_API_KEY and AWS credentials

# Run
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Demo
1. Open http://localhost:3000
2. Upload a receipt → See structured extraction + explanation
3. Record voice expense → See transcription + categorization
4. Click "Why?" on any entry → See full reasoning
5. Check CA tab → See insights

---


## 📁 Project Structure

```
finguru/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── routers/
│   │   ├── receipts.py      # Receipt upload API
│   │   ├── voice.py         # Voice upload API
│   │   ├── ledger.py        # Ledger CRUD
│   │   └── advisor.py       # CA Companion
│   ├── services/
│   │   ├── reasoning.py     # GPT-4.1 reasoning engine
│   │   ├── textract.py      # AWS Textract
│   │   ├── transcribe.py    # Local Whisper
│   │   └── dynamodb.py      # Database
│   └── specs/
│       └── accounting.yaml  # Accounting rules (source of truth)
├── frontend/
│   └── src/
│       ├── pages/           # React pages
│       └── components/      # UI components
└── README.md
```

---

## 🏆 Buildathon Alignment

| Criteria | How FinGuru Addresses It |
|----------|--------------------------|
| **Meaningful GPT-4.1 use** | Constrained reasoning engine, not chatbot |
| **Human-AI collaboration** | Confidence-based confirmation flow |
| **Explainability** | "Why?" button on every entry |
| **Real-world problem** | MSME accounting + GST compliance |
| **Learning value** | Teaches responsible AI in regulated domains |

---

## 👥 Team

Built for OpenAI Academy × NxtWave Buildathon

---

## 📄 License

MIT License
