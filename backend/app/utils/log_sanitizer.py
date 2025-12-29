"""
Log sanitization utilities to exclude sensitive data
"""
import re
from typing import Any, Dict, List, Union
from copy import deepcopy


class LogSanitizer:
    """Sanitize data before logging to exclude sensitive information"""
    
    # Fields to completely remove
    SENSITIVE_FIELDS = {
        'password', 'password_hash', 'access_token', 'token', 
        'secret', 'secret_key', 'api_key', 'auth_token',
        'file_content', 'content', 'body'
    }
    
    # Fields to mask (show partial)
    MASK_FIELDS = {
        'email': lambda x: f"{x[:1]}***@{x.split('@')[1]}" if '@' in str(x) else "***",
        'phone': lambda x: f"{str(x)[:3]}***{str(x)[-2:]}" if len(str(x)) > 5 else "***",
    }
    
    @staticmethod
    def sanitize_dict(data: Dict[str, Any], context: str = "request") -> Dict[str, Any]:
        """
        Sanitize dictionary by removing sensitive fields
        
        Args:
            data: Dictionary to sanitize
            context: Context (request, response, error) to apply different rules
            
        Returns:
            Sanitized dictionary
        """
        if not isinstance(data, dict):
            return data
        
        sanitized = {}
        
        for key, value in data.items():
            key_lower = key.lower()
            
            # Skip sensitive fields entirely
            if any(sensitive in key_lower for sensitive in LogSanitizer.SENSITIVE_FIELDS):
                continue
            
            # Mask specific fields
            if key_lower in LogSanitizer.MASK_FIELDS:
                sanitized[key] = LogSanitizer.MASK_FIELDS[key_lower](value)
            elif isinstance(value, dict):
                sanitized[key] = LogSanitizer.sanitize_dict(value, context)
            elif isinstance(value, list):
                sanitized[key] = LogSanitizer.sanitize_list(value, context)
            else:
                sanitized[key] = value
        
        return sanitized
    
    @staticmethod
    def sanitize_list(data: List[Any], context: str = "request") -> List[Any]:
        """Sanitize list items"""
        if not isinstance(data, list):
            return data
        
        sanitized = []
        for item in data:
            if isinstance(item, dict):
                sanitized.append(LogSanitizer.sanitize_dict(item, context))
            elif isinstance(item, list):
                sanitized.append(LogSanitizer.sanitize_list(item, context))
            else:
                sanitized.append(item)
        
        return sanitized
    
    @staticmethod
    def sanitize_request_body(body: Any, endpoint: str) -> Any:
        """
        Sanitize request body based on endpoint
        
        Args:
            body: Request body (dict, list, or other)
            endpoint: API endpoint path
            
        Returns:
            Sanitized body
        """
        # For login endpoints, don't log body at all
        if '/login' in endpoint.lower():
            return {"message": "[REDACTED: login request body]"}
        
        # For other endpoints, sanitize normally
        if isinstance(body, dict):
            return LogSanitizer.sanitize_dict(body, "request")
        elif isinstance(body, list):
            return LogSanitizer.sanitize_list(body, "request")
        else:
            return body
    
    @staticmethod
    def sanitize_error_context(error_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize error context for logging
        
        Args:
            error_data: Error context dictionary
            
        Returns:
            Sanitized error context
        """
        sanitized = deepcopy(error_data)
        
        # Remove sensitive fields
        for field in LogSanitizer.SENSITIVE_FIELDS:
            sanitized.pop(field, None)
            # Also check nested structures
            if 'request' in sanitized and isinstance(sanitized['request'], dict):
                sanitized['request'].pop(field, None)
            if 'body' in sanitized:
                sanitized['body'] = LogSanitizer.sanitize_request_body(
                    sanitized['body'], 
                    sanitized.get('path', '')
                )
        
        return sanitized
    
    @staticmethod
    def mask_token(token: str, show_chars: int = 10) -> str:
        """
        Mask JWT token, showing only first N characters
        
        Args:
            token: JWT token string
            show_chars: Number of characters to show
            
        Returns:
            Masked token string
        """
        if not token or len(token) <= show_chars:
            return "***"
        return f"{token[:show_chars]}..."


def sanitize_for_logging(data: Any, context: str = "request") -> Any:
    """
    Convenience function to sanitize any data for logging
    
    Args:
        data: Data to sanitize
        context: Context (request, response, error)
        
    Returns:
        Sanitized data
    """
    if isinstance(data, dict):
        return LogSanitizer.sanitize_dict(data, context)
    elif isinstance(data, list):
        return LogSanitizer.sanitize_list(data, context)
    else:
        return data

