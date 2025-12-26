"""Ledger CRUD and summary API"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from models.schemas import LedgerEntry, DailySummary
from services.dynamodb import dynamodb_service

router = APIRouter(prefix="/ledger", tags=["ledger"])


@router.get("/entries", response_model=list[LedgerEntry])
async def get_entries(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    limit: int = Query(20, ge=1, le=100, description="Max entries to return")
):
    """Get ledger entries, optionally filtered by date."""
    if date:
        entries = dynamodb_service.get_entries_by_date(date)
    else:
        entries = dynamodb_service.get_recent_entries(limit)
    
    return entries


@router.get("/entries/{transaction_id}", response_model=LedgerEntry)
async def get_entry(transaction_id: str):
    """Get single ledger entry by ID."""
    entry = dynamodb_service.get_entry(transaction_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.delete("/entries/{transaction_id}")
async def delete_entry(transaction_id: str):
    """Delete a ledger entry."""
    success = dynamodb_service.delete_entry(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found or could not be deleted")
    return {"success": True, "message": "Entry deleted"}


@router.get("/summary", response_model=DailySummary)
async def get_daily_summary(
    date: Optional[str] = Query(None, description="Date for summary (YYYY-MM-DD), defaults to today")
):
    """
    Get daily expense summary.
    
    Returns:
    - Total spend
    - Category breakdown
    - GST liability snapshot
    """
    if date is None:
        date = datetime.utcnow().strftime('%Y-%m-%d')
    
    summary = dynamodb_service.get_daily_summary(date)
    return summary


@router.get("/summary/range")
async def get_range_summary(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
):
    """Get summary for a date range."""
    entries = dynamodb_service.get_entries_range(start_date, end_date)
    
    total_amount = sum(e.amount for e in entries)
    total_gst = sum(e.gst_amount for e in entries)
    
    by_category = {}
    gst_by_category = {}
    by_source = {"receipt": 0, "voice": 0}
    
    for entry in entries:
        cat = entry.category
        by_category[cat] = by_category.get(cat, 0) + entry.amount
        gst_by_category[cat] = gst_by_category.get(cat, 0) + entry.gst_amount
        by_source[entry.source] = by_source.get(entry.source, 0) + entry.amount
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_amount": round(total_amount, 2),
        "total_gst": round(total_gst, 2),
        "entry_count": len(entries),
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
        "gst_by_category": {k: round(v, 2) for k, v in gst_by_category.items()},
        "by_source": by_source
    }


@router.get("/categories")
async def get_categories():
    """Get available expense categories with GST rates."""
    from services.reasoning import reasoning_engine
    specs = reasoning_engine.specs
    
    categories = []
    for key, data in specs['categories'].items():
        categories.append({
            "key": key,
            "display_name": data.get('display_name', key),
            "gst_rate": data.get('gst_rate', 18)
        })
    
    return categories
