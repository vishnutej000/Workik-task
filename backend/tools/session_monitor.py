#!/usr/bin/env python3
"""
Session Management Monitor
Monitors and validates session management functionality
"""

import asyncio
import httpx
import json

async def monitor_session_management():
    """Monitor session management after server restart"""
    
    print("🔐 Session Management Monitor")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test 1: Check sessions status endpoint
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/admin/sessions")
            
            if response.status_code == 200:
                data = response.json()
                print("📊 Current Sessions:")
                print(f"   Total sessions: {data['total_sessions']}")
                print(f"   Session tokens: {data['session_tokens']}")
                
                if data['total_sessions'] > 0:
                    print("   Session details:")
                    for token, details in data['sessions_detail'].items():
                        print(f"     {token}: {details['user']} (created: {details['created_at']})")
                else:
                    print("   ✅ No active sessions (expected after server restart)")
            else:
                print(f"❌ Sessions status failed: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Error checking sessions: {e}")
    
    print()
    
    # Test 2: Try to access protected endpoint without auth
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/auth/user")
            
            if response.status_code == 401:
                print("✅ Protected endpoint correctly returns 401 without auth")
            else:
                print(f"⚠️ Unexpected response: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Error testing protected endpoint: {e}")
    
    print()
    
    # Test 3: Try with invalid session token
    try:
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": "Bearer invalid_token_12345"}
            response = await client.get(f"{base_url}/auth/user", headers=headers)
            
            if response.status_code == 401:
                print("✅ Invalid session token correctly returns 401")
                error_data = response.json()
                print(f"   Error message: {error_data.get('detail', 'No detail')}")
            else:
                print(f"⚠️ Unexpected response for invalid token: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Error testing invalid token: {e}")
    
    print()
    print("🎯 Session Management Monitor Complete!")
    print()
    print("💡 Expected behavior after server restart:")
    print("   1. All sessions should be cleared (in-memory storage)")
    print("   2. Frontend should detect 401 errors and logout automatically")
    print("   3. Users should be redirected to login again")

if __name__ == "__main__":
    asyncio.run(monitor_session_management())