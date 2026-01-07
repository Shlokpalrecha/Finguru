"""
GPT-4.1 Spec-Driven Reasoning Engine for FinGuru

This is NOT a chatbot wrapper. GPT-4.1 is used as a constrained reasoning engine:
- System prompts define policies
- Specs constrain the reasoning
- JSON schema enforces structured output
- Confidence scores enable human-in-the-loop
"""
import re
import yaml
import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from openai import OpenAI
from config import get_settings
from models.schemas import ReasoningInput, ReasoningOutput


# JSON Schema for GPT-4.1 structured output
REASONING_SCHEMA = {
    "type": "object",
    "properties": {
        "amount": {
            "type": "number",
            "description": "Extracted amount in INR"
        },
        "category": {
            "type": "string",
            "enum": ["food", "transport", "office_supplies", "utilities", "rent", 
                     "professional_services", "raw_materials", "maintenance", "miscellaneous"],
            "description": "Expense category from allowed list"
        },
        "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Confidence score 0-1"
        },
        "rule_applied": {
            "type": "string",
            "description": "Which accounting rule was applied"
        },
        "gst_reasoning": {
            "type": "string", 
            "description": "Why GST rate was chosen"
        },
        "explanation": {
            "type": "string",
            "description": "Human-readable explanation of the decision"
        }
    },
    "required": ["amount", "category", "confidence", "rule_applied", "gst_reasoning", "explanation"],
    "additionalProperties": False
}


class ReasoningEngine:
    """
    GPT-4.1 Spec-Driven Reasoning Engine.
    
    Design Philosophy:
    1. GPT-4.1 is NOT a chatbot - it's a constrained reasoning engine
    2. All logic is spec-driven, not prompt tricks
    3. Human-in-the-loop when confidence < threshold
    4. Every decision is explainable
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.specs = self._load_specs()
        
        # Initialize OpenAI client for GPT-4.1
        if self.settings.openai_api_key:
            self.client = OpenAI(api_key=self.settings.openai_api_key)
            self.model = "gpt-4.1-2025-04-14"  # GPT-4.1 model
        elif self.settings.openrouter_api_key:
            self.client = OpenAI(
                api_key=self.settings.openrouter_api_key,
                base_url="https://openrouter.ai/api/v1"
            )
            self.model = "openai/gpt-4.1"
        else:
            self.client = None
            self.model = None
    
    def _load_specs(self) -> dict:
        """Load accounting specifications - the source of truth."""
        spec_path = Path(__file__).parent.parent / "specs" / "accounting.yaml"
        with open(spec_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def _build_system_prompt(self) -> str:
        """
        Build system prompt with specs as policies.
        GPT-4.1 must follow these constraints exactly.
        """
        categories_spec = json.dumps({
            k: {"gst_rate": v["gst_rate"], "keywords": v.get("keywords", [])}
            for k, v in self.specs["categories"].items()
        }, indent=2)
        
        return f"""You are FinGuru's Expense Reasoning Engine - a constrained AI system for Indian MSME accounting.

## YOUR ROLE
You are NOT a chatbot. You are a structured reasoning engine that:
1. Analyzes expense data (from receipts or voice)
2. Applies Indian GST rules from the specification
3. Produces structured JSON output
4. Explains every decision clearly

## ACCOUNTING SPECIFICATION (SOURCE OF TRUTH)
{categories_spec}

## GST RULES
- Food & Beverages: 5% GST
- Transportation: 5% GST (0% for public transport)
- Office Supplies: 18% GST
- Utilities: 18% GST
- Raw Materials: 12% GST
- Professional Services: 18% GST
- Maintenance: 18% GST
- Miscellaneous: 18% GST (default)

## CONSTRAINTS
1. You MUST output valid JSON matching the schema
2. You MUST include a confidence score (0-1)
3. You MUST explain which rule was applied
4. You MUST explain why the GST rate was chosen
5. If uncertain, set confidence < 0.85 to trigger human review
6. NEVER guess - if unclear, use "miscellaneous" with low confidence

## CONFIDENCE GUIDELINES
- 0.95+: Clear match with multiple keywords
- 0.85-0.94: Good match with context
- 0.70-0.84: Partial match, may need confirmation
- <0.70: Uncertain, definitely needs human review"""

    def _build_user_prompt(self, input_data: ReasoningInput) -> str:
        """Build the user prompt with extracted data."""
        return f"""Analyze this expense and produce a structured classification:

SOURCE: {input_data.source}
TEXT: "{input_data.extracted_text}"
PRE-EXTRACTED AMOUNT: {input_data.extracted_amount or "Not extracted"}
PRE-EXTRACTED VENDOR: {input_data.extracted_vendor or "Unknown"}
PRE-EXTRACTED DATE: {input_data.extracted_date or "Today"}

