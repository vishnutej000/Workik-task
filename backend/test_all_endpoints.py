#!/usr/bin/env python3
"""
Comprehensive Test Script - Tests ALL suggestion endpoints
"""

import asyncio
import httpx
import json

async def test_all_endpoints():
    """Test all suggestion generation endpoints"""
    
    print("🧪 COMPREHENSIVE ENDPOINT TESTING")
    print("=" * 60)
    
    # Test data
    test_data = {
        "repo_url": "https://github.com/test/test-repo",
        "files": ["main.py", "utils.js", "App.jsx"],
        "framework": "pytest"
    }
    
    endpoints = [
        {
            "name": "Main Endpoint",
            "url": "http://localhost:8000/repo/generate-suggestions",
            "description": "Primary suggestion generation with AI + fallback"
        },
        {
            "name": "Debug Endpoint", 
            "url": "http://localhost:8000/repo/generate-suggestions-debug",
            "description": "Debug endpoint - always returns suggestions"
        },
        {
            "name": "Force Endpoint",
            "url": "http://localhost:8000/repo/force-suggestions", 
            "description": "Force endpoint - immediate suggestions, no AI"
        }
    ]
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        for endpoint in endpoints:
            print(f"\n🔍 Testing: {endpoint['name']}")
            print(f"📝 Description: {endpoint['description']}")
            print(f"🌐 URL: {endpoint['url']}")
            
            try:
                response = await client.post(
                    endpoint['url'],
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
                
                print(f"📊 Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    suggestions = result.get('suggestions', [])
                    
                    print(f"✅ SUCCESS: {len(suggestions)} suggestions generated")
                    print(f"📁 Repository: {result.get('repository', 'N/A')}")
                    print(f"🔧 Framework: {result.get('framework', 'N/A')}")
                    
                    if suggestions:
                        print("📋 Generated Suggestions:")
                        for i, suggestion in enumerate(suggestions[:3], 1):  # Show first 3
                            print(f"   {i}. {suggestion.get('summary', 'No summary')}")
                        if len(suggestions) > 3:
                            print(f"   ... and {len(suggestions) - 3} more")
                    else:
                        print("❌ NO SUGGESTIONS GENERATED!")
                        
                else:
                    print(f"❌ FAILED: {response.status_code}")
                    print(f"Error: {response.text}")
                    
            except Exception as e:
                print(f"❌ EXCEPTION: {str(e)}")
            
            print("-" * 40)
    
    print("\n🎯 TESTING COMPLETE")
    print("\nIf ANY endpoint shows 'SUCCESS' with suggestions, your system works!")
    print("If ALL endpoints fail, check:")
    print("  1. Backend server is running (python -m uvicorn main:app --reload --port 8000)")
    print("  2. Environment variables are set (.env file)")
    print("  3. Network connectivity")

if __name__ == "__main__":
    asyncio.run(test_all_endpoints())