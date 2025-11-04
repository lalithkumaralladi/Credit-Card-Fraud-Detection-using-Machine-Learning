"""
Optimized main entry point for the Credit Card Fraud Detection application.
"""
import os
import multiprocessing
import uvicorn
from backend.main import app

# Calculate optimal number of workers (CPU cores * 1 + 1)
workers = min(multiprocessing.cpu_count() * 2 + 1, 8)  # Cap at 8 workers

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable auto-reload in production
        workers=workers,
        http="auto",  # Automatically use HTTP/2 if available
        timeout_keep_alive=30,  # Keep-alive timeout in seconds
        limit_concurrency=1000,  # Maximum number of concurrent connections
        limit_max_requests=10000,  # Restart workers after this many requests
        log_level="info",  # Set appropriate log level
        access_log=True,
        proxy_headers=True,  # Trust proxy headers
        forwarded_allow_ips='*'  # Allow all forwarded IPs (configure properly in production)
    )
