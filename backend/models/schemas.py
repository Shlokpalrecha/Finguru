"""Pydantic models for FinGuru API"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from uuid import uuid4


class LedgerEntry(BaseModel):
    """Core ledger entry model - strict schema"""
    transaction_id: str = Field(default_factory=lambda: str(uuid4()))
    date: str = Field(..., description="ISO format date")
    amount: float = Field(..., gt=0, description="Amount in INR")
    category: str = Field(..., description="Expense category")
    gst_rate: float = Field(..., ge=0, le=28, description="GST rate percentage")
    gst_amount: float = Field(..., ge=0, description="GST amount in INR")
    source: Literal["receipt", "voice"] = Field(..., description="Entry source")
    confidence: float = Field(..., ge=0, le=1, description="AI confidence score")
    explanation: str = Field(..., min_length=10, description="Human-readable explanation")
    vendor_name: Optional[str] = None
    vendor_gstin: Optional[str] = None
    receipt_url: Optional[str] = None
    audio_url: Optional[str] = None
    raw_text: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ReceiptExtraction(BaseModel):
    """Textract extraction result"""
    raw_text: str
    amount: Optional[float] = None
    date: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_gstin: Optional[str] = None
    items: list[str] = []
    confidence: float = 0.0


class VoiceTranscription(BaseModel):
    """Transcribe result"""
    raw_text: str
    language: str = "hi-IN"
    confidence: float = 0.0


class ReasoningInput(BaseModel):
    """Input to reasoning engine"""
    source: Literal["receipt", "voice"]
    extracted_text: str
    extracted_amount: Optional[float] = None
    extracted_date: Optional[str] = None
    extracted_vendor: Optional[str] = None
    extracted_gstin: Optional[str] = None


class ReasoningOutput(BaseModel):
    """Output from reasoning engine - strict JSON"""
    amount: float
    category: str
    gst_rate: float
    gst_amount: float
    confidence: float
    explanation: str
    vendor_name: Optional[str] = None
    needs_confirmation: bool = False
    confirmation_reason: Optional[str] = None


class DailySummary(BaseModel):
    """Daily summary model"""
    date: str
    total_amount: float
    total_gst: float
    entry_count: int
    by_category: dict[str, float]
    gst_by_category: dict[str, float]


class UploadResponse(BaseModel):
    """Response for upload endpoints"""
    success: bool
    ledger_entry: Optional[LedgerEntry] = None
    needs_confirmation: bool = False
    confirmation_reason: Optional[str] = None
    error: Optional[str] = None


class ConfirmationRequest(BaseModel):
    """User confirmation for low-confidence entries"""
    transaction_id: str
    confirmed_amount: Optional[float] = None
    confirmed_category: Optional[str] = None
    user_notes: Optional[str] = None