Apply the accounting specification to classify this expense.
Output your reasoning as structured JSON."""

    def process(self, input_data: ReasoningInput) -> ReasoningOutput:
        """
        Process input through GPT-4.1 spec-driven reasoning.
        
        Pipeline:
        1. Build constrained prompts with specs
        2. Call GPT-4.1 with JSON schema enforcement
        3. Validate output against specs
        4. Calculate if human confirmation needed
        5. Return structured result with explanation
        """
        # Try GPT-4.1 first
        if self.client:
            try:
                result = self._gpt_reasoning(input_data)
                if result:
                    return result
            except Exception as e:
                print(f"GPT-4.1 reasoning failed: {e}")
        
        # Fallback to rule-based reasoning
        return self._rule_based_reasoning(input_data)
    
    def _gpt_reasoning(self, input_data: ReasoningInput) -> Optional[ReasoningOutput]:
        """Use GPT-4.1 as constrained reasoning engine."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._build_system_prompt()},
                    {"role": "user", "content": self._build_user_prompt(input_data)}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "expense_reasoning",
                        "strict": True,
                        "schema": REASONING_SCHEMA
                    }
                },
                temperature=0,  # Deterministic for accounting
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Get GST rate from specs based on category
            category = result["category"]
            gst_rate = self.specs["categories"].get(category, {}).get("gst_rate", 18)
            amount = result["amount"]
            gst_amount = round(amount * gst_rate / 100, 2)
            
            # Determine if human confirmation needed
            confidence = result["confidence"]
            needs_confirmation = confidence < self.settings.confidence_threshold
            
            confirmation_reason = None
            if needs_confirmation:
                if confidence < 0.7:
                    confirmation_reason = f"Low confidence ({confidence:.0%}). {result['explanation']}"
                else:
                    confirmation_reason = f"Please verify: {result['rule_applied']}"
            
            # Build comprehensive explanation
            explanation = (
                f"{result['explanation']} "
                f"Rule applied: {result['rule_applied']}. "
                f"GST reasoning: {result['gst_reasoning']}"
            )
            
            return ReasoningOutput(
                amount=amount,
                category=category,
                gst_rate=gst_rate,
                gst_amount=gst_amount,
                confidence=confidence,
                explanation=explanation,
                vendor_name=input_data.extracted_vendor,
                needs_confirmation=needs_confirmation,
                confirmation_reason=confirmation_reason
            )
            
        except Exception as e:
            print(f"GPT-4.1 error: {e}")
            return None
    
    def _rule_based_reasoning(self, input_data: ReasoningInput) -> ReasoningOutput:
        """Fallback rule-based reasoning when GPT-4.1 unavailable."""
        text = input_data.extracted_text.lower()
        
        # Extract amount
        amount = input_data.extracted_amount or self._extract_amount(text)
        
        # Categorize using keywords
        category, confidence = self._categorize_by_keywords(text)
        
        # Get GST from specs
        gst_rate = self.specs["categories"].get(category, {}).get("gst_rate", 18)
        gst_amount = round((amount or 0) * gst_rate / 100, 2)
        
        # Build explanation
        cat_display = self.specs["categories"].get(category, {}).get("display_name", category)
        explanation = (
            f"Categorized as '{cat_display}' based on keyword matching. "
            f"GST rate of {gst_rate}% applied per Indian GST rules for {cat_display.lower()}."
        )
        
        needs_confirmation = confidence < self.settings.confidence_threshold
        confirmation_reason = None
        if needs_confirmation:
            confirmation_reason = "Rule-based classification has lower confidence. Please verify."
        
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
        """Extract amount using spec-defined patterns."""
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
        
        # Fallback: find reasonable numbers
        numbers = re.findall(r'\b(\d{1,6}(?:\.\d{2})?)\b', text)
        if numbers:
            amounts = [float(n) for n in numbers if 1 <= float(n) <= 100000]
            if amounts:
                return max(amounts)
        
        return None
    
    def _categorize_by_keywords(self, text: str) -> tuple[str, float]:
        """Categorize using spec-defined keywords."""
        best_category = 'miscellaneous'
        best_score = 0
        
        for cat_key, cat_data in self.specs['categories'].items():
            keywords = cat_data.get('keywords', [])
            matches = sum(1 for kw in keywords if kw in text)
            
            if matches > best_score:
                best_score = matches
                best_category = cat_key
        
        confidence = min(0.85, 0.5 + (best_score * 0.15))
        return best_category, confidence


# Singleton instance
reasoning_engine = ReasoningEngine()
