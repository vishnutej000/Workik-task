#!/usr/bin/env python3
"""
Test script to verify backend endpoints are working
Run with: python test_endpoints.py
"""

import asyncio
import httpx
import json
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

async def test_endpoints():
    """Test all backend endpoints"""
    
    print("🔍 Testing Backend Endpoints...")
    print(f"Backend URL: http://localhost:8000")
    print()
    
    base_url = "http://localhost:8000"
    
    # Test basic endpoints
    endpoints_to_test = [
        ("GET", "/", "Root endpoint"),
        ("GET", "/health", "Health check"),
        ("GET", "/frameworks", "Available frameworks"),
        ("GET", "/auth/github", "GitHub OAuth URL"),
    ]
    
    async with httpx.AsyncClient() as client:
        for method, endpoint, description in endpoints_to_test:
            try:
                print(f"📡 Testing {method} {endpoint} - {description}")
                
                if method == "GET":
                    response = await client.get(f"{base_url}{endpoint}")
                else:
                    response = await client.post(f"{base_url}{endpoint}")
                
                if response.status_code == 200:
                    print(f"   ✅ Success: {response.status_code}")
                    if endpoint == "/frameworks":
                        data = response.json()
                        print(f"   📋 Available frameworks: {list(data.get('frameworks', {}).keys())}")
                    elif endpoint == "/auth/github":
                        data = response.json()
                        print(f"   🔗 Auth URL generated: {data.get('auth_url', 'N/A')[:50]}...")
                else:
                    print(f"   ⚠️  Status: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Error: {str(e)}")
            
            print()
    
    # Test repository analysis endpoint
    print("📡 Testing POST /repo/analyze - Repository analysis")
    try:
        async with httpx.AsyncClient() as client:
            test_data = {
                "repo_url": "https://github.com/octocat/Hello-World"
            }
            
            response = await client.post(
                f"{base_url}/repo/analyze",
                json=test_data,
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success: {response.status_code}")
                print(f"   📁 Repository: {data.get('repository', {}).get('full_name', 'N/A')}")
                print(f"   📄 Files found: {data.get('total_files', 0)}")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
                print(f"   📄 Response: {response.text[:200]}...")
                
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    
    # Test suggestion generation
    print("📡 Testing POST /repo/generate-suggestions - Test suggestions")
    try:
        async with httpx.AsyncClient() as client:
            test_data = {
                "repo_url": "https://github.com/octocat/Hello-World",
                "files": ["README"],
                "framework": "pytest"
            }
            
            response = await client.post(
                f"{base_url}/repo/generate-suggestions",
                json=test_data,
                timeout=60.0
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success: {response.status_code}")
                print(f"   🧪 Suggestions: {len(data.get('suggestions', []))}")
                print(f"   🔧 Framework: {data.get('framework', 'N/A')}")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
                print(f"   📄 Response: {response.text[:200]}...")
                
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    print("🎯 Endpoint testing complete!")
    print()
    print("💡 If you see errors:")
    print("   1. Make sure the backend is running: python backend/run.py")
    print("   2. Check environment variables in backend/.env")
    print("   3. Verify OpenRouter API key is valid")
    print("   4. Check backend logs for detailed error messages")

if __name__ == "__main__":
    asyncio.run(test_endpoints())