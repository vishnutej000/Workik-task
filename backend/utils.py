"""
Utility functions for the Test Case Generator API
"""
import base64
import re
from typing import List, Dict, Optional
import httpx
from fastapi import HTTPException

def decode_github_content(content: str, encoding: str = "base64") -> str:
    """Decode GitHub file content"""
    if encoding == "base64":
        try:
            return base64.b64decode(content).decode("utf-8")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to decode file content: {str(e)}")
    return content

def estimate_token_count(text: str) -> int:
    """Rough estimation of token count (1 token ≈ 4 characters)"""
    return len(text) // 4

def truncate_content_if_needed(content: str, max_tokens: int = 20000) -> str:
    """Truncate content if it exceeds token limit"""
    estimated_tokens = estimate_token_count(content)
    if estimated_tokens > max_tokens:
        # Keep roughly the first 80% and last 20% of content
        chars_limit = max_tokens * 4
        first_part_limit = int(chars_limit * 0.8)
        last_part_limit = int(chars_limit * 0.2)
        
        first_part = content[:first_part_limit]
        last_part = content[-last_part_limit:] if last_part_limit > 0 else ""
        
        return f"{first_part}\n\n... [CONTENT TRUNCATED] ...\n\n{last_part}"
    
    return content

def clean_ai_response(response: str) -> str:
    """Clean and format AI response"""
    # Remove common AI response prefixes/suffixes
    prefixes_to_remove = [
        "Here are the test case suggestions:",
        "Here are some test cases:",
        "Test case suggestions:",
        "I'll suggest the following test cases:",
    ]
    
    suffixes_to_remove = [
        "These test cases should provide good coverage",
        "Let me know if you need more test cases",
        "Hope this helps!",
    ]
    
    cleaned = response.strip()
    
    for prefix in prefixes_to_remove:
        if cleaned.lower().startswith(prefix.lower()):
            cleaned = cleaned[len(prefix):].strip()
    
    for suffix in suffixes_to_remove:
        if cleaned.lower().endswith(suffix.lower()):
            cleaned = cleaned[:-len(suffix)].strip()
    
    return cleaned

def parse_test_suggestions(ai_response: str) -> List[str]:
    """Parse AI response into individual test suggestions"""
    cleaned_response = clean_ai_response(ai_response)
    lines = cleaned_response.split('\n')
    
    suggestions = []
    current_suggestion = ""
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if line starts with a number or bullet point
        if re.match(r'^\d+\.?\s+', line) or line.startswith('-') or line.startswith('•'):
            # Save previous suggestion if exists
            if current_suggestion:
                suggestions.append(current_suggestion.strip())
            
            # Start new suggestion, removing numbering/bullets
            current_suggestion = re.sub(r'^\d+\.?\s+|^[-•]\s+', '', line)
        else:
            # Continue current suggestion
            if current_suggestion:
                current_suggestion += " " + line
            else:
                current_suggestion = line
    
    # Add the last suggestion
    if current_suggestion:
        suggestions.append(current_suggestion.strip())
    
    # Filter out empty or very short suggestions
    return [s for s in suggestions if len(s) > 10]

def generate_test_filename(original_file: str, framework: str) -> str:
    """Generate appropriate test filename based on framework"""
    base_name = original_file.split('/')[-1].split('.')[0]
    
    framework_patterns = {
        'pytest': f'test_{base_name}.py',
        'jest': f'{base_name}.test.js',
        'junit': f'{base_name}Test.java',
        'testing': f'{base_name}_test.go',
        'rspec': f'{base_name}_spec.rb',
        'phpunit': f'{base_name}Test.php',
        'nunit': f'{base_name}Tests.cs',
        'xctest': f'{base_name}Tests.swift'
    }
    
    return framework_patterns.get(framework, f'test_{base_name}.py')

def validate_branch_name(branch_name: str) -> str:
    """Validate and clean branch name for GitHub"""
    # Replace invalid characters with hyphens
    cleaned = re.sub(r'[^a-zA-Z0-9\-_/]', '-', branch_name)
    
    # Remove consecutive hyphens
    cleaned = re.sub(r'-+', '-', cleaned)
    
    # Remove leading/trailing hyphens
    cleaned = cleaned.strip('-')
    
    # Ensure it's not empty
    if not cleaned:
        cleaned = "test-branch"
    
    # Ensure it doesn't start with a slash
    cleaned = cleaned.lstrip('/')
    
    return cleaned

def format_commit_message(test_file_name: str, suggestion_summary: str) -> str:
    """Format commit message for test file"""
    # Truncate summary if too long
    max_summary_length = 50
    if len(suggestion_summary) > max_summary_length:
        suggestion_summary = suggestion_summary[:max_summary_length] + "..."
    
    return f"Add {test_file_name}\n\nGenerated test for: {suggestion_summary}"

def extract_code_from_ai_response(response: str) -> str:
    """Extract code from AI response, removing markdown formatting"""
    # Remove markdown code blocks
    code_block_pattern = r'```[\w]*\n?(.*?)\n?```'
    matches = re.findall(code_block_pattern, response, re.DOTALL)
    
    if matches:
        # Return the first code block found
        return matches[0].strip()
    
    # If no code blocks found, return the response as-is
    return response.strip()

async def make_github_request(
    endpoint: str, 
    token: str, 
    method: str = "GET", 
    data: dict = None,
    timeout: int = 30
) -> dict:
    """Make authenticated request to GitHub API with error handling"""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "TestCaseGenerator/1.0"
    }
    
    url = f"https://api.github.com{endpoint}"
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            if method == "GET":
                response = await client.get(url, headers=headers)
            elif method == "POST":
                response = await client.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = await client.put(url, headers=headers, json=data)
            elif method == "PATCH":
                response = await client.patch(url, headers=headers, json=data)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported HTTP method: {method}")
            
            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="GitHub token expired or invalid")
            elif response.status_code == 403:
                raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded or insufficient permissions")
            elif response.status_code == 404:
                raise HTTPException(status_code=404, detail="GitHub resource not found")
            elif response.status_code >= 400:
                error_detail = f"GitHub API error ({response.status_code})"
                try:
                    error_data = response.json()
                    if "message" in error_data:
                        error_detail += f": {error_data['message']}"
                except:
                    error_detail += f": {response.text}"
                raise HTTPException(status_code=response.status_code, detail=error_detail)
            
            return response.json()
            
        except httpx.TimeoutException:
            raise HTTPException(status_code=408, detail="GitHub API request timed out")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"GitHub API request failed: {str(e)}")

def sanitize_file_path(file_path: str) -> str:
    """Sanitize file path to prevent directory traversal attacks"""
    # Remove any path traversal attempts
    sanitized = file_path.replace('..', '').replace('//', '/')
    
    # Remove leading slashes
    sanitized = sanitized.lstrip('/')
    
    # Ensure it's not empty
    if not sanitized:
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    return sanitized