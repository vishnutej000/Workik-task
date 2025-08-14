#!/usr/bin/env python3
"""
Test Debug Endpoint
"""

import asyncio
import httpx
import json

async def test_debug_endpoint():
    """Test the debug endpoint"""
    
    print("🐛 Testing Debug Endpoint")
    print("=" * 50)
    
    # Test data
    test_data = {
        "repo_url": "https://github.com/test/test",
        "files": ["test.py"],
        "framework": "pytest"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("📡 Testing debug endpoint...")
            response = await client.post(
                "http://localhost:8000/repo/generate-suggestions-debug",
                json=test_data
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Debug endpoint working!")
                print(f"Suggestions: {len(result.get('suggestions', []))}")
                for suggestion in result.get('suggestions', []):
                    print(f"  - {suggestion.get('summary', 'No summary')}")
            else:
                print(f"❌ Debug endpoint failed: {response.text}")
                
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_debug_endpoint())