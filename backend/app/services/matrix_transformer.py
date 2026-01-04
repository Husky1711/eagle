"""
Matrix Transformer Service
Transforms matrix-style Excel rows (weight × zones) into multiple pricing rules
"""
from typing import List, Dict, Any, Optional, Tuple
from app.utils.logger import logger


class MatrixTransformer:
    """Transforms matrix rows into individual pricing rules"""
    
    def __init__(self):
        pass
    
    def convert_weight_point_to_range(
        self,
        weight_point: float,
        method: str = "point_to_range"
    ) -> Dict[str, Any]:
        """
        Convert a weight point (e.g., 0.5kg) to a weight range
        
        Args:
            weight_point: Weight value (e.g., 0.5, 1.0, 1.5)
            method: Conversion method
                - "point_to_range": 0.5kg → {min: 0, max: 0.5}
                - "point_to_next": 0.5kg → {min: 0.5, max: 1.0}
                - "point_to_mid": 0.5kg → {min: 0.25, max: 0.75}
        
        Returns:
            Weight range dictionary with min, max, unit
        """
        try:
            weight = float(weight_point)
        except (ValueError, TypeError):
            logger.warning(f"Invalid weight point: {weight_point}, defaulting to 0-0.5")
            return {"min": 0, "max": 0.5, "unit": "kg"}
        
        if method == "point_to_range":
            # 0.5kg → {min: 0, max: 0.5}
            return {
                "min": 0,
                "max": weight,
                "unit": "kg"
            }
        elif method == "point_to_next":
            # 0.5kg → {min: 0.5, max: 1.0}
            # This assumes next weight point is +0.5 (common pattern)
            # For more complex cases, we'd need the next weight point
            next_weight = weight + 0.5  # Default increment
            return {
                "min": weight,
                "max": next_weight,
                "unit": "kg"
            }
        elif method == "point_to_mid":
            # 0.5kg → {min: 0.25, max: 0.75}
            half = weight / 2
            return {
                "min": weight - half,
                "max": weight + half,
                "unit": "kg"
            }
        else:
            # Default to point_to_range
            return {
                "min": 0,
                "max": weight,
                "unit": "kg"
            }
    
    def convert_weight_point_to_range_with_next(
        self,
        weight_point: float,
        next_weight_point: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Convert weight point to range using next weight point if available
        
        Args:
            weight_point: Current weight point
            next_weight_point: Next weight point in the sequence (if available)
            
        Returns:
            Weight range dictionary
        """
        try:
            weight = float(weight_point)
        except (ValueError, TypeError):
            return {"min": 0, "max": 0.5, "unit": "kg"}
        
        if next_weight_point is not None:
            try:
                next_weight = float(next_weight_point)
                return {
                    "min": weight,
                    "max": next_weight,
                    "unit": "kg"
                }
            except (ValueError, TypeError):
                pass
        
        # Fallback: use default increment
        return {
            "min": weight,
            "max": weight + 0.5,
            "unit": "kg"
        }
    
    def transform_matrix_row(
        self,
        row: Dict[str, Any],
        zone_columns: List[str],
        weight_column: str,
        courier: str,
        weight_conversion_method: str = "point_to_range",
        next_weight_value: Optional[float] = None,
        service_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Transform one matrix row into multiple pricing rules (one per zone)
        
        Args:
            row: Excel row data as dictionary
            zone_columns: List of zone column names
            weight_column: Name of the weight column
            courier: Courier identifier
            weight_conversion_method: How to convert weight point to range
            next_weight_value: Next weight point (for better range calculation)
            service_type: Optional service type (e.g., "UPS Envelope", "Package")
            
        Returns:
            List of pricing rule dictionaries
        """
        rules = []
        
        # Get weight value
        weight_value = row.get(weight_column, 0)
        
        # Convert weight point to range
        if next_weight_value is not None:
            weight_range = self.convert_weight_point_to_range_with_next(
                weight_value,
                next_weight_value
            )
        else:
            weight_range = self.convert_weight_point_to_range(
                weight_value,
                weight_conversion_method
            )
        
        # Create a rule for each zone column
        for zone_col in zone_columns:
            # Get price from zone column
            price_value = row.get(zone_col, 0)
            
            # Skip if price is empty or invalid
            if not price_value or price_value == "":
                continue
            
            try:
                # Try to convert price to float
                price = float(price_value)
            except (ValueError, TypeError):
                logger.warning(f"Invalid price value '{price_value}' in zone '{zone_col}', skipping")
                continue
            
            # Normalize zone name
            from app.services.zone_detector import zone_detector
            zone_id = zone_detector.normalize_zone_name(zone_col)
            
            # Build pricing rule
            rule = {
                "courier": courier,
                "weight_range": weight_range,
                "pricing_type": "zone",  # Mark as zone-based pricing
                "zone": zone_id,
                "zone_name": zone_col,  # Keep original name for reference
                "price": price,  # Direct price (not per kg)
                "active": True,
                "custom_fields": {}
            }
            
            # Add service type as custom field if provided
            if service_type:
                rule["custom_fields"]["service_type"] = service_type
            
            rules.append(rule)
        
        return rules
    
    def transform_matrix_data(
        self,
        rows: List[Dict[str, Any]],
        zone_columns: List[str],
        weight_column: str,
        courier: str,
        weight_conversion_method: str = "point_to_range",
        service_type: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Transform entire matrix dataset into pricing rules
        
        Args:
            rows: List of Excel rows
            zone_columns: List of zone column names
            weight_column: Name of the weight column
            courier: Courier identifier
            weight_conversion_method: How to convert weight points
            service_type: Optional service type
            
        Returns:
            Tuple of (rules, errors)
        """
        all_rules = []
        errors = []
        
        # Sort rows by weight to help with range calculation
        try:
            sorted_rows = sorted(
                rows,
                key=lambda r: float(r.get(weight_column, 0))
            )
        except (ValueError, TypeError):
            sorted_rows = rows
        
        # Process each row
        for row_idx, row in enumerate(sorted_rows):
            # Get next weight value for better range calculation
            next_weight = None
            if row_idx + 1 < len(sorted_rows):
                try:
                    next_weight = float(sorted_rows[row_idx + 1].get(weight_column, 0))
                except (ValueError, TypeError):
                    pass
            
            try:
                rules = self.transform_matrix_row(
                    row=row,
                    zone_columns=zone_columns,
                    weight_column=weight_column,
                    courier=courier,
                    weight_conversion_method=weight_conversion_method,
                    next_weight_value=next_weight,
                    service_type=service_type
                )
                all_rules.extend(rules)
            except Exception as e:
                logger.error(f"Error transforming row {row_idx + 1}: {str(e)}", exc_info=True)
                errors.append({
                    "row": row_idx + 1,
                    "error": f"Failed to transform row: {str(e)}",
                    "data": row
                })
        
        return all_rules, errors


# Global instance
matrix_transformer = MatrixTransformer()

