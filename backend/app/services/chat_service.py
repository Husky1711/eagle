"""
Chat Service using GROQ LLM
Provides intelligent responses about the logistics website
"""
from groq import Groq
from app.config import settings
from app.utils.logger import logger
from typing import List, Dict, Any, Optional


class ChatService:
    """Service for handling chat completions using GROQ"""
    
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if not self.api_key:
            logger.warning("GROQ_API_KEY not set in environment variables")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=self.api_key)
                logger.info("GROQ client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize GROQ client: {str(e)}")
                self.client = None
        
        self.model = "llama-3.1-8b-instant"
        
        # Load system prompt from JSON file (with fallback to default)
        self.system_prompt = self._load_system_prompt()
    
    def _load_system_prompt(self) -> str:
        """
        Load system prompt from JSON file with fallback to default
        
        Returns:
            System prompt string
        """
        try:
            from app.services.chat_prompt_manager import chat_prompt_manager
            prompt = chat_prompt_manager.get_prompt()
            logger.info("System prompt loaded from JSON file")
            return prompt
        except Exception as e:
            logger.warning(f"Failed to load prompt from JSON, using default: {str(e)}")
            # Fallback to default prompt
            return """You are a helpful customer support assistant for LogiSmart, a leading international courier and logistics service provider.

COMPANY INFORMATION:
- Name: LogiSmart (also known as Eagle Logistics)
- Established: 2010
- Services: International courier and cargo services from India to USA, UK, Europe, Middle East, and Far East
- Specialties: Door-to-door bulk pickup and deliveries, food items, books & documents, fashion, electronics

SERVICES OFFERED:
1. International Shipping: India to USA, UK, Europe, Middle East, Far East
2. Door-to-Door Service: Pickup from doorstep and delivery to destination
3. Package Types: Food items (pickles, sweets, spices), Books & Documents, Fashion (clothing, footwear), Electronics
4. Pricing Calculator: Calculate shipping costs based on weight and distance
5. Tracking: Real-time parcel tracking
6. Free Logistics Consulting: Cost-cutting consulting services

KEY FEATURES:
- Reliability: Zero pilferage or damage guarantee
- Global Reach: Worldwide shipping network
- Cost Effective: Competitive prices with free consulting
- Customer Focused: 24/7 tracking and delivery updates

YOUR ROLE:
- Answer questions about shipping services, pricing, tracking, and delivery
- Provide helpful information about the company and services
- Guide users on how to use the website features
- Be friendly, professional, and concise
- If asked about something you don't know, politely redirect to contact page or pricing calculator
- Always maintain a helpful and customer-service oriented tone

IMPORTANT:
- Do not make up pricing information - direct users to the pricing calculator
- Do not provide specific delivery dates - explain that delivery times vary
- For account-specific questions, direct users to contact support
- Keep responses concise but informative (2-4 sentences typically)"""

    def get_chat_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Get chat response from GROQ LLM
        
        Args:
            user_message: User's message
            conversation_history: Optional list of previous messages in format [{"role": "user/assistant", "content": "..."}]
            
        Returns:
            Dictionary with response, model, and usage info
        """
        if not self.client:
            return {
                "response": "I apologize, but the chat service is currently unavailable. Please contact us directly through our contact page.",
                "model": self.model,
                "usage": None,
                "error": "GROQ API not configured"
            }
        
        try:
            # Build messages array
            messages = [
                {"role": "system", "content": self.system_prompt}
            ]
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history:
                    if isinstance(msg, dict) and "role" in msg and "content" in msg:
                        messages.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })
            
            # Add current user message
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Call GROQ API
            chat_completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500,
                top_p=1,
                stream=False
            )
            
            # Extract response
            response_text = chat_completion.choices[0].message.content
            
            # Extract usage info if available
            usage_info = None
            input_tokens = 0
            output_tokens = 0
            
            if hasattr(chat_completion, 'usage'):
                input_tokens = chat_completion.usage.prompt_tokens if hasattr(chat_completion.usage, 'prompt_tokens') else 0
                output_tokens = chat_completion.usage.completion_tokens if hasattr(chat_completion.usage, 'completion_tokens') else 0
                total_tokens = chat_completion.usage.total_tokens if hasattr(chat_completion.usage, 'total_tokens') else (input_tokens + output_tokens)
                
                usage_info = {
                    "prompt_tokens": input_tokens,
                    "completion_tokens": output_tokens,
                    "total_tokens": total_tokens
                }
            
            logger.info(f"Chat response generated successfully. Tokens used: {usage_info.get('total_tokens') if usage_info else 'N/A'}")
            
            # Log usage (fail-safe - don't break chat if logging fails)
            if usage_info and input_tokens > 0:  # Only log if we have actual usage data
                try:
                    import uuid
                    request_id = str(uuid.uuid4())
                    from app.services.chat_usage_logger import chat_usage_logger
                    chat_usage_logger.log_usage(
                        input_tokens=input_tokens,
                        output_tokens=output_tokens,
                        model=self.model,
                        request_id=request_id
                    )
                except Exception as e:
                    logger.error(f"Failed to log chat usage: {str(e)}", exc_info=True)
                    # Don't fail the chat request if logging fails
            
            return {
                "response": response_text,
                "model": self.model,
                "usage": usage_info
            }
            
        except Exception as e:
            logger.error(f"Error generating chat response: {str(e)}", exc_info=True)
            return {
                "response": "I apologize, but I'm having trouble processing your request right now. Please try again later or contact us directly.",
                "model": self.model,
                "usage": None,
                "error": str(e)
            }


# Global instance
chat_service = ChatService()

