#!/usr/bin/env python3
"""
Test API Debug Script
"""

import asyncio
import httpx
import json

async def test_api():
    """Test the API endpoint directly"""
    
    print("🧪 Testing API Endpoint")
    print("=" * 50)
    
    # Test data
    test_data = {
        "repo_url": "https://github.com/vishnutej000/Workik-task",
        "files": ["backend/main.py"],
        "framework": "pytest"
    }
    
    print(f"📝 Test data: {json.dumps(test_data, indent=2)}")
    print()
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            print("📡 Making API request...")
            response = await client.post(
                "http://localhost:8000/repo/generate-suggestions",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print()
            
            if response.status_code == 200:
                result = response.json()
                print("✅ API Response received!")
                print(f"Repository: {result.get('repository', 'N/A')}")
                print(f"Framework: {result.get('framework', 'N/A')}")
                print(f"Suggestions count: {len(result.get('suggestions', []))}")
                print()
                
                suggestions = result.get('suggestions', [])
                if suggestions:
                    print("📋 Generated Suggestions:")
                    for i, suggestion in enumerate(suggestions, 1):
                        print(f"  {i}. {suggestion.get('summary', 'No summary')}")
                else:
                    print("❌ No suggestions generated!")
                    
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Error response: {response.text}")
                
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_api())