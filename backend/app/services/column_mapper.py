"""
Column mapper service for auto-detecting column mappings
"""
from typing import Dict, List, Optional
from app.utils.logger import logger


class ColumnMapper:
    """Auto-detect column mappings for pricing import"""
    
    # Auto-mapping patterns (case-insensitive)
    AUTO_MAPPINGS = {
        "courier": {
            "patterns": ["courier", "service", "provider", "company", "carrier", "shipping company"],
            "field": "courier",
            "required": True
        },
        "weight_min": {
            "patterns": ["weight min", "min weight", "weight_from", "weight from", "min_weight", "weight_minimum", "minimum weight"],
            "field": "weight_min",
            "required": True
        },
        "weight_max": {
            "patterns": ["weight max", "max weight", "weight_to", "weight to", "max_weight", "weight_maximum", "maximum weight"],
            "field": "weight_max",
            "required": True
        },
        "distance_min": {
            "patterns": ["distance min", "min distance", "distance_from", "distance from", "min_distance", "from distance", "from"],
            "field": "distance_min",
            "required": False
        },
        "distance_max": {
            "patterns": ["distance max", "max distance", "distance_to", "distance to", "max_distance", "to distance", "to"],
            "field": "distance_max",
            "required": False
        },
        "price_per_kg": {
            "patterns": ["price", "rate", "price per kg", "price/kg", "price_per_kg", "cost", "price per kilogram", "rate per kg"],
            "field": "price_per_kg",
            "required": True
        },
        "base_price": {
            "patterns": ["base price", "base_price", "base", "fixed price", "fixed_price", "minimum price"],
            "field": "base_price",
            "required": False
        }
    }
    
    def __init__(self):
        pass
    
    def normalize_column_name(self, column_name: str) -> str:
        """
        Normalize column name for matching
        - Convert to lowercase
        - Remove extra spaces
        - Remove special characters
        """
        if not column_name:
            return ""
        normalized = column_name.lower().strip()
        # Replace common separators with spaces
        normalized = normalized.replace("_", " ").replace("-", " ").replace(".", " ")
        # Remove extra spaces
        normalized = " ".join(normalized.split())
        return normalized
    
    def calculate_similarity(self, column_name: str, pattern: str) -> float:
        """
        Calculate similarity score between column name and pattern
        Returns 0.0 to 1.0
        """
        normalized_col = self.normalize_column_name(column_name)
        normalized_pattern = self.normalize_column_name(pattern)
        
        # Exact match
        if normalized_col == normalized_pattern:
            return 1.0
        
        # Contains match
        if normalized_pattern in normalized_col or normalized_col in normalized_pattern:
            return 0.8
        
        # Word-based matching
        col_words = set(normalized_col.split())
        pattern_words = set(normalized_pattern.split())
        
        if not pattern_words:
            return 0.0
        
        # Calculate word overlap
        common_words = col_words.intersection(pattern_words)
        if common_words:
            overlap_ratio = len(common_words) / len(pattern_words)
            return 0.5 + (overlap_ratio * 0.3)  # 0.5 to 0.8 range
        
        return 0.0
    
    def suggest_mapping(self, column_name: str) -> Optional[Dict[str, any]]:
        """
        Suggest mapping for a single column
        
        Returns:
            Dict with 'field', 'confidence', 'field_type' or None
        """
        if not column_name:
            return None
        
        best_match = None
        best_score = 0.0
        
        # Check against all mapping patterns
        for mapping_key, mapping_config in self.AUTO_MAPPINGS.items():
            patterns = mapping_config["patterns"]
            field = mapping_config["field"]
            
            # Check each pattern
            for pattern in patterns:
                score = self.calculate_similarity(column_name, pattern)
                if score > best_score:
                    best_score = score
                    best_match = {
                        "field": field,
                        "confidence": score,
                        "field_type": self._infer_field_type(field),
                        "required": mapping_config.get("required", False)
                    }
        
        # Only return if confidence is above threshold
        if best_match and best_score >= 0.5:
            return best_match
        
        return None
    
    def _infer_field_type(self, field: str) -> str:
        """Infer field type based on field name"""
        if field in ["weight_min", "weight_max", "distance_min", "distance_max", "price_per_kg", "base_price"]:
            return "number"
        elif field == "courier":
            return "text"
        else:
            return "text"
    
    def suggest_mappings(self, columns: List[str]) -> Dict[str, Dict[str, any]]:
        """
        Suggest mappings for all columns
        
        Args:
            columns: List of column names from Excel/CSV
            
        Returns:
            Dict mapping column_name -> mapping suggestion
        """
        suggestions = {}
        
        for column in columns:
            suggestion = self.suggest_mapping(column)
            if suggestion:
                suggestions[column] = suggestion
            else:
                # No match found - mark as potential custom field
                suggestions[column] = {
                    "field": None,
                    "confidence": 0.0,
                    "field_type": "text",
                    "required": False,
                    "is_custom": True
                }
        
        # Always return suggestions dict, even if empty
        return suggestions
    
    def validate_mapping(self, column_mapping: Dict[str, Dict[str, any]]) -> List[Dict[str, str]]:
        """
        Validate column mapping configuration
        
        Args:
            column_mapping: Dict of column_name -> ColumnMapping config
            
        Returns:
            List of validation errors (empty if valid)
        """
        errors = []
        
        # Check required fields are mapped
        required_fields = {config["field"] for key, config in self.AUTO_MAPPINGS.items() if config.get("required", False)}
        mapped_fields = set()
        
        for column_name, mapping in column_mapping.items():
            field = mapping.get("mapped_field")
            if field:
                mapped_fields.add(field)
        
        # Check for missing required fields
        missing_fields = required_fields - mapped_fields
        if missing_fields:
            errors.append({
                "type": "missing_required",
                "message": f"Required fields not mapped: {', '.join(missing_fields)}",
                "fields": list(missing_fields)
            })
        
        # Check for duplicate mappings (same field mapped to multiple columns)
        field_to_columns = {}
        for column_name, mapping in column_mapping.items():
            field = mapping.get("mapped_field")
            if field and field not in ["custom"]:  # Allow multiple custom fields
                if field not in field_to_columns:
                    field_to_columns[field] = []
                field_to_columns[field].append(column_name)
        
        duplicates = {field: cols for field, cols in field_to_columns.items() if len(cols) > 1}
        if duplicates:
            for field, columns in duplicates.items():
                errors.append({
                    "type": "duplicate_mapping",
                    "message": f"Field '{field}' is mapped to multiple columns: {', '.join(columns)}",
                    "field": field,
                    "columns": columns
                })
        
        return errors


# Global instance
column_mapper = ColumnMapper()

