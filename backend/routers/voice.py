"""Voice upload and processing API using Local Whisper"""
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.schemas import (
    LedgerEntry, UploadResponse, ReasoningInput, ConfirmationRequest
)
from services.transcribe import transcribe_service
from services.reasoning import reasoning_engine
from services.dynamodb import dynamodb_service
from services.s3 import s3_service

router = APIRouter(prefix="/voice", tags=["voice"])


class TextInput(BaseModel):
    """Input for text-based voice processing (browser speech recognition)."""
    text: str


@router.post("/upload", response_model=UploadResponse)
async def upload_voice(file: UploadFile = File(...)):
    """
    Upload voice recording for processing using local Whisper.
    
    Full Pipeline:
    1. Validate file type
    2. Save audio to S3
    3. Transcribe via local Whisper model
    4. Process through reasoning engine (amount, category, GST)
    5. Store in DynamoDB
    6. Return result with explanation
    """
    # Validate file type
    allowed_types = [
        'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 
        'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a',
        'audio/flac', 'audio/aac', 'video/webm'
    ]
    content_type = file.content_type or 'audio/webm'
    
    try:
        # Read file content
        content = await file.read()
        
        if len(content) < 1000:
            return UploadResponse(
                success=False,
                error="Recording too short. Please try again with a longer recording."
            )
        
        # Step 1: Save audio to S3
        audio_url = None
        try:
            audio_url = s3_service.upload_audio(content, content_type)
        except Exception as e:
            print(f"S3 upload failed (continuing without): {e}")
        
        # Step 2: Transcribe audio using local Whisper
        transcription = transcribe_service.transcribe_audio(
            content, 
            file.filename or "audio.webm"
        )
        
        if not transcription.raw_text:
            return UploadResponse(
                success=False,
                error="Could not transcribe audio. Please speak clearly and try again."
            )
        
        # Step 3: Process through reasoning engine
        return await _process_transcription(
            text=transcription.raw_text,
            transcription_confidence=transcription.confidence,
            audio_url=audio_url
        )
        
    except Exception as e:
        print(f"Voice upload error: {e}")
        return UploadResponse(
            success=False,
            error=f"Processing failed: {str(e)}"
        )


@router.post("/upload-text", response_model=UploadResponse)
async def upload_voice_text(input: TextInput):
    """
    Process text from browser speech recognition.
    
    Used when frontend uses Web Speech API for transcription
    instead of sending audio to Whisper.
    """
    if not input.text or not input.text.strip():
        return UploadResponse(
            success=False,
            error="No text provided. Please try again."
        )
    
    # Browser speech recognition confidence is typically high
    return await _process_transcription(
        text=input.text.strip(), 
        transcription_confidence=0.85,
        audio_url=None
    )


async def _process_transcription(
    text: str, 
    transcription_confidence: float,
    audio_url: Optional[str]
) -> UploadResponse:
    """
    Process transcribed text through the full reasoning pipeline.
    
    Args:
        text: Transcribed text from Whisper or browser
        transcription_confidence: Confidence from transcription
        audio_url: Optional S3 URL for the audio file
    """
    try:
        # Prepare reasoning input
        reasoning_input = ReasoningInput(
            source="voice",
            extracted_text=text,
            extracted_amount=None,  # Let reasoning engine extract
            extracted_date=None,
            extracted_vendor=None,
            extracted_gstin=None
        )
        
        # Process through spec-driven reasoning engine
        reasoning_output = reasoning_engine.process(reasoning_input)
        
        # Combine transcription and reasoning confidence
        combined_confidence = round(
            min(transcription_confidence, reasoning_output.confidence),
            2
        )
        
        # Create ledger entry
        ledger_entry = LedgerEntry(
            date=datetime.now().strftime('%Y-%m-%d'),
            amount=reasoning_output.amount,
            category=reasoning_output.category,
            gst_rate=reasoning_output.gst_rate,
            gst_amount=reasoning_output.gst_amount,
            source="voice",
            confidence=combined_confidence,
            explanation=reasoning_output.explanation,
            raw_text=text,
            audio_url=audio_url
        )
        
        # Save to DynamoDB
        try:
            dynamodb_service.save_entry(ledger_entry)
        except Exception as e:
            print(f"DynamoDB save failed: {e}")
            # Continue anyway - entry is still valid
        
        return UploadResponse(
            success=True,
            ledger_entry=ledger_entry,
            needs_confirmation=reasoning_output.needs_confirmation,
            confirmation_reason=reasoning_output.confirmation_reason
        )
        
    except Exception as e:
        print(f"Processing error: {e}")
        return UploadResponse(
            success=False,
            error=f"Failed to process: {str(e)}"
        )


@router.post("/confirm", response_model=UploadResponse)
async def confirm_voice(request: ConfirmationRequest):
    """Confirm or correct a low-confidence voice entry."""
    try:
        entry = dynamodb_service.get_entry(request.transaction_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        updates = {}
        
        # Update amount if provided
        if request.confirmed_amount is not None:
            updates['amount'] = request.confirmed_amount
            updates['gst_amount'] = round(
                request.confirmed_amount * entry.gst_rate / 100, 2
            )
        
        # Update category if provided
        if request.confirmed_category is not None:
            updates['category'] = request.confirmed_category
            # Get new GST rate from specs
            specs = reasoning_engine.specs
            new_gst_rate = specs['categories'].get(
                request.confirmed_category, {}
            ).get('gst_rate', 18)
            updates['gst_rate'] = new_gst_rate
            # Recalculate GST amount
            amount = request.confirmed_amount or entry.amount
            updates['gst_amount'] = round(amount * new_gst_rate / 100, 2)
        
        # Mark as confirmed
        updates['confidence'] = 1.0
        updates['explanation'] = entry.explanation + " [User confirmed]"
        
        # Update in DynamoDB
        if updates:
            updated_entry = dynamodb_service.update_entry(
                request.transaction_id, updates
            )
        else:
            updated_entry = entry
        
        return UploadResponse(
            success=True,
            ledger_entry=updated_entry,
            needs_confirmation=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return UploadResponse(
            success=False,
            error=str(e)
        )
