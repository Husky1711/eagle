"""
Chat Pricing Manager Service
Manages pricing configuration for GROQ models
"""
from typing import Dict, Optional, List
from datetime import datetime
from app.config import settings
from app.utils.json_handler import JSONHandler
from app.models.chat import ModelPricing, ModelInfo, ModelsListResponse, PricingConfigUpdate
from app.utils.logger import logger


class ChatPricingManager:
    """Service for managing chat pricing configuration"""
    
    def __init__(self, json_handler: JSONHandler):
        self.json_handler = json_handler
        self.pricing_file = settings.CHAT_PRICING_CONFIG_FILE
    
    def get_pricing_config(self) -> Dict[str, ModelPricing]:
        """
        Get pricing configuration for all models
        
        Returns:
            Dictionary mapping model names to pricing config
        """
        try:
            data = self.json_handler.read(self.pricing_file)
            models = data.get("models", {})
            
            # Convert to ModelPricing objects
            pricing_config = {}
            for model_name, pricing_data in models.items():
                pricing_config[model_name] = ModelPricing(**pricing_data)
            
            return pricing_config
        except Exception as e:
            logger.error(f"Error loading pricing config: {str(e)}", exc_info=True)
            # Return default pricing if file doesn't exist
            return {
                "llama-3.1-8b-instant": ModelPricing(
                    input_price_per_million=0.05,
                    output_price_per_million=0.08,
                    currency="USD",
                    speed_tps=840,
                    context_window=128000,
                    last_updated=datetime.utcnow()
                )
            }
    
    def get_model_pricing(self, model: str) -> Optional[ModelPricing]:
        """
        Get pricing configuration for a specific model
        
        Args:
            model: Model name (e.g., "llama-3.1-8b-instant")
            
        Returns:
            ModelPricing object or None if model not found
        """
        config = self.get_pricing_config()
        return config.get(model)
    
    def update_pricing_config(
        self,
        model: str,
        input_price_per_million: float,
        output_price_per_million: float,
        currency: str = "USD",
        speed_tps: Optional[int] = None,
        context_window: Optional[int] = None
    ) -> Dict[str, ModelPricing]:
        """
        Update pricing configuration for a model
        
        Args:
            model: Model name
            input_price_per_million: Price per million input tokens
            output_price_per_million: Price per million output tokens
            currency: Currency code (default: "USD")
            speed_tps: Tokens per second (optional)
            context_window: Context window size (optional)
            
        Returns:
            Updated pricing configuration
        """
        # Validate prices
        if input_price_per_million < 0 or input_price_per_million > 10.0:
            raise ValueError("Input price must be between 0 and 10.0 USD per million tokens")
        if output_price_per_million < 0 or output_price_per_million > 10.0:
            raise ValueError("Output price must be between 0 and 10.0 USD per million tokens")
        
        try:
            # Load existing config
            data = self.json_handler.read(self.pricing_file)
            if not data:
                data = {"models": {}, "metadata": {}}
            
            models = data.get("models", {})
            now = datetime.utcnow().isoformat() + "Z"
            
            # Preserve existing metadata if available
            existing_speed = None
            existing_context = None
            if model in models:
                existing = models[model]
                existing_speed = existing.get("speed_tps")
                existing_context = existing.get("context_window")
            
            # Update model pricing
            models[model] = {
                "input_price_per_million": input_price_per_million,
                "output_price_per_million": output_price_per_million,
                "currency": currency,
                "speed_tps": speed_tps if speed_tps is not None else existing_speed,
                "context_window": context_window if context_window is not None else existing_context,
                "last_updated": now
            }
            
            data["models"] = models
            metadata = data.get("metadata", {})
            metadata["last_updated"] = now
            data["metadata"] = metadata
            
            # Save config
            self.json_handler.write(self.pricing_file, data)
            
            logger.info(f"Pricing config updated for model: {model}")
            
            # Return updated config
            return self.get_pricing_config()
            
        except Exception as e:
            logger.error(f"Error updating pricing config: {str(e)}", exc_info=True)
            raise
    
    def get_all_models(self) -> ModelsListResponse:
        """
        Get all available models with pricing information
        
        Returns:
            ModelsListResponse with all models
        """
        try:
            pricing_config = self.get_pricing_config()
            
            models = []
            for model_name, pricing in pricing_config.items():
                models.append(ModelInfo(
                    name=model_name,
                    pricing=pricing,
                    available=True
                ))
            
            return ModelsListResponse(
                models=models,
                total=len(models)
            )
        except Exception as e:
            logger.error(f"Error getting all models: {str(e)}", exc_info=True)
            # Return empty list on error
            return ModelsListResponse(models=[], total=0)
    
    def bulk_update_pricing(self, updates: List[PricingConfigUpdate]) -> Dict[str, ModelPricing]:
        """
        Bulk update pricing for multiple models
        
        Args:
            updates: List of pricing updates
            
        Returns:
            Updated pricing configuration
        """
        # Validate all updates first (all or nothing)
        for update in updates:
            if update.input_price_per_million < 0 or update.input_price_per_million > 10.0:
                raise ValueError(f"Invalid input price for model {update.model}: must be between 0 and 10.0 USD")
            if update.output_price_per_million < 0 or update.output_price_per_million > 10.0:
                raise ValueError(f"Invalid output price for model {update.model}: must be between 0 and 10.0 USD")
        
        try:
            # Load existing config
            data = self.json_handler.read(self.pricing_file)
            if not data:
                data = {"models": {}, "metadata": {}}
            
            models = data.get("models", {})
            now = datetime.utcnow().isoformat() + "Z"
            
            # Apply all updates
            for update in updates:
                models[update.model] = {
                    "input_price_per_million": update.input_price_per_million,
                    "output_price_per_million": update.output_price_per_million,
                    "currency": update.currency,
                    "speed_tps": update.speed_tps,
                    "context_window": update.context_window,
                    "last_updated": now
                }
            
            data["models"] = models
            data["metadata"] = {
                "last_updated": now,
                "source": data.get("metadata", {}).get("source", "groq.com/pricing"),
                "total_models": len(models)
            }
            
            # Save config (atomic write)
            self.json_handler.write(self.pricing_file, data)
            
            logger.info(f"Bulk pricing update: {len(updates)} models updated")
            
            # Return updated config
            return self.get_pricing_config()
            
        except Exception as e:
            logger.error(f"Error bulk updating pricing: {str(e)}", exc_info=True)
            raise


# Global instance
from app.utils.json_handler import JSONHandler
chat_pricing_manager = ChatPricingManager(JSONHandler(settings.DATA_DIR))

