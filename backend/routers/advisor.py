"""CA Advisor API - Summarizes expenses and provides insights"""
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from services.dynamodb import dynamodb_service

router = APIRouter(prefix="/advisor", tags=["advisor"])


class AdvisorInsight(BaseModel):
    """CA-style insight response"""
    summary: str
    total_expenses: float
    total_gst: float
    top_category: str
    top_category_amount: float
    entry_count: int
    tips: list[str]
    gst_breakdown: dict[str, float]
    category_breakdown: dict[str, float]


@router.get("/insights", response_model=AdvisorInsight)
async def get_insights():
    """
    Get CA-style insights and summary of all expenses.
    Acts as your personal accountant companion.
    """
    # Get all entries
    entries = dynamodb_service.get_recent_entries(100)
    
    if not entries:
        return AdvisorInsight(
            summary="No expenses recorded yet. Start by uploading a receipt or recording a voice expense!",
            total_expenses=0,
            total_gst=0,
            top_category="None",
            top_category_amount=0,
            entry_count=0,
            tips=["Upload your first receipt to get started", "Try the voice feature for quick expense logging"],
            gst_breakdown={},
            category_breakdown={}
        )
    
    # Calculate totals
    total_expenses = sum(e.amount for e in entries)
    total_gst = sum(e.gst_amount for e in entries)
    
    # Category breakdown
    category_totals = {}
    gst_by_category = {}
    for entry in entries:
        cat = entry.category
        category_totals[cat] = category_totals.get(cat, 0) + entry.amount
        gst_by_category[cat] = gst_by_category.get(cat, 0) + entry.gst_amount
    
    # Find top category
    top_category = max(category_totals, key=category_totals.get) if category_totals else "None"
    top_category_amount = category_totals.get(top_category, 0)
    
    # Generate CA-style summary
    summary = _generate_summary(
        total_expenses=total_expenses,
        total_gst=total_gst,
        entry_count=len(entries),
        top_category=top_category,
        top_category_amount=top_category_amount,
        category_totals=category_totals
    )
    
    # Generate tips
    tips = _generate_tips(
        total_expenses=total_expenses,
        total_gst=total_gst,
        category_totals=category_totals,
        entries=entries
    )
    
    # Format category names for display
    category_display = {
        "food": "Food & Beverages",
        "transport": "Transportation", 
        "office_supplies": "Office Supplies",
        "utilities": "Utilities",
        "rent": "Rent & Lease",
        "professional_services": "Professional Services",
        "raw_materials": "Raw Materials",
        "maintenance": "Repairs & Maintenance",
        "miscellaneous": "Miscellaneous"
    }
    
    formatted_categories = {
        category_display.get(k, k): round(v, 2) 
        for k, v in category_totals.items()
    }
    
    formatted_gst = {
        category_display.get(k, k): round(v, 2)
        for k, v in gst_by_category.items()
    }
    
    return AdvisorInsight(
        summary=summary,
        total_expenses=round(total_expenses, 2),
        total_gst=round(total_gst, 2),
        top_category=category_display.get(top_category, top_category),
        top_category_amount=round(top_category_amount, 2),
        entry_count=len(entries),
        tips=tips,
        gst_breakdown=formatted_gst,
        category_breakdown=formatted_categories
    )


def _generate_summary(
    total_expenses: float,
    total_gst: float,
    entry_count: int,
    top_category: str,
    top_category_amount: float,
    category_totals: dict
) -> str:
    """Generate a CA-style summary paragraph."""
    
    category_display = {
        "food": "Food & Beverages",
        "transport": "Transportation",
        "office_supplies": "Office Supplies", 
        "utilities": "Utilities",
        "raw_materials": "Raw Materials",
        "maintenance": "Repairs & Maintenance",
        "miscellaneous": "Miscellaneous"
    }
    
    top_cat_display = category_display.get(top_category, top_category)
    top_percentage = (top_category_amount / total_expenses * 100) if total_expenses > 0 else 0
    gst_percentage = (total_gst / total_expenses * 100) if total_expenses > 0 else 0
    
    summary = f"You have recorded {entry_count} expense{'s' if entry_count != 1 else ''} "
    summary += f"totaling ₹{total_expenses:,.2f}. "
    summary += f"Your GST liability stands at ₹{total_gst:,.2f} ({gst_percentage:.1f}% of total). "
    summary += f"Your highest spending category is {top_cat_display} at ₹{top_category_amount:,.2f} "
    summary += f"({top_percentage:.1f}% of expenses). "
    
    if len(category_totals) > 1:
        summary += f"Your expenses are spread across {len(category_totals)} categories."
    
    return summary


def _generate_tips(
    total_expenses: float,
    total_gst: float,
    category_totals: dict,
    entries: list
) -> list[str]:
    """Generate actionable CA-style tips."""
    
    tips = []
    
    # GST tip
    if total_gst > 1000:
        tips.append(f"💡 You have ₹{total_gst:,.2f} in GST. If you're GST registered, you can claim Input Tax Credit on eligible business expenses.")
    
    # High spending category tip
    if category_totals:
        top_cat = max(category_totals, key=category_totals.get)
        if category_totals[top_cat] > total_expenses * 0.5:
            tips.append(f"📊 Over 50% of your expenses are in one category. Consider reviewing if all these expenses are necessary.")
    
    # Raw materials tip
    if "raw_materials" in category_totals and category_totals["raw_materials"] > 5000:
        tips.append("🏭 Significant raw material expenses detected. Ensure you're getting GST invoices from registered vendors for ITC claims.")
    
    # Food expenses tip
    if "food" in category_totals and category_totals["food"] > 2000:
        tips.append("🍽️ Food expenses are generally not eligible for Input Tax Credit unless for business meetings/events.")
    
    # Transport tip
    if "transport" in category_totals:
        tips.append("🚗 Keep fuel bills and transport receipts organized - they may be deductible as business expenses.")
    
    # General tips
    tips.append("📱 Keep uploading receipts regularly to maintain accurate records for tax filing.")
    tips.append("📅 Review your expenses weekly to catch any unusual spending patterns early.")
    
    return tips[:5]  # Return max 5 tips
