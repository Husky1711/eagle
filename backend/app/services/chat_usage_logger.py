"""
Chat Usage Logger Service
Logs chat API usage and calculates costs
"""
from typing import Optional
from datetime import datetime
import uuid
from app.config import settings
from app.utils.json_handler import JSONHandler
from app.utils.logger import logger

# Import JSONHandler at module level
json_handler_instance = JSONHandler(settings.DATA_DIR)


class ChatUsageLogger:
    """Service for logging chat API usage"""
    
    def __init__(self, json_handler: JSONHandler):
        self.json_handler = json_handler
        self.usage_file = settings.CHAT_USAGE_LOG_FILE
    
    def log_usage(
        self,
        input_tokens: int,
        output_tokens: int,
        model: str,
        request_id: Optional[str] = None
    ) -> None:
        """
        Log usage to JSON file and update stats cache
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model name (e.g., "llama-3.1-8b-instant")
            request_id: Optional request ID for tracking
        """
        try:
            # Load existing data
            data = self.json_handler.read(self.usage_file)
            if not data:
                data = {
                    "logs": [],
                    "stats_cache": {
                        "last_calculated": None,
                        "total_requests": 0,
                        "total_input_tokens": 0,
                        "total_output_tokens": 0,
                        "total_tokens": 0,
                        "total_cost_usd": 0.0
                    },
                    "metadata": {
                        "last_logged": None,
                        "retention_days": settings.CHAT_USAGE_RETENTION_DAYS
                    }
                }
            
            logs = data.get("logs", [])
            stats_cache = data.get("stats_cache", {})
            metadata = data.get("metadata", {})
            
            # Calculate cost
            cost_usd = self._calculate_cost(input_tokens, output_tokens, model)
            total_tokens = input_tokens + output_tokens
            
            # Create log entry
            log_entry = {
                "id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "model": model,
                "cost_usd": round(cost_usd, 8),
                "request_id": request_id
            }
            
            # Add log entry
            logs.append(log_entry)
            
            # Update stats cache
            stats_cache["last_calculated"] = datetime.utcnow().isoformat() + "Z"
            stats_cache["total_requests"] = stats_cache.get("total_requests", 0) + 1
            stats_cache["total_input_tokens"] = stats_cache.get("total_input_tokens", 0) + input_tokens
            stats_cache["total_output_tokens"] = stats_cache.get("total_output_tokens", 0) + output_tokens
            stats_cache["total_tokens"] = stats_cache.get("total_tokens", 0) + total_tokens
            stats_cache["total_cost_usd"] = round(stats_cache.get("total_cost_usd", 0.0) + cost_usd, 8)
            
            # Update metadata
            metadata["last_logged"] = datetime.utcnow().isoformat() + "Z"
            metadata["retention_days"] = settings.CHAT_USAGE_RETENTION_DAYS
            
            # Save data
            data["logs"] = logs
            data["stats_cache"] = stats_cache
            data["metadata"] = metadata
            
            self.json_handler.write(self.usage_file, data)
            
            logger.debug(f"Chat usage logged: {total_tokens} tokens, ${cost_usd:.8f}")
            
        except Exception as e:
            logger.error(f"Error logging chat usage: {str(e)}", exc_info=True)
            # Don't raise exception - fail-safe logging
    
    def _calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """
        Calculate cost from pricing config
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model name
            
        Returns:
            Cost in USD
        """
        try:
            # Import here to avoid circular dependency
            from app.services.chat_pricing import chat_pricing_manager
            pricing = chat_pricing_manager.get_model_pricing(model)
            if not pricing:
                logger.warning(f"Pricing not found for model: {model}, using default")
                # Default pricing (llama-3.1-8b-instant)
                input_price = 0.05
                output_price = 0.08
            else:
                input_price = pricing.input_price_per_million
                output_price = pricing.output_price_per_million
            
            input_cost = (input_tokens / 1_000_000) * input_price
            output_cost = (output_tokens / 1_000_000) * output_price
            
            return input_cost + output_cost
            
        except Exception as e:
            logger.error(f"Error calculating cost: {str(e)}", exc_info=True)
            # Return 0 on error
            return 0.0


# Global instance
chat_usage_logger = ChatUsageLogger(json_handler_instance)

