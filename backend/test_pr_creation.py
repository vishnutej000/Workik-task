#!/usr/bin/env python3
"""
Test PR Creation Endpoint
"""

import asyncio
import httpx
import json

async def test_pr_creation():
    """Test the PR creation endpoint"""
    
    print("🧪 Testing PR Creation Endpoint")
    print("=" * 50)
    
    # This test requires a valid session token
    # You would need to login first to get a session token
    
    test_data = {
        "repo_full_name": "your-username/your-test-repo",
        "test_code": """def test_example():
    assert 1 + 1 == 2
    
def test_string_operations():
    assert "hello".upper() == "HELLO"
""",
        "test_file_name": "test_example.py",
        "branch_name": f"testgen/test-example-py-{int(asyncio.get_event_loop().time())}",
        "commit_message": "Add test_example.py\n\nGenerated test for: Test basic functionality"
    }
    
    print("⚠️ NOTE: This test requires authentication")
    print("To test PR creation:")
    print("1. Login to your app with GitHub OAuth")
    print("2. Check browser developer tools for session token")
    print("3. Update this script with your session token")
    print("4. Update repo_full_name to a repository you own")
    print()
    
    # Uncomment and update these lines to test with real credentials:
    # session_token = "your_session_token_here"
    # test_data["repo_full_name"] = "your-username/your-repo"
    
    session_token = None  # Replace with actual session token
    
    if not session_token:
        print("❌ No session token provided - cannot test PR creation")
        print("This is expected - PR creation requires authentication")
        return
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            print("📡 Testing PR creation endpoint...")
            response = await client.post(
                "http://localhost:8000/create-pull-request",
                json=test_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {session_token}"
                }
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ PR creation successful!")
                print(f"PR URL: {result.get('pr_url', 'N/A')}")
                print(f"PR Number: {result.get('pr_number', 'N/A')}")
                print(f"Branch: {result.get('branch_name', 'N/A')}")
            else:
                print(f"❌ PR creation failed: {response.status_code}")
                print(f"Error: {response.text}")
                
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_pr_creation())