import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ENV } from '../config/env'
import axios from 'axios'
import { AlertCircle, CheckCircle, Loader2, Bug } from 'lucide-react'

const ApiDebugger = () => {
  const { sessionToken, isAuthenticated } = useAuth()
  const [results, setResults] = useState({})
  const [testing, setTesting] = useState(false)

  const testEndpoint = async (name, endpoint, method = 'GET', data = null) => {
    setResults(prev => ({ ...prev, [name]: { status: 'testing' } }))
    
    try {
      const config = {
        method,
        url: `${ENV.API_BASE_URL}${endpoint}`,
        headers: {}
      }
      
      if (sessionToken) {
        config.headers.Authorization = `Bearer ${sessionToken}`
      }
      
      if (data) {
        config.data = data
        config.headers['Content-Type'] = 'application/json'
      }
      
      const response = await axios(config)
      
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'success',
          code: response.status,
          data: response.data
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'error',
          code: error.response?.status || 'Network Error',
          error: error.response?.data?.detail || error.message
        }
      }))
    }
  }

  const runAllTests = async () => {
    setTesting(true)
    setResults({})
    
    // Test basic endpoints
    await testEndpoint('Health Check', '/health')
    await testEndpoint('Frameworks', '/frameworks')
    await testEndpoint('AI Test', '/debug/ai-test')
    
    if (isAuthenticated) {
      await testEndpoint('User Info', '/auth/user')
      await testEndpoint('Repositories', '/repositories')
      
      // Test with dummy data
      await testEndpoint('Generate Suggestions', '/generate-test-suggestions', 'POST', {
        files: ['test.py'],
        repo_full_name: 'test/repo'
      })
    } else {
      await testEndpoint('Analyze Repo', '/repo/analyze', 'POST', {
        repo_url: 'https://github.com/octocat/Hello-World'
      })
    }
    
    setTesting(false)
  }

  const getStatusIcon = (result) => {
    if (result.status === 'testing') return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
    if (result.status === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />
    return <AlertCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = (result) => {
    if (result.status === 'testing') return 'border-blue-200 bg-blue-50'
    if (result.status === 'success') return 'border-green-200 bg-green-50'
    return 'border-red-200 bg-red-50'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bug className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">API Debugger</h3>
        </div>
        <button
          onClick={runAllTests}
          disabled={testing}
          className="btn-secondary text-sm"
        >
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <span className="font-medium">API Base URL:</span> {ENV.API_BASE_URL}
        </div>
        <div className="text-sm">
          <span className="font-medium">Authentication:</span> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </div>
        <div className="text-sm">
          <span className="font-medium">Session Token:</span> {sessionToken ? '✅ Present' : '❌ Missing'}
        </div>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Test Results:</h4>
          {Object.entries(results).map(([name, result]) => (
            <div key={name} className={`p-3 border rounded-lg ${getStatusColor(result)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result)}
                  <span className="font-medium">{name}</span>
                </div>
                <span className="text-sm font-mono">
                  {result.code}
                </span>
              </div>
              {result.error && (
                <div className="mt-2 text-sm text-red-700">
                  {result.error}
                </div>
              )}
              {result.data && result.status === 'success' && (
                <div className="mt-2 text-xs text-gray-600">
                  Response: {typeof result.data === 'object' ? JSON.stringify(result.data).substring(0, 100) + '...' : result.data}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ApiDebugger