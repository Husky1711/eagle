"""
Zone Detection Service
Detects zone columns in Excel/CSV files for zone-based pricing imports
"""
import re
from typing import List, Dict, Any, Tuple


class ZoneDetector:
    """Detects and identifies zone columns in import files"""
    
    # Zone patterns to match common zone column names
    ZONE_PATTERNS = [
        # Standard zone patterns
        r'^zone\s*\d+$',  # ZONE 1, ZONE 2, zone 3, etc.
        r'^zone\s*\d+[a-z]$',  # ZONE 6A, Zone 7A, etc.
        r'^zone\s*\d+\s*[a-z]$',  # ZONE 6 A (with space)
        
        # Country code zones (common in shipping)
        r'^us$',  # US
        r'^ca$',  # CA
        r'^au$',  # AU
        r'^nz$',  # NZ
        r'^sg$',  # SG
        r'^de$',  # DE
        r'^uk$',  # UK
        r'^gb$',  # GB
        
        # Special zone patterns
        r'^zone\s*\d+a$',  # Zone 6A, Zone 7A (case insensitive)
        r'^zone\s*\d+b$',  # Zone 6B, etc.
    ]
    
    # Weight column patterns
    WEIGHT_PATTERNS = [
        r'^weight$',
        r'^weight\s*\(kg\)$',
        r'^weight\s*\(lbs\)$',
        r'^weight\s*\(kg\)',
        r'^wt$',
        r'^weight\s*range$',
    ]
    
    def __init__(self):
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.ZONE_PATTERNS]
        self.weight_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.WEIGHT_PATTERNS]
    
    def is_zone_column(self, column_name: str) -> bool:
        """
        Check if a column name matches zone patterns
        
        Args:
            column_name: Column name from Excel/CSV
            
        Returns:
            True if column appears to be a zone column
        """
        if not column_name or not isinstance(column_name, str):
            return False
        
        column_clean = column_name.strip()
        
        # Check against all zone patterns
        for pattern in self.compiled_patterns:
            if pattern.match(column_clean):
                return True
        
        # Additional heuristic: if column name is exactly 2-3 uppercase letters (country codes)
        if len(column_clean) <= 3 and column_clean.isupper() and column_clean.isalpha():
            # Common country codes that are zones
            common_zones = {'US', 'CA', 'AU', 'NZ', 'SG', 'DE', 'UK', 'GB', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'RO', 'HU', 'USA', 'UAE'}
            if column_clean in common_zones:
                return True
        
        # Geographic names (Continents, Countries)
        geo_names = {
            'europe', 'asia', 'africa', 'america', 'north america', 'south america',
            'canada', 'china', 'india', 'australia', 'new zealand', 'japan', 
            'united kingdom', 'united states', 'mexico', 'brazil', 'russia', 
            'germany', 'france', 'italy', 'spain', 'netherlands'
        }
        
        if column_clean.lower() in geo_names:
            return True
            
        # If it's not a standard reserved column, assume it might be a zone if forced
        # But we must be careful not to match "Price" or "Id"
        reserved_cols = {'courier', 'service', 'service type', 'weight', 'price', 'cost', 'min', 'max', 'id', 'active'}
        if column_clean.lower() not in reserved_cols and len(column_clean) > 1:
            # If it looks like a zone (e.g. "Zone A"), it's handled by regex above
            # If it's just a word like "Alabama", we might miss it unless we add it
            pass

        return False
    
    def is_weight_column(self, column_name: str) -> bool:
        """
        Check if a column name matches weight patterns
        
        Args:
            column_name: Column name from Excel/CSV
            
        Returns:
            True if column appears to be a weight column
        """
        if not column_name or not isinstance(column_name, str):
            return False
        
        column_clean = column_name.strip()
        
        for pattern in self.weight_patterns:
            if pattern.match(column_clean):
                return True
        
        return False
    
    def detect_zones(self, columns: List[str]) -> Dict[str, Any]:
        """
        Detect zone columns and weight column in a list of column names
        
        Args:
            columns: List of column names from Excel/CSV
            
        Returns:
            Dictionary with:
                - zone_columns: List of zone column names
                - weight_column: Weight column name (if found)
                - is_zone_based: Boolean indicating if this looks like zone-based data
                - zone_count: Number of zone columns detected
        """
        zone_columns = []
        weight_column = None
        
        for col in columns:
            if self.is_zone_column(col):
                zone_columns.append(col)
            elif self.is_weight_column(col) and weight_column is None:
                weight_column = col
        
        # Determine if this is zone-based import
        # Criteria: At least 3 zone columns detected (to avoid false positives)
        is_zone_based = len(zone_columns) >= 3
        
        return {
            "zone_columns": zone_columns,
            "weight_column": weight_column,
            "is_zone_based": is_zone_based,
            "zone_count": len(zone_columns),
            "has_weight_column": weight_column is not None
        }
    
    def normalize_zone_name(self, zone_name: str) -> str:
        """
        Normalize zone name for consistent storage
        Converts "ZONE 1" -> "zone_1", "US" -> "us", etc.
        
        Args:
            zone_name: Original zone column name
            
        Returns:
            Normalized zone identifier
        """
        if not zone_name:
            return ""
        
        zone_clean = zone_name.strip()
        
        # If it's a country code, keep it lowercase
        if len(zone_clean) <= 3 and zone_clean.isupper() and zone_clean.isalpha():
            return zone_clean.lower()
        
        # For zone patterns like "ZONE 1", "Zone 6A"
        # Convert to lowercase and replace spaces/separators with underscore
        normalized = re.sub(r'[^a-z0-9]', '_', zone_clean.lower())
        normalized = re.sub(r'_+', '_', normalized)  # Remove multiple underscores
        normalized = normalized.strip('_')  # Remove leading/trailing underscores
        
        return normalized


# Global instance
zone_detector = ZoneDetector()

