import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

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
    if (error.response?.status === 401) {
      localStorage.removeItem('sessionToken')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Direct Repository Analysis (No OAuth required)
export const analyzeRepository = async (repoUrl) => {
  const response = await api.post('/repo/analyze', { repo_url: repoUrl })
  return response.data
}

export const generateTestSuggestions = async (repoUrl, files, framework = null) => {
  const response = await api.post('/repo/generate-suggestions', {
    repo_url: repoUrl,
    files,
    framework
  })
  return response.data
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
  const response = await api.get('/repositories')
  return response.data
}

export const getRepositoryFiles = async (owner, repo) => {
  const response = await api.get(`/repositories/${owner}/${repo}/files`)
  return response.data
}

export const generateSuggestionsOAuth = async (files, repoFullName, framework = null) => {
  const response = await api.post('/generate-test-suggestions', {
    files,
    repo_full_name: repoFullName,
    framework
  })
  return response.data
}

export const generateCodeOAuth = async (suggestionId, suggestionSummary, files, repoFullName, framework = null) => {
  const response = await api.post('/generate-test-code', {
    suggestion_id: suggestionId,
    suggestion_summary: suggestionSummary,
    files,
    repo_full_name: repoFullName,
    framework
  })
  return response.data
}

// Pull Request Creation
export const createPullRequest = async (repoFullName, testCode, testFileName, branchName, commitMessage) => {
  const response = await api.post('/create-pull-request', {
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
  const response = await api.get('/frameworks')
  return response.data
}

export const getFrameworksForFile = async (filePath) => {
  const response = await api.get(`/frameworks/${filePath}`)
  return response.data
}

export default api