"""
Contact form models
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class ContactSubmission(BaseModel):
    """Contact form submission"""
    name: str
    email: EmailStr
    phone: str
    message: str
    honeypot: Optional[str] = None  # Honeypot field for spam protection
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        if len(v.strip()) > 100:
            raise ValueError('Name must be less than 100 characters')
        return v.strip()
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if not v or len(v.strip()) < 5:
            raise ValueError('Phone number must be at least 5 characters')
        if len(v.strip()) > 20:
            raise ValueError('Phone number must be less than 20 characters')
        return v.strip()
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError('Message must be at least 10 characters')
        if len(v.strip()) > 2000:
            raise ValueError('Message must be less than 2000 characters')
        return v.strip()
    
    @field_validator('honeypot')
    @classmethod
    def validate_honeypot(cls, v):
        # If honeypot field has any value, it's likely a bot
        if v and v.strip():
            raise ValueError('Spam detected')
        return v


class ContactResponse(BaseModel):
    """Contact form submission response"""
    message: str
    success: bool

