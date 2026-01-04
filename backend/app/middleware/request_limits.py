"""
Request Size and Validation Limits
Prevent DoS attacks through oversized requests
"""
from fastapi import Request, HTTPException, status
from typing import Optional
from app.config import settings
from app.utils.logger import logger


class RequestLimits:
    """Enforce request size and validation limits"""
    
    # Default limits (can be overridden in settings)
    MAX_REQUEST_SIZE = getattr(settings, 'MAX_REQUEST_SIZE', 1 * 1024 * 1024)  # 1MB default
    MAX_CHAT_MESSAGE_LENGTH = getattr(settings, 'MAX_CHAT_MESSAGE_LENGTH', 5000)  # 5000 chars
    MAX_CONVERSATION_HISTORY = getattr(settings, 'MAX_CONVERSATION_HISTORY', 20)  # 20 messages
    MAX_PRICING_CALC_ITEMS = getattr(settings, 'MAX_PRICING_CALC_ITEMS', 10)  # 10 items
    
    @staticmethod
    def check_request_size(request: Request, max_size: Optional[int] = None) -> tuple[bool, Optional[str]]:
        """
        Check if request body size is within limits
        
        Returns:
            (is_valid, error_message)
        """
        max_size = max_size or RequestLimits.MAX_REQUEST_SIZE
        
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > max_size:
                    logger.warning(f"Request too large: {size} bytes (max: {max_size})")
                    return False, f"Request body too large. Maximum size: {max_size / 1024 / 1024:.1f}MB"
            except ValueError:
                pass
        
        return True, None
    
    @staticmethod
    def validate_chat_request(message: str, conversation_history: Optional[list]) -> tuple[bool, Optional[str]]:
        """Validate chat request parameters"""
        # Check message length
        if len(message) > RequestLimits.MAX_CHAT_MESSAGE_LENGTH:
            return False, f"Message too long. Maximum length: {RequestLimits.MAX_CHAT_MESSAGE_LENGTH} characters"
        
        # Check conversation history length
        if conversation_history and len(conversation_history) > RequestLimits.MAX_CONVERSATION_HISTORY:
            return False, f"Conversation history too long. Maximum: {RequestLimits.MAX_CONVERSATION_HISTORY} messages"
        
        # Check total conversation size
        if conversation_history:
            total_size = len(message) + sum(len(str(msg)) for msg in conversation_history)
            if total_size > RequestLimits.MAX_CHAT_MESSAGE_LENGTH * 2:
                return False, "Total conversation size exceeds limit"
        
        return True, None
    
    @staticmethod
    def validate_pricing_request(items: list) -> tuple[bool, Optional[str]]:
        """Validate pricing calculation request"""
        if len(items) > RequestLimits.MAX_PRICING_CALC_ITEMS:
            return False, f"Too many items. Maximum: {RequestLimits.MAX_PRICING_CALC_ITEMS} items per request"
        
        return True, None


# Global instance
request_limits = RequestLimits()

