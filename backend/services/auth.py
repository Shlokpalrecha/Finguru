"""Authentication Service - JWT + DynamoDB Users"""
import boto3
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import get_settings

settings = get_settings()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = settings.openai_api_key[:32] if settings.openai_api_key else "finguru-secret-key-change-me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Security
security = HTTPBearer()

# DynamoDB
dynamodb = boto3.resource(
    'dynamodb',
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key
)

USERS_TABLE = "finguru-users"


def get_users_table():
    """Get or create users table"""
    try:
        table = dynamodb.Table(USERS_TABLE)
        table.load()
        return table
    except:
        # Create table if not exists
        table = dynamodb.create_table(
            TableName=USERS_TABLE,
            KeySchema=[{'AttributeName': 'email', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'email', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        table.wait_until_exists()
        return table


# Password hashing - use sha256 pre-hash for bcrypt compatibility
import hashlib

def hash_password(password: str) -> str:
    # Pre-hash with sha256 to handle any length password
    prehash = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(prehash)


def verify_password(plain: str, hashed: str) -> bool:
    prehash = hashlib.sha256(plain.encode()).hexdigest()
    return pwd_context.verify(prehash, hashed)


def create_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def register_user(email: str, password: str, name: str) -> dict:
    """Register new user"""
    table = get_users_table()
    
    # Check if exists
    response = table.get_item(Key={'email': email})
    if 'Item' in response:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = {
        'email': email,
        'password_hash': hash_password(password),
        'name': name,
        'created_at': datetime.utcnow().isoformat()
    }
    table.put_item(Item=user)
    
    return {"email": email, "name": name}


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate user and return user data"""
    table = get_users_table()
    response = table.get_item(Key={'email': email})
    
    if 'Item' not in response:
        return None
    
    user = response['Item']
    if not verify_password(password, user['password_hash']):
        return None
    
    return {"email": user['email'], "name": user['name']}


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    email = decode_token(token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    table = get_users_table()
    response = table.get_item(Key={'email': email})
    
    if 'Item' not in response:
        raise HTTPException(status_code=401, detail="User not found")
    
    user = response['Item']
    return {"email": user['email'], "name": user['name']}
