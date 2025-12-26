"""Receipt upload and processing API"""
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import (
    LedgerEntry, UploadResponse, ReasoningInput, ConfirmationRequest
)
from services.textract import textract_service
from services.reasoning import reasoning_engine
from services.dynamodb import dynamodb_service

router = APIRouter(prefix="/receipts", tags=["receipts"])


@router.post("/upload", response_model=UploadResponse)
async def upload_receipt(file: UploadFile = File(...)):
    """
    Upload receipt image for processing.
    
    Flow:
    1. Validate file type
    2. Extract text via Vision API
    3. Process through reasoning engine
    4. Store in DynamoDB (if confident)
    5. Return result with explanation
    """
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_types}"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Extract text via Vision API
        extraction = textract_service.extract_receipt(content)
        
        if not extraction.raw_text or extraction.confidence == 0:
            return UploadResponse(
                success=False,
                error="Could not extract text from image. Please try a clearer photo."
            )
        
        # Prepare reasoning input
        reasoning_input = ReasoningInput(
            source="receipt",
            extracted_text=extraction.raw_text,
            extracted_amount=extraction.amount,
            extracted_date=extraction.date,
            extracted_vendor=extraction.vendor_name,
            extracted_gstin=extraction.vendor_gstin
        )
        
        # Process through reasoning engine
        reasoning_output = reasoning_engine.process(reasoning_input)
        
        # Create ledger entry
        ledger_entry = LedgerEntry(
            date=extraction.date or datetime.now().strftime('%Y-%m-%d'),
            amount=reasoning_output.amount,
            category=reasoning_output.category,
            gst_rate=reasoning_output.gst_rate,
            gst_amount=reasoning_output.gst_amount,
            source="receipt",
            confidence=reasoning_output.confidence,
            explanation=reasoning_output.explanation,
            vendor_name=reasoning_output.vendor_name,
            vendor_gstin=extraction.vendor_gstin,
            raw_text=extraction.raw_text
        )
        
        # Always save to DynamoDB (even if needs confirmation)
        dynamodb_service.save_entry(ledger_entry)
        
        return UploadResponse(
            success=True,
            ledger_entry=ledger_entry,
            needs_confirmation=reasoning_output.needs_confirmation,
            confirmation_reason=reasoning_output.confirmation_reason
        )
        
    except Exception as e:
        return UploadResponse(
            success=False,
            error=str(e)
        )


@router.post("/confirm", response_model=UploadResponse)
async def confirm_receipt(request: ConfirmationRequest):
    """Confirm or correct a low-confidence receipt entry."""
    try:
        # Get existing entry
        entry = dynamodb_service.get_entry(request.transaction_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        # Apply corrections
        updates = {}
        if request.confirmed_amount is not None:
            updates['amount'] = request.confirmed_amount
            updates['gst_amount'] = round(request.confirmed_amount * entry.gst_rate / 100, 2)
        
        if request.confirmed_category is not None:
            updates['category'] = request.confirmed_category
            from services.reasoning import reasoning_engine
            specs = reasoning_engine.specs
            new_gst_rate = specs['categories'].get(request.confirmed_category, {}).get('gst_rate', 18)
            updates['gst_rate'] = new_gst_rate
            amount = request.confirmed_amount or entry.amount
            updates['gst_amount'] = round(amount * new_gst_rate / 100, 2)
        
        updates['confidence'] = 1.0
        updates['explanation'] = entry.explanation + " [User confirmed]"
        
        if updates:
            updated_entry = dynamodb_service.update_entry(request.transaction_id, updates)
        else:
            dynamodb_service.save_entry(entry)
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
