"""
Chat Prompt Manager Service
Handles prompt storage, retrieval, and generation
"""
from typing import Optional
from datetime import datetime
from app.config import settings
from app.utils.json_handler import JSONHandler
from app.utils.logger import logger


class ChatPromptManager:
    """Service for managing chat prompt"""
    
    def __init__(self, json_handler: JSONHandler):
        self.json_handler = json_handler
        self.prompt_file = settings.CHAT_PROMPT_FILE
        self._cached_prompt: Optional[str] = None
    
    def get_prompt(self) -> str:
        """
        Get current chat prompt
        
        Returns:
            Current prompt string
        """
        try:
            data = self.json_handler.read(self.prompt_file)
            if not data:
                # Fallback to default prompt from ChatService
                logger.warning(f"Prompt file {self.prompt_file} not found, using default")
                return self._get_default_prompt()
            
            prompt = data.get("prompt", "")
            if not prompt:
                logger.warning("Prompt is empty, using default")
                return self._get_default_prompt()
            
            # Cache the prompt
            self._cached_prompt = prompt
            return prompt
            
        except Exception as e:
            logger.error(f"Error reading prompt file: {str(e)}", exc_info=True)
            return self._get_default_prompt()
    
    def update_prompt(self, prompt_text: str, updated_by: str = "admin") -> dict:
        """
        Update chat prompt
        
        Args:
            prompt_text: New prompt text
            updated_by: Username of admin updating the prompt
            
        Returns:
            Updated prompt data with metadata
        """
        try:
            if not prompt_text or not prompt_text.strip():
                raise ValueError("Prompt text cannot be empty")
            
            data = {
                "prompt": prompt_text.strip(),
                "metadata": {
                    "last_updated": datetime.utcnow().isoformat() + "Z",
                    "updated_by": updated_by
                }
            }
            
            self.json_handler.write(self.prompt_file, data)
            
            # Update cache
            self._cached_prompt = prompt_text.strip()
            
            logger.info(f"Prompt updated by {updated_by}")
            
            return data
            
        except Exception as e:
            logger.error(f"Error updating prompt: {str(e)}", exc_info=True)
            raise
    
    def generate_prompt(self, input_text: str) -> str:
        """
        Generate enhanced prompt from raw input text using LLM
        
        Args:
            input_text: Raw text input from admin
            
        Returns:
            Enhanced/structured prompt text
        """
        try:
            if not input_text or not input_text.strip():
                raise ValueError("Input text cannot be empty")
            
            # Create system instruction for LLM
            generation_instruction = """You are a prompt engineering assistant. Your task is to transform the user's input into a professional, well-structured chatbot system prompt.

Guidelines:
1. If the input is unstructured (bullet points, paragraphs), organize it into clear sections with appropriate headers (e.g., "COMPANY INFORMATION:", "SERVICES OFFERED:", "YOUR ROLE:", "IMPORTANT:")
2. If the input is already structured, enhance it while preserving the structure
3. Use clear, professional language
4. Ensure the prompt guides the chatbot to be helpful, accurate, and customer-focused
5. Add appropriate formatting (bullet points, numbered lists, clear sections)
6. Keep the tone professional but friendly
7. Maintain all important information from the input

Output only the enhanced prompt text, without any additional explanation or markdown formatting."""

            # Use GROQ client to generate prompt
            from groq import Groq
            if not settings.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY not configured")
            
            client = Groq(api_key=settings.GROQ_API_KEY)
            
            messages = [
                {
                    "role": "system",
                    "content": generation_instruction
                },
                {
                    "role": "user",
                    "content": f"Transform this into a professional chatbot system prompt:\n\n{input_text.strip()}"
                }
            ]
            
            # Call GROQ API (use same model as chat service: llama-3.1-8b-instant)
            chat_completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=0.7,  # Slightly creative for better formatting
                max_tokens=2000  # Enough for a detailed prompt
            )
            
            generated_prompt = chat_completion.choices[0].message.content.strip()
            
            if not generated_prompt:
                raise ValueError("Generated prompt is empty")
            
            logger.info(f"Prompt generated successfully ({len(generated_prompt)} characters)")
            
            return generated_prompt
            
        except Exception as e:
            logger.error(f"Error generating prompt: {str(e)}", exc_info=True)
            raise
    
    def _get_default_prompt(self) -> str:
        """
        Get default hardcoded prompt (fallback)
        """
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


# Global instance
from app.utils.json_handler import JSONHandler
chat_prompt_manager = ChatPromptManager(JSONHandler(settings.DATA_DIR))

