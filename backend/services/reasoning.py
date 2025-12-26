"""Spec-driven reasoning engine for expense categorization"""
import re
import yaml
import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from openai import OpenAI
from config import get_settings
from models.schemas import ReasoningInput, ReasoningOutput


class ReasoningEngine:
    """
    Spec-driven reasoning engine.
    This is NOT a wrapper - it applies explicit accounting rules.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.specs = self._load_specs()
        # Support both OpenAI and OpenRouter
        if self.settings.openrouter_api_key:
            self.client = OpenAI(
                api_key=self.settings.openrouter_api_key,
                base_url="https://openrouter.ai/api/v1"
            )
            self.model = "google/gemini-2.0-flash-001"  # Free/cheap model on OpenRouter
        elif self.settings.openai_api_key:
            self.client = OpenAI(api_key=self.settings.openai_api_key)
            self.model = "gpt-3.5-turbo"
        else:
            self.client = None
            self.model = None
    
    def _load_specs(self) -> dict:
        """Load accounting specifications"""
        spec_path = Path(__file__).parent.parent / "specs" / "accounting.yaml"
        with open(spec_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def process(self, input_data: ReasoningInput) -> ReasoningOutput:
        """
        Process input through spec-driven reasoning.
        Returns structured output with explanation.
        """
        # Step 1: Extract amount (rule-based first)
        amount = input_data.extracted_amount or self._extract_amount(input_data.extracted_text)
        
        # Step 2: Categorize using specs
        category, category_confidence = self._categorize(input_data.extracted_text)
        
        # Step 3: Apply GST rules from specs
        gst_rate = self.specs['categories'].get(category, {}).get('gst_rate', 18)
        gst_amount = round(amount * gst_rate / 100, 2) if amount else 0
        
        # Step 4: Generate explanation
        explanation = self._generate_explanation(
            amount=amount,
            category=category,
            gst_rate=gst_rate,
            source=input_data.source,
            raw_text=input_data.extracted_text
        )
        
        # Step 5: Calculate overall confidence
        confidence = self._calculate_confidence(
            amount_found=amount is not None,
            category_confidence=category_confidence,
            extraction_confidence=0.8 if input_data.extracted_amount else 0.5
        )
        
        # Step 6: Determine if confirmation needed
        needs_confirmation = confidence < self.settings.confidence_threshold
        confirmation_reason = None
        if needs_confirmation:
            confirmation_reason = self._get_confirmation_reason(
                amount=amount,
                category=category,
                confidence=confidence
            )
        
        return ReasoningOutput(
            amount=amount or 0,
            category=category,
            gst_rate=gst_rate,
            gst_amount=gst_amount,
            confidence=confidence,
            explanation=explanation,
            vendor_name=input_data.extracted_vendor,
            needs_confirmation=needs_confirmation,
            confirmation_reason=confirmation_reason
        )
    
    def _extract_amount(self, text: str) -> Optional[float]:
        """Extract amount using spec-defined patterns"""
        patterns = self.specs['validation']['amount_patterns']
        
        for pattern_def in patterns:
            pattern = pattern_def['pattern']
            group = pattern_def['group']
            match = re.search(pattern, text.lower())
            if match:
                try:
                    amount_str = match.group(group).replace(',', '')
                    return float(amount_str)
                except (ValueError, IndexError):
                    continue
        
        # Fallback: find any number that looks like an amount
        numbers = re.findall(r'\b(\d{1,6}(?:\.\d{2})?)\b', text)
        if numbers:
            # Return the largest reasonable number
            amounts = [float(n) for n in numbers if 1 <= float(n) <= 100000]
            if amounts:
                return max(amounts)
        
        return None
    
    def _categorize(self, text: str) -> tuple[str, float]:
        """Categorize expense using spec-defined keywords"""
        text_lower = text.lower()
        
        best_category = 'miscellaneous'
        best_score = 0
        
        for cat_key, cat_data in self.specs['categories'].items():
            keywords = cat_data.get('keywords', [])
            matches = sum(1 for kw in keywords if kw in text_lower)
            
            if matches > best_score:
                best_score = matches
                best_category = cat_key
        
        # Calculate confidence based on keyword matches
        confidence = min(0.95, 0.5 + (best_score * 0.15))
        
        # If no keywords matched, try LLM for better categorization
        if best_score == 0 and self.client:
            llm_category, llm_confidence = self._llm_categorize(text)
            if llm_confidence > confidence:
                return llm_category, llm_confidence
        
        return best_category, confidence
    
    def _llm_categorize(self, text: str) -> tuple[str, float]:
        """Use LLM for categorization when keywords fail"""
        categories = list(self.specs['categories'].keys())
        
        prompt = f"""You are a strict expense categorization system.
Given the following expense text, categorize it into EXACTLY ONE of these categories:
{json.dumps(categories)}

Text: "{text}"

Respond with ONLY a JSON object in this exact format:
{{"category": "category_name", "confidence": 0.XX}}

Rules:
- category MUST be from the provided list
- confidence is 0.0 to 1.0
- If unsure, use "miscellaneous" with low confidence"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=50
            )
            
            result = json.loads(response.choices[0].message.content)
            category = result.get('category', 'miscellaneous')
            confidence = float(result.get('confidence', 0.5))
            
            # Validate category exists in specs
            if category not in categories:
                category = 'miscellaneous'
                confidence = 0.5
            
            return category, confidence
        except Exception:
            return 'miscellaneous', 0.5
    
    def _generate_explanation(
        self,
        amount: Optional[float],
        category: str,
        gst_rate: float,
        source: str,
        raw_text: str
    ) -> str:
        """Generate human-readable explanation"""
        cat_display = self.specs['categories'].get(category, {}).get('display_name', category)
        
        if source == 'receipt':
            explanation = f"Receipt scanned and categorized as '{cat_display}'. "
        else:
            explanation = f"Voice input transcribed and categorized as '{cat_display}'. "
        
        explanation += f"GST rate of {gst_rate}% applied as per Indian GST rules for this category. "
        
        if amount:
            gst_amount = round(amount * gst_rate / 100, 2)
            explanation += f"Total amount ₹{amount} includes estimated GST of ₹{gst_amount}."
        
        return explanation
    
    def _calculate_confidence(
        self,
        amount_found: bool,
        category_confidence: float,
        extraction_confidence: float
    ) -> float:
        """Calculate overall confidence score"""
        weights = {
            'amount': 0.4,
            'category': 0.35,
            'extraction': 0.25
        }
        
        amount_score = 0.9 if amount_found else 0.3
        
        confidence = (
            weights['amount'] * amount_score +
            weights['category'] * category_confidence +
            weights['extraction'] * extraction_confidence
        )
        
        return round(confidence, 2)
    
    def _get_confirmation_reason(
        self,
        amount: Optional[float],
        category: str,
        confidence: float
    ) -> str:
        """Generate reason for requesting user confirmation"""
        reasons = []
        
        if amount is None:
            reasons.append("Could not extract amount clearly")
        elif amount > self.specs['validation']['max_amount_without_confirmation']:
            reasons.append(f"Amount ₹{amount} exceeds confirmation threshold")
        
        if category == 'miscellaneous':
            reasons.append("Could not determine specific category")
        
        if confidence < 0.7:
            reasons.append("Low overall confidence in extraction")
        
        return "; ".join(reasons) if reasons else "Please verify the extracted information"


# Singleton instance
reasoning_engine = ReasoningEngine()
