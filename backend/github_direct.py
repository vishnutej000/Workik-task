"""
Direct GitHub repository processing without OAuth
For public repositories and testing purposes
"""
import re
import httpx
from typing import List, Dict, Optional, Tuple
from fastapi import HTTPException
import base64
import os
from dotenv import load_dotenv

load_dotenv()

def parse_github_url(repo_url: str) -> Tuple[str, str]:
    """
    Parse GitHub repository URL to extract owner and repo name
    
    Supports formats:
    - https://github.com/owner/repo
    - https://github.com/owner/repo.git
    - github.com/owner/repo
    - owner/repo
    """
    # Clean the URL
    repo_url = repo_url.strip()
    
    # Remove .git suffix if present
    if repo_url.endswith('.git'):
        repo_url = repo_url[:-4]
    
    # Extract owner/repo pattern
    patterns = [
        r'https?://github\.com/([^/]+)/([^/]+)',  # https://github.com/owner/repo
        r'github\.com/([^/]+)/([^/]+)',           # github.com/owner/repo
        r'^([^/]+)/([^/]+)$'                      # owner/repo
    ]
    
    for pattern in patterns:
        match = re.match(pattern, repo_url)
        if match:
            owner, repo = match.groups()
            return owner.strip(), repo.strip()
    
    raise HTTPException(
        status_code=400, 
        detail=f"Invalid GitHub repository URL format: {repo_url}. Use format: owner/repo or https://github.com/owner/repo"
    )

async def fetch_github_repo_info(owner: str, repo: str, token: str = None) -> Dict:
    """Fetch repository information from GitHub API"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "TestCaseGenerator/1.0"
    }
    
    if token:
        headers["Authorization"] = f"token {token}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Repository {owner}/{repo} not found or is private")
            elif response.status_code == 403:
                raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded. Try again later or add GITHUB_PERSONAL_TOKEN to .env")
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"GitHub API error: {response.text}")
            
            return response.json()
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to GitHub API: {str(e)}")

async def fetch_github_repo_files(owner: str, repo: str, token: str = None) -> List[Dict]:
    """Fetch all code files from a GitHub repository"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "TestCaseGenerator/1.0"
    }
    
    if token:
        headers["Authorization"] = f"token {token}"
    
    async with httpx.AsyncClient() as client:
        try:
            # Get repository tree (recursive)
            response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1", 
                headers=headers
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Repository {owner}/{repo} not found or is private")
            elif response.status_code == 403:
                raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded")
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"GitHub API error: {response.text}")
            
            tree_data = response.json()
            
            # Filter for code files
            code_files = []
            code_extensions = {'.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go', '.rb', '.php', '.cs', '.swift', '.cpp', '.c', '.h'}
            exclude_patterns = ['test', 'spec', '__pycache__', 'node_modules', '.git', 'dist', 'build', 'coverage', '.pytest_cache', 'target', 'bin', 'obj']
            
            for item in tree_data.get("tree", []):
                if item["type"] == "blob":  # It's a file
                    file_path = item["path"]
                    
                    # Check if it's a code file
                    ext = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
                    if ext in code_extensions:
                        # Check if it should be excluded
                        path_lower = file_path.lower()
                        should_exclude = any(pattern in path_lower for pattern in exclude_patterns)
                        
                        if not should_exclude:
                            code_files.append({
                                "path": file_path,
                                "name": file_path.split("/")[-1],
                                "type": "file",
                                "size": item.get("size"),
                                "sha": item["sha"],
                                "download_url": f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
                            })
            
            return code_files
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to GitHub API: {str(e)}")

