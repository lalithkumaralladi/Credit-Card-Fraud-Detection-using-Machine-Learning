"""
Optimized main entry point for the Credit Card Fraud Detection application.
"""
import os
import multiprocessing
import uvicorn
from backend.main import app
from config import settings

# Calculate optimal number of workers
if settings.WORKERS == 0:
    workers = min(multiprocessing.cpu_count() * 2 + 1, 8)  # Auto-calculate
else:
    workers = settings.WORKERS

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development(),  # Auto-reload only in development
        workers=workers if not settings.is_development() else 1,  # Single worker in dev for reload
        http="auto",  # Automatically use HTTP/2 if available
        timeout_keep_alive=settings.TIMEOUT_KEEP_ALIVE,
        limit_concurrency=settings.LIMIT_CONCURRENCY,
        limit_max_requests=settings.LIMIT_MAX_REQUESTS,
        log_level=settings.LOG_LEVEL,
        access_log=settings.ACCESS_LOG,
        proxy_headers=True,  # Trust proxy headers
        forwarded_allow_ips='*'  # Allow all forwarded IPs
    )
