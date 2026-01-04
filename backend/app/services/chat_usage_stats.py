"""
Chat Usage Stats Calculator Service
Calculates statistics from usage logs
"""
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from app.config import settings
from app.utils.json_handler import JSONHandler
from app.models.chat import UsageStatsResponse, UsageLogsResponse, UsageLog, DailyBreakdown, PaginationInfo, PeriodSummary
from app.utils.logger import logger

# Import JSONHandler at module level
json_handler_instance = JSONHandler(settings.DATA_DIR)


class ChatUsageStats:
    """Service for calculating chat usage statistics"""
    
    def __init__(self, json_handler: JSONHandler):
        self.json_handler = json_handler
        self.usage_file = settings.CHAT_USAGE_LOG_FILE
    
    def get_stats(
        self,
        period: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> UsageStatsResponse:
        """
        Get aggregated statistics for a period
        
        Args:
            period: Period type (today|7d|15d|30d|month|custom)
            start_date: Start date (ISO format, required if period=custom)
            end_date: End date (ISO format, required if period=custom)
            
        Returns:
            UsageStatsResponse with aggregated statistics
        """
        try:
            # Load logs
            data = self.json_handler.read(self.usage_file)
            logs = data.get("logs", [])
            
            # Filter logs by date
            filtered_logs = self._filter_logs_by_period(logs, period, start_date, end_date)
            
            if not filtered_logs:
                # Return empty stats
                return UsageStatsResponse(
                    period=period,
                    total_requests=0,
                    total_input_tokens=0,
                    total_output_tokens=0,
                    total_tokens=0,
                    total_cost_usd=0.0,
                    average_cost_per_request=0.0,
                    average_tokens_per_request=0.0,
                    daily_breakdown=[]
                )
            
            # Calculate totals
            total_requests = len(filtered_logs)
            total_input_tokens = sum(log.get("input_tokens", 0) for log in filtered_logs)
            total_output_tokens = sum(log.get("output_tokens", 0) for log in filtered_logs)
            total_tokens = sum(log.get("total_tokens", 0) for log in filtered_logs)
            total_cost_usd = sum(log.get("cost_usd", 0.0) for log in filtered_logs)
            
            # Calculate averages
            average_cost_per_request = total_cost_usd / total_requests if total_requests > 0 else 0.0
            average_tokens_per_request = total_tokens / total_requests if total_requests > 0 else 0.0
            
            # Calculate daily breakdown
            daily_breakdown = self._aggregate_daily(filtered_logs)
            
            return UsageStatsResponse(
                period=period,
                total_requests=total_requests,
                total_input_tokens=total_input_tokens,
                total_output_tokens=total_output_tokens,
                total_tokens=total_tokens,
                total_cost_usd=round(total_cost_usd, 8),
                average_cost_per_request=round(average_cost_per_request, 8),
                average_tokens_per_request=round(average_tokens_per_request, 2),
                daily_breakdown=daily_breakdown
            )
            
        except Exception as e:
            logger.error(f"Error calculating stats: {str(e)}", exc_info=True)
            raise
    
    def get_logs(
        self,
        page: int = 1,
        limit: int = 50,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> UsageLogsResponse:
        """
        Get paginated usage logs
        
        Args:
            page: Page number (1-indexed)
            limit: Items per page (max 500)
            start_date: Start date filter (ISO format, optional)
            end_date: End date filter (ISO format, optional)
            
        Returns:
            UsageLogsResponse with paginated logs
        """
        try:
            # Validate pagination
            limit = min(limit, 500)  # Max 500
            limit = max(limit, 1)  # Min 1
            page = max(page, 1)  # Min 1
            
            # Load logs
            data = self.json_handler.read(self.usage_file)
            logs = data.get("logs", [])
            
            # Filter by date if provided
            if start_date or end_date:
                logs = self._filter_logs_by_date(logs, start_date, end_date)
            
            # Sort by timestamp descending (newest first)
            logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            # Calculate pagination
            total = len(logs)
            total_pages = (total + limit - 1) // limit  # Ceiling division
            
            # Paginate
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_logs = logs[start_idx:end_idx]
            
            # Convert to UsageLog objects
            usage_logs = [
                UsageLog(
                    id=log.get("id", ""),
                    timestamp=datetime.fromisoformat(log.get("timestamp", "").replace("Z", "+00:00")),
                    input_tokens=log.get("input_tokens", 0),
                    output_tokens=log.get("output_tokens", 0),
                    total_tokens=log.get("total_tokens", 0),
                    model=log.get("model", ""),
                    cost_usd=log.get("cost_usd", 0.0),
                    request_id=log.get("request_id")
                )
                for log in paginated_logs
            ]
            
            return UsageLogsResponse(
                logs=usage_logs,
                pagination=PaginationInfo(
                    page=page,
                    limit=limit,
                    total=total,
                    total_pages=total_pages
                )
            )
            
        except Exception as e:
            logger.error(f"Error getting logs: {str(e)}", exc_info=True)
            raise
    
    def get_summary(self) -> Dict[str, PeriodSummary]:
        """
        Get quick summary statistics (today, week, month) for dashboard
        
        Returns:
            Dictionary with today, week, month summaries
        """
        try:
            today_stats = self.get_stats("today")
            week_stats = self.get_stats("7d")
            month_stats = self.get_stats("30d")
            
            return {
                "today": PeriodSummary(
                    requests=today_stats.total_requests,
                    tokens=today_stats.total_tokens,
                    cost_usd=today_stats.total_cost_usd
                ),
                "week": PeriodSummary(
                    requests=week_stats.total_requests,
                    tokens=week_stats.total_tokens,
                    cost_usd=week_stats.total_cost_usd
                ),
                "month": PeriodSummary(
                    requests=month_stats.total_requests,
                    tokens=month_stats.total_tokens,
                    cost_usd=month_stats.total_cost_usd
                )
            }
        except Exception as e:
            logger.error(f"Error getting summary: {str(e)}", exc_info=True)
            # Return empty summaries on error
            empty_summary = PeriodSummary(requests=0, tokens=0, cost_usd=0.0)
            return {
                "today": empty_summary,
                "week": empty_summary,
                "month": empty_summary
            }
    
    def _filter_logs_by_period(
        self,
        logs: List[Dict],
        period: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict]:
        """Filter logs by period"""
        now = datetime.utcnow()
        
        if period == "custom":
            if not start_date or not end_date:
                raise ValueError("start_date and end_date required for custom period")
            return self._filter_logs_by_date(logs, start_date, end_date)
        
        elif period == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
        
        elif period == "7d":
            start = now - timedelta(days=7)
            end = now
        
        elif period == "15d":
            start = now - timedelta(days=15)
            end = now
        
        elif period == "30d":
            start = now - timedelta(days=30)
            end = now
        
        elif period == "month":
            # Previous calendar month
            first_day_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            start = (first_day_this_month - timedelta(days=1)).replace(day=1)
            end = first_day_this_month
        
        else:
            raise ValueError(f"Invalid period: {period}")
        
        return self._filter_logs_by_date(
            logs,
            start.isoformat() + "Z",
            end.isoformat() + "Z"
        )
    
    def _filter_logs_by_date(
        self,
        logs: List[Dict],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict]:
        """Filter logs by date range"""
        filtered = logs
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                filtered = [log for log in filtered if datetime.fromisoformat(log.get("timestamp", "").replace("Z", "+00:00")) >= start_dt]
            except Exception as e:
                logger.warning(f"Invalid start_date: {start_date}, {str(e)}")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                filtered = [log for log in filtered if datetime.fromisoformat(log.get("timestamp", "").replace("Z", "+00:00")) <= end_dt]
            except Exception as e:
                logger.warning(f"Invalid end_date: {end_date}, {str(e)}")
        
        return filtered
    
    def _aggregate_daily(self, logs: List[Dict]) -> List[DailyBreakdown]:
        """Aggregate logs by date"""
        daily_data: Dict[str, Dict] = {}
        
        for log in logs:
            try:
                timestamp = log.get("timestamp", "")
                date_str = timestamp.split("T")[0]  # Extract date part (YYYY-MM-DD)
                
                if date_str not in daily_data:
                    daily_data[date_str] = {
                        "requests": 0,
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "total_tokens": 0,
                        "cost_usd": 0.0
                    }
                
                daily_data[date_str]["requests"] += 1
                daily_data[date_str]["input_tokens"] += log.get("input_tokens", 0)
                daily_data[date_str]["output_tokens"] += log.get("output_tokens", 0)
                daily_data[date_str]["total_tokens"] += log.get("total_tokens", 0)
                daily_data[date_str]["cost_usd"] += log.get("cost_usd", 0.0)
            except Exception as e:
                logger.warning(f"Error processing log entry: {str(e)}")
                continue
        
        # Convert to DailyBreakdown objects and sort by date
        breakdown = [
            DailyBreakdown(
                date=date_str,
                requests=data["requests"],
                input_tokens=data["input_tokens"],
                output_tokens=data["output_tokens"],
                total_tokens=data["total_tokens"],
                cost_usd=round(data["cost_usd"], 8)
            )
            for date_str, data in sorted(daily_data.items())
        ]
        
        return breakdown


# Global instance
chat_usage_stats = ChatUsageStats(json_handler_instance)

