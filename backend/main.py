from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import os
from dotenv import load_dotenv
import httpx
import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import secrets
from itsdangerous import URLSafeTimedSerializer

# Import our custom modules
from config import (
    AI_MODELS, DEFAULT_AI_MODEL, SUPPORTED_EXTENSIONS, FRAMEWORK_CONFIGS,
    get_ai_model_config, get_language_config, get_framework_config, 
    get_available_frameworks, is_supported_file, should_exclude_file
)
from utils import (
    decode_github_content, parse_test_suggestions, generate_test_filename,
    validate_branch_name, format_commit_message, extract_code_from_ai_response,
    make_github_request, sanitize_file_path, truncate_content_if_needed
)
from github_direct import (
    parse_github_url, fetch_github_repo_info, fetch_github_repo_files, 
    fetch_file_content, detect_language_from_extension, 
    detect_framework_from_language, get_github_token
)

# Load environment variables
load_dotenv()

app = FastAPI(title="Test Case Generator API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Session serializer
serializer = URLSafeTimedSerializer(SECRET_KEY)

# In-memory session storage (for MVP)
sessions: Dict[str, Dict[str, Any]] = {}

# Session cleanup - remove expired sessions
def cleanup_sessions():
    """Clean up expired or invalid sessions"""
    import time
    current_time = time.time()
    expired_sessions = []
    
    for session_token, session_data in sessions.items():
        # Remove sessions older than 24 hours
        if current_time - session_data.get("created_at", 0) > 86400:
            expired_sessions.append(session_token)
    
    for session_token in expired_sessions:
        del sessions[session_token]
        print(f"🧹 Cleaned up expired session: {session_token[:10]}...")
    
    return len(expired_sessions)

# Pydantic models
class Repository(BaseModel):
    id: int
    name: str
    full_name: str
    description: Optional[str]
    language: Optional[str]
    private: bool
    html_url: str

class FileItem(BaseModel):
    path: str
    name: str
    type: str
    size: Optional[int]
    download_url: Optional[str]

class TestSuggestion(BaseModel):
    id: int
    summary: str
    framework: str

class GenerateTestRequest(BaseModel):
    files: List[str]
    repo_full_name: str
    framework: Optional[str] = None  # Allow user to specify framework

class GenerateCodeRequest(BaseModel):
    suggestion_id: int
    suggestion_summary: str
    files: List[str]
    repo_full_name: str
    framework: Optional[str] = None  # Allow user to specify framework

class CreatePRRequest(BaseModel):
    repo_full_name: str
    test_code: str
    test_file_name: str
    branch_name: str
    commit_message: str

class AuthCallbackRequest(BaseModel):
    code: str
    state: str

class DirectRepoRequest(BaseModel):
    repo_url: str

class DirectTestRequest(BaseModel):
    repo_url: str
    files: List[str]
    framework: Optional[str] = None

class DirectCodeRequest(BaseModel):
    repo_url: str
    suggestion_id: int
    suggestion_summary: str
    files: List[str]
    framework: Optional[str] = None

# Models are defined above

@app.get("/")
async def root():
    return {"message": "Test Case Generator API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/repo/generate-suggestions-debug")
async def generate_suggestions_debug(request_data: DirectTestRequest):
    """Debug endpoint that always returns test suggestions"""
    print(f"🐛 Debug endpoint called with: {request_data}")
    
    # Always return fallback suggestions for debugging
    first_file = request_data.files[0] if request_data.files else "code"
    framework = request_data.framework or "pytest"
    
    suggestions = [
        {
            "id": 1,
            "summary": f"Test basic functionality and return values in {first_file}",
            "framework": framework
        },
        {
            "id": 2,
            "summary": f"Test error handling and exception scenarios in {first_file}",
            "framework": framework
        },
        {
            "id": 3,
            "summary": f"Test input validation and edge cases in {first_file}",
            "framework": framework
        },
        {
            "id": 4,
            "summary": f"Test integration points and dependencies in {first_file}",
            "framework": framework
        }
    ]
    
    return {
        "repository": "debug/test",
        "framework": framework,
        "suggestions": suggestions,
        "files_analyzed": request_data.files,
        "debug": True
    }

@app.get("/admin/ai-status")
async def get_ai_status():
    """Get AI service status and test generation"""
    try:
        messages = [
            {"role": "system", "content": "You are a test engineer. Generate exactly 3 test case suggestions."},
            {"role": "user", "content": "Generate 3 test cases for a simple calculator function. Format as: 1. Description 2. Description 3. Description"}
        ]
        
        ai_response = await call_openrouter_api(messages)
        
        return {
            "status": "success",
            "ai_response": ai_response,
            "response_length": len(ai_response),
            "openrouter_key_set": bool(OPENROUTER_API_KEY)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "openrouter_key_set": bool(OPENROUTER_API_KEY)
        }

@app.get("/admin/sessions")
async def get_session_status():
    """Get current session status and statistics"""
    return {
        "total_sessions": len(sessions),
        "session_tokens": [token[:10] + "..." for token in sessions.keys()],
        "sessions_detail": {
            token[:10] + "...": {
                "user": session_data["user"]["login"],
                "created_at": session_data.get("created_at", "unknown"),
                "last_accessed": session_data.get("last_accessed", "unknown")
            }
            for token, session_data in sessions.items()
        }
    }

# Helper functions
def get_session_token(request: Request) -> Optional[str]:
    """Extract session token from request headers"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None

def get_github_token_from_session(session_token: str) -> Optional[str]:
    """Get GitHub token from session"""
    if session_token in sessions:
        return sessions[session_token].get("github_token")
    return None

async def github_api_request(endpoint: str, token: str, method: str = "GET", data: dict = None):
    """Make authenticated request to GitHub API"""
    return await make_github_request(endpoint, token, method, data)

def detect_test_framework(file_path: str, language: str = None) -> str:
    """Detect appropriate test framework based on file extension and language"""
    config = get_language_config(file_path)
    return config['framework']

def is_code_file(file_path: str) -> bool:
    """Check if file is a code file we want to analyze"""
    return is_supported_file(file_path) and not should_exclude_file(file_path)

# Authentication endpoints
@app.get("/auth/github")
async def github_login():
    """Redirect to GitHub OAuth"""
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={FRONTEND_URL}/auth/callback"
        f"&scope=repo,user:email"
        f"&state={secrets.token_urlsafe(32)}"
    )
    return {"auth_url": github_auth_url}

@app.post("/auth/callback")
async def github_callback(request_data: AuthCallbackRequest):
    """Handle GitHub OAuth callback"""
    try:
        print(f"🔄 Processing callback...")
        print(f"📝 Request data: code={request_data.code[:10] if request_data.code else 'None'}..., state={request_data.state[:10] if request_data.state else 'None'}...")
        
        # Validate required environment variables
        if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
            print("❌ Missing GitHub credentials")
            raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
        
        code = request_data.code
        state = request_data.state
        
        if not code:
            print("❌ No authorization code provided")
            raise HTTPException(status_code=400, detail="Authorization code is required")
        
        # Exchange code for access token
        token_data = {
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code
        }
        
        print("📡 Exchanging code for token...")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data=token_data,
                headers={"Accept": "application/json"}
            )
            
            print(f"GitHub token response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ GitHub token exchange failed: {response.text}")
                raise HTTPException(status_code=400, detail=f"Failed to exchange code for token: {response.text}")
            
            token_response = response.json()
            print(f"Token response keys: {list(token_response.keys())}")
            
            github_token = token_response.get("access_token")
            
            if not github_token:
                error_description = token_response.get("error_description", "No access token received")
                print(f"❌ No access token: {error_description}")
                raise HTTPException(status_code=400, detail=f"GitHub OAuth error: {error_description}")
        
        print("👤 Getting user info...")
        # Get user info
        user_info = await github_api_request("/user", github_token)
        print(f"✅ User authenticated: {user_info.get('login')}")
        
        # Create session
        import time
        session_token = secrets.token_urlsafe(32)
        sessions[session_token] = {
            "github_token": github_token,
            "user": user_info,
            "created_at": time.time(),
            "last_accessed": time.time()
        }
        
        print(f"✅ Created new session for user: {user_info['login']}")
        print(f"📊 Total active sessions: {len(sessions)}")
        
        # Cleanup old sessions
        cleanup_sessions()
        
        return {
            "session_token": session_token,
            "user": {
                "login": user_info["login"],
                "name": user_info.get("name"),
                "avatar_url": user_info["avatar_url"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in callback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.get("/auth/user")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    session_token = get_session_token(request)
    
    if not session_token:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    if session_token not in sessions:
        print(f"❌ Session token not found in sessions: {session_token[:10]}...")
        print(f"📊 Current sessions count: {len(sessions)}")
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    user_info = sessions[session_token]["user"]
    print(f"✅ Session validated for user: {user_info['login']}")
    
    return {
        "login": user_info["login"],
        "name": user_info.get("name"),
        "avatar_url": user_info["avatar_url"]
    }

@app.post("/auth/logout")
async def logout(request: Request):
    """Logout user"""
    session_token = get_session_token(request)
    if session_token and session_token in sessions:
        user_login = sessions[session_token]["user"]["login"]
        del sessions[session_token]
        print(f"🚪 User logged out: {user_login}")
        print(f"📊 Remaining sessions: {len(sessions)}")
    return {"message": "Logged out successfully"}

# Repository endpoints
@app.get("/repositories")
async def get_repositories(request: Request) -> List[Repository]:
    """Get user's repositories"""
    session_token = get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    github_token = get_github_token_from_session(session_token)
    if not github_token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    
    repos_data = await github_api_request("/user/repos?sort=updated&per_page=100", github_token)
    
    repositories = []
    for repo in repos_data:
        repositories.append(Repository(
            id=repo["id"],
            name=repo["name"],
            full_name=repo["full_name"],
            description=repo.get("description"),
            language=repo.get("language"),
            private=repo["private"],
            html_url=repo["html_url"]
        ))
    
    return repositories

@app.get("/repositories/{owner}/{repo}/files")
async def get_repository_files(owner: str, repo: str, request: Request) -> List[FileItem]:
    """Get code files from repository"""
    session_token = get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    github_token = get_github_token_from_session(session_token)
    if not github_token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    
    # Get repository tree
    tree_data = await github_api_request(f"/repos/{owner}/{repo}/git/trees/HEAD?recursive=1", github_token)
    
    files = []
    for item in tree_data.get("tree", []):
        if item["type"] == "blob" and is_code_file(item["path"]):
            files.append(FileItem(
                path=item["path"],
                name=item["path"].split("/")[-1],
                type="file",
                size=item.get("size"),
                download_url=f"https://api.github.com/repos/{owner}/{repo}/contents/{item['path']}"
            ))
    
    return files

@app.get("/repositories/{owner}/{repo}/file-content")
async def get_file_content(owner: str, repo: str, file_path: str, request: Request):
    """Get content of a specific file"""
    session_token = get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    github_token = get_github_token_from_session(session_token)
    if not github_token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    
    file_data = await github_api_request(f"/repos/{owner}/{repo}/contents/{file_path}", github_token)
    
    if file_data.get("encoding") == "base64":
        import base64
        content = base64.b64decode(file_data["content"]).decode("utf-8")
        return {"content": content, "path": file_path}
    
    raise HTTPException(status_code=400, detail="Unable to decode file content")

@app.get("/frameworks")
async def get_frameworks():
    """Get all available testing frameworks"""
    return {
        "frameworks": FRAMEWORK_CONFIGS,
        "supported_extensions": SUPPORTED_EXTENSIONS
    }

@app.get("/frameworks/{file_path:path}")
async def get_frameworks_for_file(file_path: str):
    """Get available frameworks for a specific file"""
    available = get_available_frameworks(file_path)
    language_config = get_language_config(file_path)
    
    return {
        "file_path": file_path,
        "language": language_config['language'],
        "default_framework": language_config['framework'],
        "available_frameworks": available,
        "framework_details": {
            framework: get_framework_config(framework) 
            for framework in available
        }
    }

# Direct Repository Processing (No OAuth Required)
@app.post("/repo/analyze")
async def analyze_repository_direct(request_data: DirectRepoRequest):
    """Analyze a GitHub repository directly using repo URL"""
    try:
        owner, repo = parse_github_url(request_data.repo_url)
        token = get_github_token()
        
        # Get repository info
        repo_info = await fetch_github_repo_info(owner, repo, token)
        
        # Get code files
        files = await fetch_github_repo_files(owner, repo, token)
        
        return {
            "repository": {
                "owner": owner,
                "name": repo,
                "full_name": f"{owner}/{repo}",
                "description": repo_info.get("description"),
                "language": repo_info.get("language"),
                "html_url": repo_info["html_url"],
                "private": repo_info["private"]
            },
            "files": files,
            "total_files": len(files)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze repository: {str(e)}")

@app.post("/repo/generate-suggestions")
async def generate_suggestions_direct(request_data: DirectTestRequest):
    """Generate test suggestions directly from repo URL"""
    print(f"🚀 Starting test suggestion generation...")
    print(f"📝 Request data: repo_url={request_data.repo_url}, files={request_data.files}, framework={request_data.framework}")
    
    try:
        owner, repo = parse_github_url(request_data.repo_url)
        token = get_github_token()
        
        # Fetch file contents
        file_contents = []
        for file_path in request_data.files:
            content = await fetch_file_content(owner, repo, file_path, token)
            file_contents.append(f"File: {file_path}\n```\n{content}\n```")
        
        # Detect framework if not specified
        if request_data.framework:
            framework = request_data.framework
        else:
            # Auto-detect from first file
            first_file = request_data.files[0]
            language = detect_language_from_extension(first_file)
            framework = detect_framework_from_language(language, first_file)
        
        # Get framework configuration
        framework_config = get_framework_config(framework)
        
        # Create framework-specific AI prompt
        if framework == 'selenium':
            system_message = """You are a Senior QA Engineer specializing in Selenium web automation testing. Your task is to analyze code files and suggest meaningful UI/web automation test cases.

Rules:
1. Return ONLY a numbered list of 3-5 test case summaries
2. Focus on UI interactions, user workflows, and web element testing
3. Consider browser compatibility, responsive design, and user experience
4. Include scenarios for form validation, navigation, and dynamic content
5. Each summary should describe what UI behavior to test

Format your response as:
1. Test case summary here
2. Another test case summary
3. Third test case summary
etc."""
        elif framework in ['cypress', 'playwright']:
            system_message = """You are a Senior QA Engineer specializing in end-to-end web testing. Your task is to analyze code files and suggest meaningful E2E test cases.

Rules:
1. Return ONLY a numbered list of 3-5 test case summaries
2. Focus on complete user journeys and workflows
3. Consider API interactions, database state, and UI behavior
4. Include scenarios for authentication, data flow, and error states
5. Each summary should describe what end-to-end behavior to test

Format your response as:
1. Test case summary here
2. Another test case summary
3. Third test case summary
etc."""
        else:
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

        # Create framework-specific user message
        if framework == 'selenium':
            user_message = f"""Analyze these code files and suggest Selenium automation test cases:

{chr(10).join(file_contents)}

Generate 3-5 meaningful Selenium test case suggestions focusing on:
- UI element interactions (clicks, inputs, selections)
- Form submissions and validations
- Page navigation and routing
- Dynamic content loading
- Cross-browser compatibility scenarios
- Responsive design testing"""
        elif framework in ['cypress', 'playwright']:
            user_message = f"""Analyze these code files and suggest {framework} E2E test cases:

{chr(10).join(file_contents)}

Generate 3-5 meaningful {framework} test case suggestions focusing on:
- Complete user workflows
- API integration testing
- Authentication flows
- Data persistence and state management
- Error handling and recovery
- Performance and loading scenarios"""
        else:
            user_message = f"""Analyze these code files and suggest test cases for {framework} framework:

{chr(10).join(file_contents)}

Generate 3-5 meaningful test case suggestions focusing on:
- Edge cases and boundary conditions
- Error handling and validation
- Core functionality verification
- Integration points if applicable"""

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ]
        
        # Call AI API
        ai_response = await call_openrouter_api(messages)
        
        # Parse response into suggestions
        suggestions = []
        lines = ai_response.strip().split('\n')
        suggestion_id = 1
        
        for line in lines:
            line = line.strip()
            # Only capture main numbered test case summaries, not sub-items like "Input:" or "Expected result:"
            if line and line[0].isdigit() and '. ' in line:
                # Skip lines that are clearly sub-items (Input, Expected, etc.)
                if any(keyword in line.lower() for keyword in ['input:', 'expected result:', 'expected output:', '- input', '- expected']):
                    continue
                    
                # Remove numbering and clean up
                clean_line = '. '.join(line.split('. ')[1:]) if '. ' in line else line[2:].strip()
                
                # Remove "Test case summary:" prefix if present
                if 'test case summary:' in clean_line.lower():
                    clean_line = clean_line.split('Test case summary: ')[1] if 'Test case summary: ' in clean_line else clean_line.split('test case summary: ')[1]
                
                if clean_line and len(clean_line) > 10:  # Ensure it's a meaningful summary
                    suggestions.append({
                        "id": suggestion_id,
                        "summary": clean_line.strip(),
                        "framework": framework
                    })
                    suggestion_id += 1
        
        # Enhanced Fallback: Always generate suggestions if AI parsing failed
        if len(suggestions) == 0:
            print("🔄 No suggestions parsed, generating enhanced fallback suggestions...")
            
            # Get file extension for better suggestions
            first_file = request_data.files[0] if request_data.files else "code"
            file_ext = first_file.split('.')[-1].lower() if '.' in first_file else 'code'
            
            # Framework-specific fallback suggestions
            if framework == 'pytest':
                fallback_suggestions = [
                    f"Test function return values and data types in {first_file}",
                    f"Test exception handling and error cases in {first_file}",
                    f"Test input validation and boundary conditions in {first_file}",
                    f"Test function behavior with edge cases and null values in {first_file}",
                    f"Test integration with external dependencies in {first_file}"
                ]
            elif framework == 'jest':
                fallback_suggestions = [
                    f"Test component rendering and props in {first_file}",
                    f"Test user interactions and event handlers in {first_file}",
                    f"Test state management and updates in {first_file}",
                    f"Test API calls and async operations in {first_file}",
                    f"Test error boundaries and error handling in {first_file}"
                ]
            elif framework == 'junit':
                fallback_suggestions = [
                    f"Test method functionality and return values in {first_file}",
                    f"Test exception handling and error scenarios in {first_file}",
                    f"Test input validation and parameter checking in {first_file}",
                    f"Test class initialization and object state in {first_file}",
                    f"Test integration with external services in {first_file}"
                ]
            else:
                fallback_suggestions = [
                    f"Test core functionality and expected behavior in {first_file}",
                    f"Test error handling and exception scenarios in {first_file}",
                    f"Test input validation and data processing in {first_file}",
                    f"Test edge cases and boundary conditions in {first_file}",
                    f"Test performance and resource usage in {first_file}"
                ]
            
            for i, summary in enumerate(fallback_suggestions, 1):
                suggestions.append({
                    "id": i,
                    "summary": summary,
                    "framework": framework
                })
            
            print(f"✅ Generated {len(suggestions)} enhanced fallback suggestions")
        
        return {
            "repository": f"{owner}/{repo}",
            "framework": framework,
            "suggestions": suggestions,
            "files_analyzed": request_data.files
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@app.post("/repo/generate-code")
async def generate_code_direct(request_data: DirectCodeRequest):
    """Generate test code directly from repo URL"""
    try:
        owner, repo = parse_github_url(request_data.repo_url)
        token = get_github_token()
        
        # Fetch file contents
        file_contents = []
        for file_path in request_data.files:
            content = await fetch_file_content(owner, repo, file_path, token)
            file_contents.append(f"File: {file_path}\n```\n{content}\n```")
        
        # Detect framework and language
        if request_data.framework:
            framework = request_data.framework
        else:
            first_file = request_data.files[0]
            language = detect_language_from_extension(first_file)
            framework = detect_framework_from_language(language, first_file)
        
        # Detect primary language
        first_file = request_data.files[0]
        primary_language = detect_language_from_extension(first_file)
        
        # Get framework configuration for imports
        framework_config = get_framework_config(framework)
        framework_imports = framework_config.get('imports', {}).get(primary_language, [])
        
        # Create framework-specific AI prompt for code generation
        if framework == 'selenium':
            system_message = f"""You are a Senior QA Engineer writing Selenium automation test code using {primary_language}. 

Rules:
1. Write complete, runnable Selenium test code
2. Include all necessary imports: {', '.join(framework_imports)}
3. Set up WebDriver (Chrome/Firefox) with proper configuration
4. Use explicit waits and proper element locators
5. Include setup() and teardown() methods
6. Follow Page Object Model patterns when appropriate
7. Use descriptive test names and comments
8. Handle browser cleanup properly
9. Return ONLY the test code, no explanations

The code should be production-ready Selenium automation code."""
        elif framework in ['cypress', 'playwright']:
            system_message = f"""You are a Senior QA Engineer writing {framework} E2E test code using {primary_language}. 

Rules:
1. Write complete, runnable {framework} test code
2. Include all necessary imports and setup
3. Use proper {framework} commands and assertions
4. Include beforeEach/afterEach hooks if needed
5. Handle async operations properly
6. Use descriptive test names and comments
7. Follow {framework} best practices
8. Return ONLY the test code, no explanations

The code should be production-ready {framework} automation code."""
        else:
            system_message = f"""You are a Senior QA Engineer writing test code using {framework}. 

Rules:
1. Write complete, runnable test code
2. Include all necessary imports and setup
3. Follow {framework} best practices and conventions
4. Use appropriate assertions and test structure
5. Include descriptive test names and comments
6. Handle setup/teardown if needed
7. Return ONLY the test code, no explanations

The code should be production-ready and follow industry standards."""

        user_message = f"""Write complete test code for this test case: "{request_data.suggestion_summary}"

Source code to test:
{chr(10).join(file_contents)}

Framework: {framework}
Language: {primary_language}

Generate a complete test file with:
- Proper imports
- Test class/function structure
- Meaningful test method names
- Appropriate assertions
- Any necessary mocks or fixtures"""

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ]
        
        # Call AI API
        test_code = await call_openrouter_api(messages)
        
        # Generate suggested filename
        base_name = request_data.files[0].split('/')[-1].split('.')[0]
        ext_map = {
            "pytest": "py",
            "selenium": "py",
            "jest": "js" if primary_language == "javascript" else "ts",
            "cypress": "js",
            "playwright": "js" if primary_language == "javascript" else "ts",
            "junit": "java",
            "testing": "go",
            "rspec": "rb"
        }
        ext = ext_map.get(framework, "py")
        
        if framework == 'selenium':
            suggested_filename = f"test_{base_name}_selenium.{ext}"
        elif framework in ['cypress', 'playwright']:
            suggested_filename = f"{base_name}.spec.{ext}"
        else:
            suggested_filename = f"test_{base_name}.{ext}"
        
        return {
            "repository": f"{owner}/{repo}",
            "test_code": test_code,
            "suggested_filename": suggested_filename,
            "framework": framework,
            "language": primary_language,
            "files_analyzed": request_data.files
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate test code: {str(e)}")

# AI Integration endpoints
async def call_openrouter_api(messages: List[dict], model: str = "mistralai/mistral-7b-instruct") -> str:
    """Call OpenRouter API for AI generation"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Test Case Generator"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 2000,
        "temperature": 0.7
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"OpenRouter API error: {response.text}")
        
        result = response.json()
        return result["choices"][0]["message"]["content"]

@app.post("/generate-test-suggestions")
async def generate_test_suggestions(request_data: GenerateTestRequest, request: Request) -> List[TestSuggestion]:
    """Generate test case suggestions using AI"""
    session_token = get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    github_token = get_github_token_from_session(session_token)
    if not github_token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    
    # Fetch file contents
    file_contents = []
    owner, repo = request_data.repo_full_name.split("/")
    
    for file_path in request_data.files:
        file_data = await github_api_request(f"/repos/{owner}/{repo}/contents/{file_path}", github_token)
        if file_data.get("encoding") == "base64":
            import base64
            content = base64.b64decode(file_data["content"]).decode("utf-8")
            file_contents.append(f"File: {file_path}\n```\n{content}\n```")
    
    # Detect framework and language
    primary_language = None
    if file_contents:
        first_file = request_data.files[0]
        ext = first_file.split('.')[-1].lower()
        lang_map = {"py": "python", "js": "javascript", "jsx": "javascript", "ts": "typescript", "tsx": "typescript"}
        primary_language = lang_map.get(ext, ext)
    
    # Use user-specified framework or detect automatically
    if request_data.framework:
        framework = request_data.framework
        # Validate framework is supported for this file type
        available_frameworks = get_available_frameworks(request_data.files[0])
        if framework not in available_frameworks:
            raise HTTPException(
                status_code=400, 
                detail=f"Framework '{framework}' not supported for file type. Available: {available_frameworks}"
            )
    else:
        framework = detect_test_framework(request_data.files[0], primary_language)
    
    # Get framework configuration
    framework_config = get_framework_config(framework)
    
    # Create framework-specific AI prompt
    if framework == 'selenium':
        system_message = """You are a Senior QA Engineer specializing in Selenium web automation testing. Your task is to analyze code files and suggest meaningful UI/web automation test cases.

Rules:
1. Return ONLY a numbered list of 3-5 test case summaries
2. Focus on UI interactions, user workflows, and web element testing
3. Consider browser compatibility, responsive design, and user experience
4. Include scenarios for form validation, navigation, and dynamic content
5. Each summary should describe what UI behavior to test

Format your response as:
1. Test case summary here
2. Another test case summary
3. Third test case summary
etc."""
    elif framework in ['cypress', 'playwright']:
        system_message = """You are a Senior QA Engineer specializing in end-to-end web testing. Your task is to analyze code files and suggest meaningful E2E test cases.

Rules:
1. Return ONLY a numbered list of 3-5 test case summaries
2. Focus on complete user journeys and workflows
3. Consider API interactions, database state, and UI behavior
4. Include scenarios for authentication, data flow, and error states
5. Each summary should describe what end-to-end behavior to test

Format your response as:
1. Test case summary here
2. Another test case summary
3. Third test case summary
etc."""
    else:
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

    # Create framework-specific user message
    if framework == 'selenium':
        user_message = f"""Analyze these code files and suggest Selenium automation test cases:

{chr(10).join(file_contents)}

Generate 3-5 meaningful Selenium test case suggestions focusing on:
- UI element interactions (clicks, inputs, selections)
- Form submissions and validations
- Page navigation and routing
- Dynamic content loading
- Cross-browser compatibility scenarios
- Responsive design testing"""
    elif framework in ['cypress', 'playwright']:
        user_message = f"""Analyze these code files and suggest {framework} E2E test cases:

{chr(10).join(file_contents)}

Generate 3-5 meaningful {framework} test case suggestions focusing on:
- Complete user workflows
- API integration testing
- Authentication flows
- Data persistence and state management
- Error handling and recovery
- Performance and loading scenarios"""
    else:
        user_message = f"""Analyze these code files and suggest test cases for {framework} framework:

{chr(10).join(file_contents)}

Generate 3-5 meaningful test case suggestions focusing on:
- Edge cases and boundary conditions
- Error handling and validation
- Core functionality verification
- Integration points if applicable"""

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message}
    ]
    
    # Call AI API with fallback models
    ai_response = None
    models_to_try = [
        "mistralai/mistral-7b-instruct",
        "openai/gpt-3.5-turbo",
        "anthropic/claude-3-haiku",
        "meta-llama/llama-3-8b-instruct"
    ]
    
    for model in models_to_try:
        try:
            print(f"🤖 Trying AI model: {model}")
            ai_response = await call_openrouter_api(messages, model)
            if ai_response and len(ai_response.strip()) > 50:
                print(f"✅ Success with model: {model}")
                break
            else:
                print(f"⚠️ Empty/short response from {model}")
        except Exception as e:
            print(f"❌ Error with model {model}: {str(e)}")
            continue
    
    if not ai_response:
        raise HTTPException(status_code=500, detail="All AI models failed to generate suggestions")
    
    # Parse response into suggestions with improved logic
    suggestions = []
    lines = ai_response.strip().split('\n')
    suggestion_id = 1
    
    print(f"🔍 AI Response received: {len(lines)} lines")
    print(f"Raw response: {ai_response[:200]}...")
    
    for line in lines:
        original_line = line
        line = line.strip()
        
        # Skip lines that are clearly sub-items (Input, Expected, etc.)
        if any(keyword in line.lower() for keyword in ['input:', 'expected result:', 'expected output:', '- input', '- expected']):
            print(f"❌ Skipped sub-item: {original_line[:50]}...")
            continue
        
        # More flexible parsing - look for various patterns
        if line and len(line) > 10:  # Minimum length for a meaningful suggestion
            clean_line = None
            
            # Pattern 1: "1. Test case description" (main pattern)
            if line[0].isdigit() and '. ' in line:
                clean_line = '. '.join(line.split('. ')[1:])
                # Remove "Test case summary:" prefix if present
                if 'test case summary:' in clean_line.lower():
                    clean_line = clean_line.split('Test case summary: ')[1] if 'Test case summary: ' in clean_line else clean_line.split('test case summary: ')[1]
            # Pattern 2: "1) Test case description"  
            elif line[0].isdigit() and ') ' in line:
                clean_line = ') '.join(line.split(') ')[1:])
            # Pattern 3: Just numbered at start "1 Test case description"
            elif line[0].isdigit() and line[1] == ' ':
                clean_line = line[2:].strip()
            # Skip dash patterns for now as they often capture sub-items
            
            if clean_line and len(clean_line) > 15:  # Ensure it's a meaningful summary
                suggestions.append(TestSuggestion(
                    id=suggestion_id,
                    summary=clean_line.strip(),
                    framework=framework
                ))
                suggestion_id += 1
                print(f"✅ Parsed suggestion {suggestion_id-1}: {clean_line[:50]}...")
            else:
                print(f"❌ Skipped line (too short or empty): {original_line[:50]}...")
    
    print(f"🎯 Total suggestions parsed: {len(suggestions)}")
    
    # Enhanced Fallback: Always generate suggestions if AI parsing failed
    if len(suggestions) == 0:
        print("🔄 No suggestions parsed, generating enhanced fallback suggestions...")
        
        # Get file extension for better suggestions
        first_file = request_data.files[0] if request_data.files else "code"
        file_ext = first_file.split('.')[-1].lower() if '.' in first_file else 'code'
        
        # Framework-specific fallback suggestions
        if framework == 'pytest':
            fallback_suggestions = [
                f"Test function return values and data types in {first_file}",
                f"Test exception handling and error cases in {first_file}",
                f"Test input validation and boundary conditions in {first_file}",
                f"Test function behavior with edge cases and null values in {first_file}",
                f"Test integration with external dependencies in {first_file}"
            ]
        elif framework == 'jest':
            fallback_suggestions = [
                f"Test component rendering and props in {first_file}",
                f"Test user interactions and event handlers in {first_file}",
                f"Test state management and updates in {first_file}",
                f"Test API calls and async operations in {first_file}",
                f"Test error boundaries and error handling in {first_file}"
            ]
        elif framework == 'junit':
            fallback_suggestions = [
                f"Test method functionality and return values in {first_file}",
                f"Test exception handling and error scenarios in {first_file}",
                f"Test input validation and parameter checking in {first_file}",
                f"Test class initialization and object state in {first_file}",
                f"Test integration with external services in {first_file}"
            ]
        else:
            fallback_suggestions = [
                f"Test core functionality and expected behavior in {first_file}",
                f"Test error handling and exception scenarios in {first_file}",
                f"Test input validation and data processing in {first_file}",
                f"Test edge cases and boundary conditions in {first_file}",
                f"Test performance and resource usage in {first_file}"
            ]
        
        for i, summary in enumerate(fallback_suggestions, 1):
            suggestions.append(TestSuggestion(
                id=i,
                summary=summary,
                framework=framework
            ))
        
        print(f"✅ Generated {len(suggestions)} enhanced fallback suggestions")
    
    # Store suggestions in session for later use
    if session_token in sessions:
        sessions[session_token]["last_suggestions"] = suggestions
        sessions[session_token]["last_files"] = request_data.files
        sessions[session_token]["last_repo"] = request_data.repo_full_name
    
    return suggestions

@app.post("/generate-test-code")
async def generate_test_code(request_data: GenerateCodeRequest, request: Request):
    """Generate full test code for a selected suggestion"""
    session_token = get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    github_token = get_github_token_from_session(session_token)
    if not github_token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    
    # Fetch file contents
    file_contents = []
    owner, repo = request_data.repo_full_name.split("/")
    
    for file_path in request_data.files:
        file_data = await github_api_request(f"/repos/{owner}/{repo}/contents/{file_path}", github_token)
        if file_data.get("encoding") == "base64":
            import base64
            content = base64.b64decode(file_data["content"]).decode("utf-8")
            file_contents.append(f"File: {file_path}\n```\n{content}\n```")
    
    # Detect framework and language
    primary_language = None
    if file_contents:
        first_file = request_data.files[0]
        ext = first_file.split('.')[-1].lower()
        lang_map = {"py": "python", "js": "javascript", "jsx": "javascript", "ts": "typescript", "tsx": "typescript"}
        primary_language = lang_map.get(ext, ext)
    
    framework = detect_test_framework(request_data.files[0], primary_language)
    
    # Get framework configuration for imports
    framework_config = get_framework_config(framework)
    framework_imports = framework_config.get('imports', {}).get(primary_language, [])
    
    # Create framework-specific AI prompt for code generation
    if framework == 'selenium':
        system_message = f"""You are a Senior QA Engineer writing Selenium automation test code using {primary_language}. 

Rules:
1. Write complete, runnable Selenium test code
2. Include all necessary imports: {', '.join(framework_imports)}
3. Set up WebDriver (Chrome/Firefox) with proper configuration
4. Use explicit waits and proper element locators
5. Include setup() and teardown() methods
6. Follow Page Object Model patterns when appropriate
7. Use descriptive test names and comments
8. Handle browser cleanup properly
9. Return ONLY the test code, no explanations

The code should be production-ready Selenium automation code."""
    elif framework in ['cypress', 'playwright']:
        system_message = f"""You are a Senior QA Engineer writing {framework} E2E test code using {primary_language}. 

Rules:
1. Write complete, runnable {framework} test code
2. Include all necessary imports and setup
3. Use proper {framework} commands and assertions
4. Include beforeEach/afterEach hooks if needed
5. Handle async operations properly
6. Use descriptive test names and comments
7. Follow {framework} best practices
8. Return ONLY the test code, no explanations

The code should be production-ready {framework} automation code."""
    else:
        system_message = f"""You are a Senior QA Engineer writing test code using {framework}. 

Rules:
1. Write complete, runnable test code
2. Include all necessary imports and setup
3. Follow {framework} best practices and conventions
4. Use appropriate assertions and test structure
5. Include descriptive test names and comments
6. Handle setup/teardown if needed
7. Return ONLY the test code, no explanations

The code should be production-ready and follow industry standards."""

    user_message = f"""Write complete test code for this test case: "{request_data.suggestion_summary}"

Source code to test:
{chr(10).join(file_contents)}

Framework: {framework}
Language: {primary_language}

Generate a complete test file with:
- Proper imports
- Test class/function structure
- Meaningful test method names
- Appropriate assertions
- Any necessary mocks or fixtures"""

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message}
    ]
    
    # Call AI API
    test_code = await call_openrouter_api(messages)
    
    # Generate suggested filename
    base_name = request_data.files[0].split('/')[-1].split('.')[0]
    ext_map = {
        "pytest": "py",
        "jest": "js" if primary_language == "javascript" else "ts",
        "junit": "java",
        "testing": "go",
        "rspec": "rb"
    }
    ext = ext_map.get(framework, "py")
    suggested_filename = f"test_{base_name}.{ext}"
    
    return {
        "test_code": test_code,
        "suggested_filename": suggested_filename,
        "framework": framework,
        "language": primary_language
    }

# Pull Request endpoints
@app.post("/create-pull-request")
async def create_pull_request(request_data: CreatePRRequest, request: Request):
    """Create a pull request with the generated test code"""
    session_token = get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    github_token = get_github_token_from_session(session_token)
    if not github_token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    
    owner, repo = request_data.repo_full_name.split("/")
    
    try:
        # 1. Get the default branch
        repo_info = await github_api_request(f"/repos/{owner}/{repo}", github_token)
        default_branch = repo_info["default_branch"]
        
        # 2. Get the latest commit SHA of the default branch
        branch_info = await github_api_request(f"/repos/{owner}/{repo}/git/refs/heads/{default_branch}", github_token)
        base_sha = branch_info["object"]["sha"]
        
        # 3. Create a new branch
        branch_data = {
            "ref": f"refs/heads/{request_data.branch_name}",
            "sha": base_sha
        }
        await github_api_request(f"/repos/{owner}/{repo}/git/refs", github_token, "POST", branch_data)
        
        # 4. Create a blob with the test file content
        blob_data = {
            "content": request_data.test_code,
            "encoding": "utf-8"
        }
        blob_response = await github_api_request(f"/repos/{owner}/{repo}/git/blobs", github_token, "POST", blob_data)
        blob_sha = blob_response["sha"]
        
        # 5. Get the current tree
        tree_response = await github_api_request(f"/repos/{owner}/{repo}/git/trees/{base_sha}", github_token)
        
        # 6. Create a new tree with the test file
        tree_data = {
            "base_tree": base_sha,
            "tree": [
                {
                    "path": request_data.test_file_name,
                    "mode": "100644",
                    "type": "blob",
                    "sha": blob_sha
                }
            ]
        }
        new_tree_response = await github_api_request(f"/repos/{owner}/{repo}/git/trees", github_token, "POST", tree_data)
        new_tree_sha = new_tree_response["sha"]
        
        # 7. Create a commit
        commit_data = {
            "message": request_data.commit_message,
            "tree": new_tree_sha,
            "parents": [base_sha]
        }
        commit_response = await github_api_request(f"/repos/{owner}/{repo}/git/commits", github_token, "POST", commit_data)
        commit_sha = commit_response["sha"]
        
        # 8. Update the branch reference
        update_ref_data = {
            "sha": commit_sha
        }
        await github_api_request(f"/repos/{owner}/{repo}/git/refs/heads/{request_data.branch_name}", github_token, "PATCH", update_ref_data)
        
        # 9. Create the pull request
        pr_data = {
            "title": f"Add test file: {request_data.test_file_name}",
            "head": request_data.branch_name,
            "base": default_branch,
            "body": f"This PR adds automated test cases generated by Test Case Generator.\n\n**Test file:** `{request_data.test_file_name}`\n\n**Commit:** {request_data.commit_message}"
        }
        pr_response = await github_api_request(f"/repos/{owner}/{repo}/pulls", github_token, "POST", pr_data)
        
        return {
            "success": True,
            "pr_url": pr_response["html_url"],
            "pr_number": pr_response["number"],
            "branch_name": request_data.branch_name
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create pull request: {str(e)}")

# End of API endpoints

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
