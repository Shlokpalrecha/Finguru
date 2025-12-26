"""OCR service for receipt scanning - using OpenAI Vision API"""
import base64
import re
import json
from typing import Optional
from openai import OpenAI
from config import get_settings
from models.schemas import ReceiptExtraction


class TextractService:
    """Handle OCR operations for receipt scanning using OpenAI Vision"""
    
    def __init__(self):
        settings = get_settings()
        # Use OpenRouter or OpenAI
        if settings.openrouter_api_key:
            self.client = OpenAI(
                api_key=settings.openrouter_api_key,
                base_url="https://openrouter.ai/api/v1"
            )
            self.model = "google/gemini-2.0-flash-001"
        elif settings.openai_api_key:
            self.client = OpenAI(api_key=settings.openai_api_key)
            self.model = "gpt-4o-mini"
        else:
            self.client = None
    
    def extract_receipt(self, image_bytes: bytes) -> ReceiptExtraction:
        """Extract text and structured data from receipt image using Vision API"""
        
        if not self.client:
            return ReceiptExtraction(raw_text="", confidence=0.0)
        
        # Convert image to base64
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = """Analyze this receipt image and extract the following information in JSON format:
{
    "raw_text": "full text from receipt",
    "amount": total amount as number (just the number, no currency symbol),
    "date": "date in YYYY-MM-DD format if visible",
    "vendor_name": "store/vendor name",
    "vendor_gstin": "GST number if visible (format: 2 digits + 10 char PAN + 1 digit + Z + 1 alphanumeric)",
    "items": ["list of items purchased"]
}

If any field is not visible, use null. For amount, extract the total/grand total."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            result_text = response.choices[0].message.content
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', result_text)
            if json_match:
                data = json.loads(json_match.group())
                return ReceiptExtraction(
                    raw_text=data.get('raw_text', ''),
                    amount=float(data['amount']) if data.get('amount') else None,
                    date=data.get('date'),
                    vendor_name=data.get('vendor_name'),
                    vendor_gstin=data.get('vendor_gstin'),
                    items=data.get('items', []),
                    confidence=0.85
                )
        except Exception as e:
            print(f"Vision API error: {e}")
        
        return ReceiptExtraction(raw_text="Could not extract text", confidence=0.0)
    
# Singleton instance
textract_service = TextractService()
