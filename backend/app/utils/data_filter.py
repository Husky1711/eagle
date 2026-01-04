"""
Data Filtering Utilities
Prevent sensitive data leakage in API responses
"""
from typing import Dict, Any, List, Optional, Set


class DataFilter:
    """Filter sensitive data from API responses"""
    
    # Fields to always exclude from public endpoints
    SENSITIVE_FIELDS: Set[str] = {
        "password_hash",
        "password",
        "secret",
        "api_key",
        "token",
        "internal_id",
        "admin_id",
        "created_by",
        "updated_by",
        "last_login",
        "email",  # Can be sensitive in some contexts
    }
    
    # Fields to exclude from courier public responses
    COURIER_PUBLIC_EXCLUDE: Set[str] = {
        "internal_notes",
        "cost",
        "margin",
        "api_credentials",
        "webhook_url",
    }
    
    # Fields to exclude from pricing public responses
    PRICING_PUBLIC_EXCLUDE: Set[str] = {
        "custom_fields",  # May contain sensitive business data
        "internal_notes",
        "created_by",
        "updated_by",
    }
    
    @staticmethod
    def filter_dict(data: Dict[str, Any], exclude_fields: Optional[Set[str]] = None) -> Dict[str, Any]:
        """
        Filter sensitive fields from dictionary
        
        Args:
            data: Dictionary to filter
            exclude_fields: Additional fields to exclude
        
        Returns:
            Filtered dictionary
        """
        if not isinstance(data, dict):
            return data
        
        exclude = DataFilter.SENSITIVE_FIELDS.copy()
        if exclude_fields:
            exclude.update(exclude_fields)
        
        filtered = {}
        for key, value in data.items():
            # Skip sensitive fields
            if key.lower() in exclude or any(sensitive in key.lower() for sensitive in exclude):
                continue
            
            # Recursively filter nested dictionaries
            if isinstance(value, dict):
                filtered[key] = DataFilter.filter_dict(value, exclude_fields)
            elif isinstance(value, list):
                filtered[key] = [
                    DataFilter.filter_dict(item, exclude_fields) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                filtered[key] = value
        
        return filtered
    
    @staticmethod
    def filter_courier_public(courier: Dict[str, Any]) -> Dict[str, Any]:
        """Filter courier data for public API"""
        return DataFilter.filter_dict(courier, DataFilter.COURIER_PUBLIC_EXCLUDE)
    
    @staticmethod
    def filter_pricing_public(pricing_rule: Dict[str, Any]) -> Dict[str, Any]:
        """Filter pricing rule data for public API"""
        filtered = DataFilter.filter_dict(pricing_rule, DataFilter.PRICING_PUBLIC_EXCLUDE)
        
        # Additional filtering: remove detailed custom_fields that might leak business logic
        if "custom_fields" in filtered:
            # Only keep safe custom fields (you can customize this)
            safe_custom_fields = {}
            for key, value in filtered["custom_fields"].items():
                # Only allow certain safe field names
                if key.lower() in ["service_type", "delivery_time"]:
                    safe_custom_fields[key] = value
            filtered["custom_fields"] = safe_custom_fields if safe_custom_fields else None
        
        return filtered
    
    @staticmethod
    def filter_list(data_list: List[Dict[str, Any]], filter_func) -> List[Dict[str, Any]]:
        """Filter a list of dictionaries"""
        return [filter_func(item) for item in data_list]
    
    @staticmethod
    def sanitize_error_message(error: str) -> str:
        """
        Sanitize error messages to prevent information leakage
        
        Args:
            error: Original error message
        
        Returns:
            Sanitized error message
        """
        # Remove file paths
        import re
        error = re.sub(r'[A-Z]:\\[^\s]+', '[path]', error)
        error = re.sub(r'/[^\s]+', '[path]', error)
        
        # Remove potential sensitive data patterns
        error = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[email]', error)
        error = re.sub(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '[card]', error)
        
        return error


# Global instance
data_filter = DataFilter()

