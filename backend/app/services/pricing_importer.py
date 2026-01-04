"""
Pricing Rule Importer Service
Transforms Excel/CSV rows into pricing rules and handles import execution
"""
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
import uuid
from app.utils.json_handler import JSONHandler
from app.config import settings
from app.utils.logger import logger
from app.services.file_parser import file_parser
from app.services.column_mapper import column_mapper


class PricingImporter:
    """Service for importing pricing rules from Excel/CSV files"""
    
    def __init__(self, json_handler: JSONHandler):
        self.json_handler = json_handler
    
    def transform_row_to_rule(
        self,
        row: Dict[str, Any],
        column_mapping: Dict[str, Dict[str, Any]],
        courier_ids: Dict[str, str],
        courier_names: Dict[str, str]
    ) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Transform a single Excel row into a pricing rule
        
        Args:
            row: Excel row data (dict of column_name -> value)
            column_mapping: Column mapping configuration
            courier_ids: Dict mapping courier ID -> courier ID
            courier_names: Dict mapping courier name -> courier ID
            
        Returns:
            Tuple of (rule_dict or None, list of errors)
        """
        errors = []
        mapped_data = {}
        custom_fields = {}
        
        # Apply mapping
        for column_name, mapping_config in column_mapping.items():
            # Handle both dict and ColumnMapping object
            if isinstance(mapping_config, dict):
                mapped_field = mapping_config.get("mapped_field")
                custom_field_name = mapping_config.get("custom_field_name")
            else:
                mapped_field = mapping_config.mapped_field if hasattr(mapping_config, 'mapped_field') else None
                custom_field_name = mapping_config.custom_field_name if hasattr(mapping_config, 'custom_field_name') else None
            
            if not mapped_field or mapped_field == "":
                continue
            
            if mapped_field == "custom":
                # Custom field
                if column_name in row:
                    field_name = custom_field_name or column_name
                    # Remove 'custom_' prefix if present
                    clean_name = field_name.replace('custom_', '') if field_name.startswith('custom_') else field_name
                    custom_fields[clean_name] = row[column_name]
                continue
            
            # Get value from row
            value = row.get(column_name, "")
            
            # Map to rule fields
            if mapped_field == "courier":
                value_lower = str(value).lower().strip()
                courier_id = courier_ids.get(value_lower) or courier_names.get(value_lower)
                if not courier_id:
                    errors.append({
                        "row": "unknown",  # Will be set by caller
                        "column": column_name,
                        "error": f"Courier '{value}' not found in system",
                        "value": value
                    })
                else:
                    mapped_data["courier"] = courier_id
            
            elif mapped_field == "weight_min":
                try:
                    mapped_data["weight_min"] = float(value) if value else 0
                    if mapped_data["weight_min"] < 0:
                        errors.append({
                            "row": "unknown",
                            "column": column_name,
                            "error": f"Weight min must be positive, got: {value}",
                            "value": value
                        })
                except (ValueError, TypeError):
                    errors.append({
                        "row": "unknown",
                        "column": column_name,
                        "error": f"Invalid weight min: '{value}'",
                        "value": value
                    })
            
            elif mapped_field == "weight_max":
                try:
                    mapped_data["weight_max"] = float(value) if value else 0
                    if mapped_data["weight_max"] < 0:
                        errors.append({
                            "row": "unknown",
                            "column": column_name,
                            "error": f"Weight max must be positive, got: {value}",
                            "value": value
                        })
                except (ValueError, TypeError):
                    errors.append({
                        "row": "unknown",
                        "column": column_name,
                        "error": f"Invalid weight max: '{value}'",
                        "value": value
                    })
            
            elif mapped_field == "distance_min":
                try:
                    mapped_data["distance_min"] = float(value) if value else 0
                    if mapped_data["distance_min"] < 0:
                        errors.append({
                            "row": "unknown",
                            "column": column_name,
                            "error": f"Distance min must be positive, got: {value}",
                            "value": value
                        })
                except (ValueError, TypeError):
                    errors.append({
                        "row": "unknown",
                        "column": column_name,
                        "error": f"Invalid distance min: '{value}'",
                        "value": value
                    })
            
            elif mapped_field == "distance_max":
                try:
                    mapped_data["distance_max"] = float(value) if value else 0
                    if mapped_data["distance_max"] < 0:
                        errors.append({
                            "row": "unknown",
                            "column": column_name,
                            "error": f"Distance max must be positive, got: {value}",
                            "value": value
                        })
                except (ValueError, TypeError):
                    errors.append({
                        "row": "unknown",
                        "column": column_name,
                        "error": f"Invalid distance max: '{value}'",
                        "value": value
                    })
            
            elif mapped_field == "price_per_kg":
                try:
                    mapped_data["price_per_kg"] = float(value) if value else 0
                    if mapped_data["price_per_kg"] < 0:
                        errors.append({
                            "row": "unknown",
                            "column": column_name,
                            "error": f"Price per kg must be positive, got: {value}",
                            "value": value
                        })
                except (ValueError, TypeError):
                    errors.append({
                        "row": "unknown",
                        "column": column_name,
                        "error": f"Invalid price per kg: '{value}'",
                        "value": value
                    })
            
            elif mapped_field == "active":
                # Handle boolean values
                if isinstance(value, bool):
                    mapped_data["active"] = value
                elif isinstance(value, str):
                    value_lower = value.lower().strip()
                    mapped_data["active"] = value_lower in ["yes", "true", "1", "active", "1"]
                else:
                    mapped_data["active"] = bool(value)
        
        # If there are errors, return None
        if errors:
            return None, errors
        
        # Validate required fields
        if "courier" not in mapped_data:
            errors.append({
                "row": "unknown",
                "column": "courier",
                "error": "Courier is required",
                "value": ""
            })
            return None, errors
        
        if "weight_min" not in mapped_data or "weight_max" not in mapped_data:
            errors.append({
                "row": "unknown",
                "column": "weight_range",
                "error": "Weight min and max are required",
                "value": ""
            })
            return None, errors
        
        # Build pricing rule structure
        weight_range = {
            "min": mapped_data.get("weight_min", 0),
            "max": mapped_data.get("weight_max", 0),
            "unit": "kg"
        }
        
        # Build distance zone
        distance_zone = {
            "zone": "standard",  # Default zone name
            "max_distance": mapped_data.get("distance_max", 0),
            "unit": "km",
            "base_price": 0,  # Default, can be overridden
            "price_per_kg": mapped_data.get("price_per_kg", 0),
            "estimated_delivery": "3-5 days"  # Default
        }
        
        # If distance_min is provided, use it as min_distance
        if "distance_min" in mapped_data:
            distance_zone["min_distance"] = mapped_data["distance_min"]
        
        rule = {
            "courier": mapped_data["courier"],
            "weight_range": weight_range,
            "distance_zones": [distance_zone],
            "active": mapped_data.get("active", True)
        }
        
        # Add custom fields if any
        if custom_fields:
            rule["custom_fields"] = custom_fields
        
        return rule, []
    
    def find_duplicate_rule(
        self,
        new_rule: Dict[str, Any],
        existing_rules: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Find duplicate rule based on courier, weight range, and distance zones
        
        Args:
            new_rule: New rule to check
            existing_rules: List of existing rules
            
        Returns:
            Duplicate rule if found, None otherwise
        """
        new_courier = new_rule.get("courier")
        new_weight_min = new_rule.get("weight_range", {}).get("min")
        new_weight_max = new_rule.get("weight_range", {}).get("max")
        new_distance_zones = new_rule.get("distance_zones", [])
        
        for existing_rule in existing_rules:
            if existing_rule.get("courier") != new_courier:
                continue
            
            existing_weight = existing_rule.get("weight_range", {})
            if (existing_weight.get("min") == new_weight_min and 
                existing_weight.get("max") == new_weight_max):
                # Check distance zones match
                existing_zones = existing_rule.get("distance_zones", [])
                if existing_zones and new_distance_zones:
                    # Simple match: check if first zone matches
                    existing_zone = existing_zones[0]
                    new_zone = new_distance_zones[0]
                    if (existing_zone.get("max_distance") == new_zone.get("max_distance") and
                        existing_zone.get("price_per_kg") == new_zone.get("price_per_kg")):
                        return existing_rule
        
        return None
    
    def execute_import(
        self,
        file_id: str,
        column_mapping: Dict[str, Dict[str, Any]],
        import_mode: str = "create"
    ) -> Dict[str, Any]:
        """
        Execute the import process
        
        Args:
            file_id: File ID from analyze step
            column_mapping: Column mapping configuration
            import_mode: "create", "update", or "skip_duplicates"
            
        Returns:
            Dict with success_count, error_count, errors, and imported_rules
        """
        # Load file data
        file_data = file_parser.get_file_data(file_id)
        if not file_data:
            raise ValueError(f"File data not found for file_id: {file_id}")
        
        # Get rows - handle both direct rows and preview_rows format
        rows = file_data.get("rows", [])
        if not rows and "preview_rows" in file_data:
            # If preview_rows format, extract original rows
            rows = [row.get("original_row", row.get("data", {})) for row in file_data.get("preview_rows", [])]
        
        # Load couriers for validation
        couriers = self.json_handler.read_list("couriers.json")
        courier_ids = {c.get("id", "").lower(): c.get("id", "") for c in couriers}
        courier_names = {c.get("name", "").lower(): c.get("id", "") for c in couriers}
        
        # Load existing rules
        existing_rules = self.json_handler.read_list("pricing_rules.json")
        
        # Process rows
        success_count = 0
        error_count = 0
        errors = []
        imported_rules = []
        skipped_count = 0
        
        for row_idx, row in enumerate(rows):
            row_num = row_idx + 1
            
            # Transform row to rule
            rule, row_errors = self.transform_row_to_rule(
                row, column_mapping, courier_ids, courier_names
            )
            
            if row_errors:
                # Update row numbers in errors
                for error in row_errors:
                    error["row"] = row_num
                errors.extend(row_errors)
                error_count += 1
                continue
            
            if not rule:
                errors.append({
                    "row": row_num,
                    "column": "general",
                    "error": "Failed to transform row to pricing rule",
                    "value": ""
                })
                error_count += 1
                continue
            
            # Check for duplicates
            duplicate = self.find_duplicate_rule(rule, existing_rules)
            
            if duplicate:
                if import_mode == "skip_duplicates":
                    skipped_count += 1
                    continue
                elif import_mode == "update":
                    # Update existing rule
                    rule_id = duplicate.get("id")
                    rule_update = {
                        "courier": rule.get("courier"),
                        "weight_range": rule.get("weight_range"),
                        "distance_zones": rule.get("distance_zones"),
                        "active": rule.get("active", True)
                    }
                    if "custom_fields" in rule:
                        rule_update["custom_fields"] = rule["custom_fields"]
                    
                    # Update in JSON
                    success = self.json_handler.update_item("pricing_rules.json", rule_id, rule_update)
                    if success:
                        success_count += 1
                        imported_rules.append({
                            "id": rule_id,
                            "action": "updated",
                            "courier": rule.get("courier")
                        })
                    else:
                        errors.append({
                            "row": row_num,
                            "column": "general",
                            "error": f"Failed to update existing rule {rule_id}",
                            "value": ""
                        })
                        error_count += 1
                    continue
            
            # Create new rule
            if import_mode in ["create", "update"]:
                rule_id = str(uuid.uuid4())
                new_rule = {
                    "id": rule_id,
                    **rule
                }
                
                existing_rules.append(new_rule)
                success_count += 1
                imported_rules.append({
                    "id": rule_id,
                    "action": "created",
                    "courier": rule.get("courier")
                })
        
        # Save all new rules at once
        if success_count > 0 and import_mode in ["create", "update"]:
            self.json_handler.write_list("pricing_rules.json", existing_rules)
        
        return {
            "success_count": success_count,
            "error_count": error_count,
            "skipped_count": skipped_count,
            "errors": errors,
            "imported_rules": imported_rules
        }
    
    def execute_zone_based_import(
        self,
        rules: List[Dict[str, Any]],
        import_mode: str = "create",
        errors: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute zone-based import with pre-transformed rules
        
        Args:
            rules: List of pre-transformed pricing rules (from matrix transformer)
            import_mode: "create", "update", or "skip_duplicates"
            errors: List of transformation errors
            
        Returns:
            Dict with success_count, error_count, errors, and imported_rules
        """
        if errors is None:
            errors = []
        
        existing_rules = self.json_handler.read_list("pricing_rules.json")
        success_count = 0
        error_count = len(errors)  # Start with transformation errors
        skipped_count = 0
        imported_rules_ids = []
        
        # Load couriers for validation
        couriers = self.json_handler.read_list("couriers.json")
        courier_ids = {c.get("id", "").lower(): c.get("id", "") for c in couriers}
        
        for rule in rules:
            # Validate courier
            courier = rule.get("courier", "")
            courier_lower = courier.lower()
            if courier_lower not in courier_ids:
                error_count += 1
                errors.append({
                    "row": "unknown",
                    "column": "courier",
                    "error": f"Courier '{courier}' not found in system",
                    "value": courier
                })
                continue
            
            # Use validated courier ID
            rule["courier"] = courier_ids[courier_lower]
            
            # Check for duplicates based on courier, weight range, and zone
            duplicate_rule = None
            if import_mode in ["update", "skip_duplicates"]:
                rule_courier = rule.get("courier")
                rule_weight_min = rule.get("weight_range", {}).get("min")
                rule_weight_max = rule.get("weight_range", {}).get("max")
                rule_zone = rule.get("zone")
                
                for existing_rule in existing_rules:
                    existing_courier = existing_rule.get("courier")
                    existing_weight_min = existing_rule.get("weight_range", {}).get("min")
                    existing_weight_max = existing_rule.get("weight_range", {}).get("max")
                    existing_zone = existing_rule.get("zone")
                    
                    if (existing_courier == rule_courier and
                        existing_weight_min == rule_weight_min and
                        existing_weight_max == rule_weight_max and
                        existing_zone == rule_zone):
                        duplicate_rule = existing_rule
                        break
            
            # Handle import modes
            if import_mode == "create":
                # Always create new
                rule_id = str(uuid.uuid4())
                rule["id"] = rule_id
                existing_rules.append(rule)
                imported_rules_ids.append(rule_id)
                success_count += 1
            elif import_mode == "update" and duplicate_rule:
                # Update existing
                rule_id = duplicate_rule["id"]
                # Merge rule data
                for key, value in rule.items():
                    if key != "id":
                        duplicate_rule[key] = value
                imported_rules_ids.append(rule_id)
                success_count += 1
            elif import_mode == "skip_duplicates" and duplicate_rule:
                # Skip duplicate
                skipped_count += 1
            else:
                # Create new (no duplicate found)
                rule_id = str(uuid.uuid4())
                rule["id"] = rule_id
                existing_rules.append(rule)
                imported_rules_ids.append(rule_id)
                success_count += 1
        
        # Save all changes
        if success_count > 0:
            self.json_handler.write_list("pricing_rules.json", existing_rules)
        
        return {
            "success_count": success_count,
            "error_count": error_count,
            "skipped_count": skipped_count,
            "errors": errors,
            "imported_rules": imported_rules_ids
        }


# Create singleton instance
json_handler = JSONHandler(settings.DATA_DIR)
pricing_importer = PricingImporter(json_handler)

