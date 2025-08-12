#!/usr/bin/env python3
"""
Production server runner for Test Case Generator API
"""
import uvicorn
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()
    
    # Get port from environment (for platforms like Render, Railway)
    port = int(os.getenv("PORT", 8000))
    
    # Check required environment variables
    required_vars = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "OPENROUTER_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        exit(1)
    
    print(f"🚀 Starting Test Case Generator API on port {port}...")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )