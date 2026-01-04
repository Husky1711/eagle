"""
Chat-related Pydantic models
"""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class ChatMessage(BaseModel):
    """Chat message structure"""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Chat request from user"""
    message: str
    conversation_history: Optional[List[ChatMessage]] = None  # Optional conversation history


class ChatResponse(BaseModel):
    """Chat response from bot"""
    response: str
    model: str = "llama-3.1-8b-instant"
    usage: Optional[dict] = None  # Token usage info if available


# Usage Tracking Models
class UsageLog(BaseModel):
    """Usage log entry"""
    id: str
    timestamp: datetime
    input_tokens: int
    output_tokens: int
    total_tokens: int
    model: str
    cost_usd: float
    request_id: Optional[str] = None


class DailyBreakdown(BaseModel):
    """Daily aggregated statistics"""
    date: str  # ISO date format (YYYY-MM-DD)
    requests: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float


class UsageStatsResponse(BaseModel):
    """Usage statistics response"""
    period: str
    total_requests: int
    total_input_tokens: int
    total_output_tokens: int
    total_tokens: int
    total_cost_usd: float
    average_cost_per_request: float
    average_tokens_per_request: float
    daily_breakdown: List[DailyBreakdown]


class PaginationInfo(BaseModel):
    """Pagination information"""
    page: int
    limit: int
    total: int
    total_pages: int


class UsageLogsResponse(BaseModel):
    """Paginated usage logs response"""
    logs: List[UsageLog]
    pagination: PaginationInfo


class PeriodSummary(BaseModel):
    """Summary statistics for a period"""
    requests: int
    tokens: int
    cost_usd: float


class ModelPricing(BaseModel):
    """Pricing configuration for a model"""
    input_price_per_million: float
    output_price_per_million: float
    currency: str = "USD"
    speed_tps: Optional[int] = None  # Tokens per second
    context_window: Optional[int] = None  # Context window size
    last_updated: datetime


class PricingConfigResponse(BaseModel):
    """Pricing configuration response"""
    models: Dict[str, ModelPricing]


class PricingConfigUpdate(BaseModel):
    """Pricing configuration update request"""
    model: str
    input_price_per_million: float
    output_price_per_million: float
    currency: str = "USD"
    speed_tps: Optional[int] = None
    context_window: Optional[int] = None


class ModelInfo(BaseModel):
    """Model information with pricing"""
    name: str
    pricing: ModelPricing
    available: bool = True


class ModelsListResponse(BaseModel):
    """List of available models"""
    models: List[ModelInfo]
    total: int


class BulkPricingUpdate(BaseModel):
    """Bulk pricing update request"""
    updates: List[PricingConfigUpdate]  # Array of individual updates


# Prompt Management Models
class PromptResponse(BaseModel):
    """Chat prompt response"""
    prompt: str
    last_updated: datetime


class PromptUpdate(BaseModel):
    """Update chat prompt request"""
    prompt: str


class PromptGenerateRequest(BaseModel):
    """Generate prompt from raw text request"""
    input_text: str


class PromptGenerateResponse(BaseModel):
    """Generate prompt response"""
    prompt: str

