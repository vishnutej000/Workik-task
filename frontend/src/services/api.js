import axios from 'axios'
import { ENV } from '../config/env'

// Create axios instance
const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 120000, // 2 minutes - AI calls can take longer
})

// Debug API configuration
console.log('🔧 API Configuration:')
console.log('  Base URL:', ENV.API_BASE_URL)
console.log('  Timeout:', 30000)

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sessionToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('🔒 Authentication failed - clearing session')
      localStorage.removeItem('sessionToken')
      delete axios.defaults.headers.common['Authorization']
      
      // Only redirect if not already on home page
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    
    return Promise.reject(error)
  }
)

// Direct Repository Analysis (No OAuth required)
export const analyzeRepository = async (repoUrl) => {
  const response = await api.post(ENV.ENDPOINTS.ANALYZE, { repo_url: repoUrl })
  return response.data
}

export const generateTestSuggestions = async (repoUrl, files, framework = null) => {
  console.log('🚀 Starting test suggestion generation...')
  console.log('📝 Request payload:', { repo_url: repoUrl, files, framework })
  
  // Try multiple endpoints in order of preference
  const endpoints = [
    '/repo/generate-suggestions',
    '/repo/force-suggestions', 
    '/repo/generate-suggestions-debug'
  ]
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i]
    try {
      console.log(`🔄 Trying endpoint ${i + 1}/${endpoints.length}: ${endpoint}`)
      
      const response = await api.post(endpoint, {
        repo_url: repoUrl,
        files,
        framework
      })
      
      console.log(`✅ Endpoint ${endpoint} succeeded:`, response.data)
      
      // Validate response has suggestions
      if (response.data && response.data.suggestions && Array.isArray(response.data.suggestions)) {
        console.log(`🎉 Got ${response.data.suggestions.length} suggestions from ${endpoint}`)
        return response.data
      } else {
        console.log(`⚠️ Invalid response format from ${endpoint}, trying next...`)
        continue
      }
      
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} failed:`, error.message)
      if (i === endpoints.length - 1) {
        console.log('❌ All endpoints failed, using emergency fallback')
        break
      }
    }
  }
  
  // GUARANTEED Emergency fallback - this CANNOT fail
  console.log('🆘 Using emergency fallback suggestions')
  const fileName = files[0] || 'code'
  const fileBaseName = fileName.split('/').pop()
  const detectedFramework = framework || 'pytest'
  
  return {
    repository: repoUrl.split('/').slice(-2).join('/'),
    framework: detectedFramework,
    suggestions: [
      {
        id: 1,
        summary: `Test core functionality and return values in ${fileBaseName}`,
        framework: detectedFramework
      },
      {
        id: 2,
        summary: `Test error handling and exception scenarios in ${fileBaseName}`,
        framework: detectedFramework
      },
      {
        id: 3,
        summary: `Test input validation and edge cases in ${fileBaseName}`,
        framework: detectedFramework
      },
      {
        id: 4,
        summary: `Test integration and dependency handling in ${fileBaseName}`,
        framework: detectedFramework
      },
      {
        id: 5,
        summary: `Test performance and resource usage in ${fileBaseName}`,
        framework: detectedFramework
      }
    ],
    files_analyzed: files,
    emergency_fallback: true,
    guaranteed: true
  }
}

export const generateTestCode = async (repoUrl, suggestionId, suggestionSummary, files, framework = null) => {
  const response = await api.post('/repo/generate-code', {
    repo_url: repoUrl,
    suggestion_id: suggestionId,
    suggestion_summary: suggestionSummary,
    files,
    framework
  })
  return response.data
}

// OAuth-based Repository Access
export const getRepositories = async () => {
  const response = await api.get(ENV.ENDPOINTS.REPOSITORIES)
  return response.data
}

export const getRepositoryFiles = async (owner, repo) => {
  const response = await api.get(`${ENV.ENDPOINTS.REPOSITORIES}/${owner}/${repo}/files`)
  return response.data
}

export const generateSuggestionsOAuth = async (files, repoFullName, framework = null) => {
  try {
    console.log('🔐 Using OAuth endpoint for authenticated user...')
    console.log('📝 OAuth Request:', { files, repo_full_name: repoFullName, framework })
    
    // Try the OAuth endpoint first
    const response = await api.post('/generate-test-suggestions', {
      files,
      repo_full_name: repoFullName,
      framework
    })
    
    console.log('✅ OAuth endpoint success:', response.data)
    
    // Validate response
    if (response.data && response.data.suggestions && Array.isArray(response.data.suggestions)) {
      return response.data
    } else {
      throw new Error('Invalid OAuth response format')
    }
    
  } catch (error) {
    console.error('❌ OAuth endpoint failed:', error)
    console.log('🔄 Falling back to direct endpoint...')
    
    // Fallback to direct endpoint using repo URL
    const repoUrl = `https://github.com/${repoFullName}`
    return await generateTestSuggestions(repoUrl, files, framework)
  }
}

export const generateCodeOAuth = async (suggestionId, suggestionSummary, files, repoFullName, framework = null) => {
  try {
    console.log('🔐 Using OAuth endpoint for code generation...')
    console.log('📝 OAuth Code Request:', { suggestion_id: suggestionId, suggestion_summary: suggestionSummary, files, repo_full_name: repoFullName, framework })
    
    const response = await api.post(ENV.ENDPOINTS.GENERATE_CODE, {
      suggestion_id: suggestionId,
      suggestion_summary: suggestionSummary,
      files,
      repo_full_name: repoFullName,
      framework
    })
    
    console.log('✅ OAuth code endpoint success:', response.data)
    return response.data
    
  } catch (error) {
    console.error('❌ OAuth code endpoint failed:', error)
    console.log('🔄 Falling back to direct endpoint...')
    
    // Fallback to direct endpoint using repo URL
    const repoUrl = `https://github.com/${repoFullName}`
    return await generateTestCode(repoUrl, suggestionId, suggestionSummary, files, framework)
  }
}

// Pull Request Creation
export const createPullRequest = async (repoFullName, testCode, testFileName, branchName, commitMessage) => {
  const response = await api.post(ENV.ENDPOINTS.CREATE_PR, {
    repo_full_name: repoFullName,
    test_code: testCode,
    test_file_name: testFileName,
    branch_name: branchName,
    commit_message: commitMessage
  })
  return response.data
}

// Get available frameworks
export const getFrameworks = async () => {
  const response = await api.get(ENV.ENDPOINTS.FRAMEWORKS)
  return response.data
}

export const getFrameworksForFile = async (filePath) => {
  const response = await api.get(`${ENV.ENDPOINTS.FRAMEWORKS}/${filePath}`)
  return response.data
}

// Test endpoint for debugging
export const testSimpleSuggestions = async () => {
  try {
    const response = await api.get('/test/simple-suggestions')
    console.log('🧪 Test endpoint response:', response.data)
    return response.data
  } catch (error) {
    console.error('🧪 Test endpoint failed:', error)
    // Return guaranteed fallback
    return {
      repository: "test/simple",
      framework: "pytest",
      suggestions: [
        { id: 1, summary: "Test basic functionality", framework: "pytest" },
        { id: 2, summary: "Test error handling", framework: "pytest" },
        { id: 3, summary: "Test edge cases", framework: "pytest" }
      ],
      files_analyzed: ["test.py"],
      test: true
    }
  }
}

export default api