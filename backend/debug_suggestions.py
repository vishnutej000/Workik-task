#!/usr/bin/env python3
"""
Debug script to test the AI suggestion generation
Run with: python debug_suggestions.py
"""

import asyncio
import httpx
import json
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

async def test_ai_generation():
    """Test AI generation with sample data"""
    
    print("🧪 Testing AI Test Suggestion Generation...")
    print()
    
    # Check if OpenRouter API key is set
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ OPENROUTER_API_KEY not found in environment variables")
        return
    
    print(f"✅ OpenRouter API Key: {'*' * 20}{api_key[-4:]}")
    print()
    
    # Test with sample code
    sample_code = """
def calculate_total(items):
    total = 0
    for item in items:
        if item.get('price') and item.get('quantity'):
            total += item['price'] * item['quantity']
    return total

def validate_email(email):
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None
"""
    
    # Create AI prompt
    system_message = """You are a Senior QA Engineer specializing in test automation. Your task is to analyze code files and suggest meaningful test cases.

Rules:
1. Return ONLY a numbered list of 3-5 test case summaries
2. Focus on edge cases, error handling, and validation
3. Each summary should be 1-2 sentences describing what to test
4. Do not include actual test code, only descriptions
5. Consider the detected framework and language conventions

Format your response as:
1. Test case summary here
2. Another test case summary
3. Third test case summary
etc."""

    user_message = f"""Analyze these code files and suggest test cases for pytest framework:

File: test_functions.py
```
{sample_code}
```

Generate 3-5 meaningful test case suggestions focusing on:
- Edge cases and boundary conditions
- Error handling and validation
- Core functionality verification
- Integration points if applicable"""

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message}
    ]
    
    # Test OpenRouter API call
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Test Case Generator Debug"
    }
    
    payload = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": messages,
        "max_tokens": 2000,
        "temperature": 0.7
    }
    
    print("📡 Calling OpenRouter API...")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ API Error: {response.text}")
                return
            
            result = response.json()
            ai_response = result["choices"][0]["message"]["content"]
            
            print("✅ AI Response received!")
            print()
            print("📝 Raw AI Response:")
            print("-" * 50)
            print(ai_response)
            print("-" * 50)
            print()
            
            # Test parsing logic
            print("🔍 Testing parsing logic...")
            suggestions = []
            lines = ai_response.strip().split('\n')
            suggestion_id = 1
            
            print(f"Total lines to parse: {len(lines)}")
            
            for i, line in enumerate(lines):
                line = line.strip()
                print(f"Line {i+1}: '{line}' -> ", end="")
                
                if line and (line[0].isdigit() or line.startswith('-')):
                    # Remove numbering and clean up
                    clean_line = line
                    if line[0].isdigit():
                        clean_line = '. '.join(line.split('. ')[1:]) if '. ' in line else line[2:].strip()
                    elif line.startswith('-'):
                        clean_line = line[1:].strip()
                    
                    if clean_line:
                        suggestions.append({
                            "id": suggestion_id,
                            "summary": clean_line,
                            "framework": "pytest"
                        })
                        suggestion_id += 1
                        print(f"✅ Parsed as suggestion: '{clean_line}'")
                    else:
                        print("❌ Empty after cleaning")
                else:
                    print("❌ Doesn't match pattern")
            
            print()
            print(f"🎯 Final Results: {len(suggestions)} suggestions parsed")
            
            for i, suggestion in enumerate(suggestions, 1):
                print(f"   {i}. {suggestion['summary']}")
            
            if len(suggestions) == 0:
                print()
                print("🔧 Debugging Tips:")
                print("   1. Check if AI response follows the expected format")
                print("   2. Try a different AI model (e.g., 'openai/gpt-3.5-turbo')")
                print("   3. Adjust the prompt to be more specific about formatting")
                print("   4. Check OpenRouter API credits/limits")
                
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_ai_generation())