"""Amazon DynamoDB service for ledger storage"""
import boto3
from datetime import datetime, timedelta
from typing import Optional
from decimal import Decimal
from config import get_settings
from models.schemas import LedgerEntry, DailySummary


class DynamoDBService:
    """Handle DynamoDB operations for ledger entries"""
    
    def __init__(self):
        settings = get_settings()
        self.dynamodb = boto3.resource(
            'dynamodb',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.table = self.dynamodb.Table(settings.dynamodb_table_name)
    
    def save_entry(self, entry: LedgerEntry) -> LedgerEntry:
        """Save ledger entry to DynamoDB"""
        item = self._to_dynamodb_item(entry)
        self.table.put_item(Item=item)
        return entry
    
    def get_entry(self, transaction_id: str) -> Optional[LedgerEntry]:
        """Get single ledger entry by ID"""
        response = self.table.get_item(Key={'transaction_id': transaction_id})
        item = response.get('Item')
        return self._from_dynamodb_item(item) if item else None
    
    def update_entry(self, transaction_id: str, updates: dict) -> Optional[LedgerEntry]:
        """Update existing ledger entry"""
        update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in updates.keys())
        expr_names = {f"#{k}": k for k in updates.keys()}
        expr_values = {f":{k}": self._convert_value(v) for k, v in updates.items()}
        
        response = self.table.update_item(
            Key={'transaction_id': transaction_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues='ALL_NEW'
        )
        
        return self._from_dynamodb_item(response.get('Attributes'))
    
    def get_entries_by_date(self, date: str) -> list[LedgerEntry]:
        """Get all entries for a specific date"""
        response = self.table.scan(
            FilterExpression='begins_with(#date, :date_prefix)',
            ExpressionAttributeNames={'#date': 'date'},
            ExpressionAttributeValues={':date_prefix': date}
        )
        
        items = response.get('Items', [])
        return [self._from_dynamodb_item(item) for item in items]
    
    def get_entries_range(self, start_date: str, end_date: str) -> list[LedgerEntry]:
        """Get entries within date range"""
        response = self.table.scan(
            FilterExpression='#date BETWEEN :start AND :end',
            ExpressionAttributeNames={'#date': 'date'},
            ExpressionAttributeValues={
                ':start': start_date,
                ':end': end_date
            }
        )
        
        items = response.get('Items', [])
        return [self._from_dynamodb_item(item) for item in items]
    
    def get_recent_entries(self, limit: int = 20) -> list[LedgerEntry]:
        """Get most recent entries"""
        response = self.table.scan(Limit=limit * 2)  # Scan more to sort
        items = response.get('Items', [])
        
        # Sort by created_at descending
        items.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return [self._from_dynamodb_item(item) for item in items[:limit]]
    
    def get_daily_summary(self, date: Optional[str] = None) -> DailySummary:
        """Generate daily summary"""
        if date is None:
            # Use local time instead of UTC for better user experience
            from datetime import timezone
            import time
            # Get local date
            date = datetime.now().strftime('%Y-%m-%d')
        
        entries = self.get_entries_by_date(date)
        
        total_amount = sum(e.amount for e in entries)
        total_gst = sum(e.gst_amount for e in entries)
        
        by_category = {}
        gst_by_category = {}
        
        for entry in entries:
            cat = entry.category
            by_category[cat] = by_category.get(cat, 0) + entry.amount
            gst_by_category[cat] = gst_by_category.get(cat, 0) + entry.gst_amount
        
        return DailySummary(
            date=date,
            total_amount=round(total_amount, 2),
            total_gst=round(total_gst, 2),
            entry_count=len(entries),
            by_category={k: round(v, 2) for k, v in by_category.items()},
            gst_by_category={k: round(v, 2) for k, v in gst_by_category.items()}
        )
    
    def delete_entry(self, transaction_id: str) -> bool:
        """Delete ledger entry"""
        try:
            self.table.delete_item(Key={'transaction_id': transaction_id})
            return True
        except Exception:
            return False
    
    def _to_dynamodb_item(self, entry: LedgerEntry) -> dict:
        """Convert LedgerEntry to DynamoDB item"""
        item = entry.model_dump()
        # Convert floats to Decimal for DynamoDB
        for key, value in item.items():
            if isinstance(value, float):
                item[key] = Decimal(str(value))
        return item
    
    def _from_dynamodb_item(self, item: dict) -> LedgerEntry:
        """Convert DynamoDB item to LedgerEntry"""
        if item is None:
            return None
        # Convert Decimals back to floats
        for key, value in item.items():
            if isinstance(value, Decimal):
                item[key] = float(value)
        return LedgerEntry(**item)
    
    def _convert_value(self, value):
        """Convert Python value to DynamoDB compatible"""
        if isinstance(value, float):
            return Decimal(str(value))
        return value


# Singleton instance
dynamodb_service = DynamoDBService()