async def fetch_file_content(owner: str, repo: str, file_path: str, token: str = None) -> str:
    """Fetch content of a specific file from GitHub"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "TestCaseGenerator/1.0"
    }
    
    if token:
        headers["Authorization"] = f"token {token}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}",
                headers=headers
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"File {file_path} not found in {owner}/{repo}")
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"GitHub API error: {response.text}")
            
            file_data = response.json()
            
            if file_data.get("encoding") == "base64":
                content = base64.b64decode(file_data["content"]).decode("utf-8")
                return content
            else:
                raise HTTPException(status_code=400, detail="Unable to decode file content")
                
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch file content: {str(e)}")

def detect_language_from_extension(file_path: str) -> str:
    """Detect programming language from file extension"""
    ext = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
    
    language_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.java': 'java',
        '.go': 'go',
        '.rb': 'ruby',
        '.php': 'php',
        '.cs': 'csharp',
        '.swift': 'swift',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c'
    }
    
    return language_map.get(ext, 'unknown')

def detect_framework_from_language(language: str, file_path: str = "") -> str:
    """Detect appropriate test framework based on language"""
    framework_map = {
        'python': 'pytest',
        'javascript': 'jest',
        'typescript': 'jest',
        'java': 'junit',
        'go': 'testing',
        'ruby': 'rspec',
        'php': 'phpunit',
        'csharp': 'nunit',
        'swift': 'xctest',
        'cpp': 'gtest',
        'c': 'unity'
    }
    
    return framework_map.get(language, 'generic')

async def detect_framework_from_project_structure(owner: str, repo: str, file_path: str, token: str = None) -> str:
    """
    Enhanced framework detection based on project structure and files
    """
    try:
        # Get repository tree to analyze project structure
        headers = {}
        if token:
            headers["Authorization"] = f"token {token}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1",
                headers=headers
            )
            
            if response.status_code != 200:
                # Fallback to simple language detection
                language = detect_language_from_extension(file_path)
                return detect_framework_from_language(language, file_path)
            
            tree_data = response.json()
            file_paths = [item["path"] for item in tree_data.get("tree", []) if item["type"] == "blob"]
            
            print(f"🔍 Analyzing {len(file_paths)} files for framework detection")
            
            # Count file types
            file_stats = {
                'python': 0, 'javascript': 0, 'typescript': 0, 'java': 0,
                'csharp': 0, 'go': 0, 'ruby': 0, 'php': 0
            }
            
            # Look for framework indicators
            framework_indicators = {
                'cypress': [],
                'playwright': [],
                'selenium': [],
                'jest': [],
                'vitest': [],
                'pytest': [],
                'unittest': [],
                'junit': [],
                'nunit': [],
                'rspec': [],
                'mocha': [],
                'phpunit': []
            }
            
            for path in file_paths:
                path_lower = path.lower()
                
                # Count file types
                ext = '.' + path.split('.')[-1].lower() if '.' in path else ''
                if ext == '.py':
                    file_stats['python'] += 1
                elif ext in ['.js', '.jsx']:
                    file_stats['javascript'] += 1
                elif ext in ['.ts', '.tsx']:
                    file_stats['typescript'] += 1
                elif ext == '.java':
                    file_stats['java'] += 1
                elif ext == '.cs':
                    file_stats['csharp'] += 1
                elif ext == '.go':
                    file_stats['go'] += 1
                elif ext == '.rb':
                    file_stats['ruby'] += 1
                elif ext == '.php':
                    file_stats['php'] += 1
                
                # Look for framework-specific files and patterns
                if 'cypress' in path_lower or 'cypress.config' in path_lower:
                    framework_indicators['cypress'].append(path)
                elif 'playwright' in path_lower or 'playwright.config' in path_lower:
                    framework_indicators['playwright'].append(path)
                elif 'selenium' in path_lower:
                    framework_indicators['selenium'].append(path)
                elif 'jest.config' in path_lower or 'jest.setup' in path_lower:
                    framework_indicators['jest'].append(path)
                elif 'vitest.config' in path_lower:
                    framework_indicators['vitest'].append(path)
                elif 'conftest.py' in path_lower or 'pytest.ini' in path_lower:
                    framework_indicators['pytest'].append(path)
                elif 'unittest' in path_lower and ext == '.py':
                    framework_indicators['unittest'].append(path)
                elif 'pom.xml' in path_lower or 'build.gradle' in path_lower or path_lower.endswith('test.java'):
                    framework_indicators['junit'].append(path)
                elif path_lower.endswith('.csproj') or 'nunit' in path_lower:
                    framework_indicators['nunit'].append(path)
                elif 'spec.rb' in path_lower or 'rspec' in path_lower:
                    framework_indicators['rspec'].append(path)
                elif 'mocha' in path_lower:
                    framework_indicators['mocha'].append(path)
                elif 'phpunit' in path_lower:
                    framework_indicators['phpunit'].append(path)
            
            print(f"📊 File statistics: {file_stats}")
            print(f"🔍 Framework indicators found: {[(k, len(v)) for k, v in framework_indicators.items() if v]}")
            
            # Determine primary language of the target file
            target_ext = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
            target_language = detect_language_from_extension(file_path)
            
            print(f"🎯 Target file: {file_path} (Language: {target_language})")
            
            # Priority-based framework detection
            
            # 1. E2E/UI Testing frameworks (highest priority for web projects)
            if framework_indicators['cypress']:
                return 'cypress'
            elif framework_indicators['playwright']:
                return 'playwright'
            elif framework_indicators['selenium'] and (file_stats['python'] > 0 or target_language == 'python'):
                return 'selenium'
            
            # 2. Language-specific framework detection with project analysis
            if target_language == 'python' or file_stats['python'] > file_stats['javascript'] + file_stats['typescript']:
                if framework_indicators['pytest']:
                    return 'pytest'
                elif framework_indicators['unittest']:
                    return 'unittest'
                elif framework_indicators['selenium']:
                    return 'selenium'
                else:
                    return 'pytest'  # Default for Python
            
            elif target_language in ['javascript', 'typescript'] or file_stats['javascript'] + file_stats['typescript'] > file_stats['python']:
                if framework_indicators['jest']:
                    return 'jest'
                elif framework_indicators['vitest']:
                    return 'vitest'
                elif framework_indicators['mocha']:
                    return 'mocha'
                elif framework_indicators['cypress']:
                    return 'cypress'
                elif framework_indicators['playwright']:
                    return 'playwright'
                else:
                    return 'jest'  # Default for JS/TS
            
            elif target_language == 'java' or file_stats['java'] > 0:
                return 'junit'
            
            elif target_language == 'csharp' or file_stats['csharp'] > 0:
                return 'nunit'
            
            elif target_language == 'go' or file_stats['go'] > 0:
                return 'testing'
            
            elif target_language == 'ruby' or file_stats['ruby'] > 0:
                if framework_indicators['rspec']:
                    return 'rspec'
                else:
                    return 'rspec'
            
            elif target_language == 'php' or file_stats['php'] > 0:
                return 'phpunit'
            
            # Fallback to simple language-based detection
            return detect_framework_from_language(target_language, file_path)
            
    except Exception as e:
        print(f"❌ Enhanced framework detection failed: {str(e)}")
        # Fallback to simple detection
        language = detect_language_from_extension(file_path)
        return detect_framework_from_language(language, file_path)

def get_github_token() -> Optional[str]:
    """Get GitHub personal token from environment"""
    return os.getenv("GITHUB_PERSONAL_TOKEN")