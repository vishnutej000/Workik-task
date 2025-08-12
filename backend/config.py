"""
Configuration settings for the Test Case Generator API
"""
import os
from typing import Dict, List

# AI Model configurations
AI_MODELS = {
    "mistral-7b": {
        "name": "mistralai/mistral-7b-instruct",
        "max_tokens": 2000,
        "temperature": 0.7,
        "description": "Fast and efficient for code analysis"
    },
    "llama-3-8b": {
        "name": "meta-llama/llama-3-8b-instruct", 
        "max_tokens": 2000,
        "temperature": 0.7,
        "description": "Good balance of speed and quality"
    },
    "claude-haiku": {
        "name": "anthropic/claude-3-haiku",
        "max_tokens": 2000,
        "temperature": 0.7,
        "description": "Excellent for test case generation"
    },
    "gpt-3.5": {
        "name": "openai/gpt-3.5-turbo",
        "max_tokens": 2000,
        "temperature": 0.7,
        "description": "Reliable and well-tested"
    }
}

# Default model
DEFAULT_AI_MODEL = "mistral-7b"

# File type configurations with multiple framework options
SUPPORTED_EXTENSIONS = {
    '.py': {
        'language': 'python', 
        'frameworks': ['pytest', 'selenium', 'unittest', 'behave'],
        'default_framework': 'pytest'
    },
    '.js': {
        'language': 'javascript', 
        'frameworks': ['jest', 'selenium-webdriver', 'cypress', 'playwright'],
        'default_framework': 'jest'
    },
    '.jsx': {
        'language': 'javascript', 
        'frameworks': ['jest', 'selenium-webdriver', 'cypress', 'playwright'],
        'default_framework': 'jest'
    },
    '.ts': {
        'language': 'typescript', 
        'frameworks': ['jest', 'selenium-webdriver', 'cypress', 'playwright'],
        'default_framework': 'jest'
    },
    '.tsx': {
        'language': 'typescript', 
        'frameworks': ['jest', 'selenium-webdriver', 'cypress', 'playwright'],
        'default_framework': 'jest'
    },
    '.java': {
        'language': 'java', 
        'frameworks': ['junit', 'selenium', 'testng'],
        'default_framework': 'junit'
    },
    '.go': {
        'language': 'go', 
        'frameworks': ['testing', 'selenium'],
        'default_framework': 'testing'
    },
    '.rb': {
        'language': 'ruby', 
        'frameworks': ['rspec', 'selenium'],
        'default_framework': 'rspec'
    },
    '.php': {
        'language': 'php', 
        'frameworks': ['phpunit', 'selenium'],
        'default_framework': 'phpunit'
    },
    '.cs': {
        'language': 'csharp', 
        'frameworks': ['nunit', 'selenium'],
        'default_framework': 'nunit'
    },
    '.swift': {
        'language': 'swift', 
        'frameworks': ['xctest'],
        'default_framework': 'xctest'
    },
    '.cpp': {
        'language': 'cpp', 
        'frameworks': ['gtest'],
        'default_framework': 'gtest'
    },
    '.c': {
        'language': 'c', 
        'frameworks': ['unity'],
        'default_framework': 'unity'
    },
    '.h': {
        'language': 'c', 
        'frameworks': ['unity'],
        'default_framework': 'unity'
    }
}

# Framework-specific configurations
FRAMEWORK_CONFIGS = {
    'selenium': {
        'type': 'automation',
        'description': 'Web automation testing with Selenium WebDriver',
        'file_extensions': ['.py', '.java', '.js', '.ts', '.cs', '.rb'],
        'imports': {
            'python': ['from selenium import webdriver', 'from selenium.webdriver.common.by import By', 'from selenium.webdriver.support.ui import WebDriverWait'],
            'java': ['import org.openqa.selenium.WebDriver;', 'import org.openqa.selenium.chrome.ChromeDriver;', 'import org.openqa.selenium.By;'],
            'javascript': ['const { Builder, By, until } = require("selenium-webdriver");'],
            'csharp': ['using OpenQA.Selenium;', 'using OpenQA.Selenium.Chrome;']
        }
    },
    'cypress': {
        'type': 'automation',
        'description': 'End-to-end testing with Cypress',
        'file_extensions': ['.js', '.ts'],
        'imports': {
            'javascript': ['/// <reference types="cypress" />'],
            'typescript': ['/// <reference types="cypress" />']
        }
    },
    'playwright': {
        'type': 'automation',
        'description': 'Cross-browser automation with Playwright',
        'file_extensions': ['.js', '.ts', '.py'],
        'imports': {
            'python': ['from playwright.sync_api import sync_playwright'],
            'javascript': ['const { test, expect } = require("@playwright/test");'],
            'typescript': ['import { test, expect } from "@playwright/test";']
        }
    },
    'pytest': {
        'type': 'unit',
        'description': 'Python unit testing with pytest',
        'file_extensions': ['.py'],
        'imports': {
            'python': ['import pytest']
        }
    },
    'jest': {
        'type': 'unit',
        'description': 'JavaScript unit testing with Jest',
        'file_extensions': ['.js', '.jsx', '.ts', '.tsx'],
        'imports': {
            'javascript': ['const { test, expect } = require("@jest/globals");'],
            'typescript': ['import { test, expect } from "@jest/globals";']
        }
    }
}

# Excluded patterns for file filtering
EXCLUDED_PATTERNS = [
    'test', 'spec', '__pycache__', 'node_modules', '.git', 
    'dist', 'build', 'coverage', '.pytest_cache', 'target',
    'bin', 'obj', '.vscode', '.idea', 'vendor'
]

# GitHub API settings
GITHUB_API_BASE = "https://api.github.com"
GITHUB_OAUTH_BASE = "https://github.com/login/oauth"

# OpenRouter API settings
OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"

# Rate limiting (tokens per request)
MAX_INPUT_TOKENS = 24000
MAX_FILES_PER_REQUEST = 5

# Session settings
SESSION_TIMEOUT_HOURS = 24

def get_ai_model_config(model_key: str = None) -> Dict:
    """Get AI model configuration"""
    if not model_key or model_key not in AI_MODELS:
        model_key = DEFAULT_AI_MODEL
    return AI_MODELS[model_key]

def get_language_config(file_path: str) -> Dict:
    """Get language and framework configuration for a file"""
    ext = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
    config = SUPPORTED_EXTENSIONS.get(ext, {'language': 'unknown', 'frameworks': ['generic'], 'default_framework': 'generic'})
    return {
        'language': config['language'],
        'framework': config['default_framework'],
        'available_frameworks': config['frameworks']
    }

def get_framework_config(framework: str) -> Dict:
    """Get configuration for a specific framework"""
    return FRAMEWORK_CONFIGS.get(framework, {
        'type': 'generic',
        'description': 'Generic testing framework',
        'file_extensions': [],
        'imports': {}
    })

def get_available_frameworks(file_path: str) -> List[str]:
    """Get all available frameworks for a file type"""
    ext = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
    config = SUPPORTED_EXTENSIONS.get(ext, {'frameworks': ['generic']})
    return config['frameworks']

def is_supported_file(file_path: str) -> bool:
    """Check if file is supported for test generation"""
    ext = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
    return ext in SUPPORTED_EXTENSIONS

def should_exclude_file(file_path: str) -> bool:
    """Check if file should be excluded from analysis"""
    path_lower = file_path.lower()
    return any(pattern in path_lower for pattern in EXCLUDED_PATTERNS)