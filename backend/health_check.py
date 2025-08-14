#!/usr/bin/env python3
"""
Health Check Script
"""

import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def health_check():
    """Check API health and configuration"""
    
    print("🏥 API Health Check")
    print("=" * 50)
    
    # Check environment variables
    print("🔧 Environment Variables:")
    print(f"  OPENROUTER_API_KEY: {'✅ SET' if os.getenv('OPENROUTER_API_KEY') else '❌ MISSING'}")
    print(f"  GITHUB_CLIENT_ID: {'✅ SET' if os.getenv('GITHUB_CLIENT_ID') else '❌ MISSING'}")
    print(f"  GITHUB_CLIENT_SECRET: {'✅ SET' if os.getenv('GITHUB_CLIENT_SECRET') else '❌ MISSING'}")
    print()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test health endpoint
            print("📡 Testing health endpoint...")
            response = await client.get("http://localhost:8000/health")
            print(f"Health Status: {response.status_code} - {response.json()}")
            print()
            
            # Test AI status endpoint
            print("📡 Testing AI status endpoint...")
            response = await client.get("http://localhost:8000/admin/ai-status")
            print(f"AI Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"  Status: {result.get('status', 'unknown')}")
                print(f"  OpenRouter Key Set: {result.get('openrouter_key_set', False)}")
                print(f"  AI Response Length: {result.get('response_length', 0)}")
                if result.get('ai_response'):
                    print(f"  AI Response Preview: {result.get('ai_response', '')[:100]}...")
            else:
                print(f"  Error: {response.text}")
                
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(health_check())