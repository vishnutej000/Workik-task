import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  generateTestSuggestions, 
  generateTestCode, 
  createPullRequest,
  getFrameworksForFile 
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ENV } from '../config/env'
import { CONSTANTS } from '../config/constants'
import { 
  TestTube, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  GitBranch,
  Code,
  FileText,
  CheckSquare,
  Square,
  Copy,
  Download
} from 'lucide-react'

const TestGenerator = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  // Repository data
  const [repoData, setRepoData] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedFramework, setSelectedFramework] = useState('')
  const [availableFrameworks, setAvailableFrameworks] = useState([])
  
  // Test generation states
  const [suggestions, setSuggestions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const [generatedCode, setGeneratedCode] = useState(null)
  
  // Loading states
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [loadingCode, setLoadingCode] = useState(false)
  const [creatingPR, setCreatingPR] = useState(false)
  
  // Error states
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load repository data on component mount
  useEffect(() => {
    const storedData = sessionStorage.getItem('repoData')
    if (storedData) {
      const data = JSON.parse(storedData)
      setRepoData(data)
    } else {
      navigate('/analyze')
    }
  }, [navigate])

  // Update available frameworks when files are selected
  useEffect(() => {
    const updateFrameworks = async () => {
      if (selectedFiles.length > 0) {
        try {
          const response = await getFrameworksForFile(selectedFiles[0])
          setAvailableFrameworks(response.available_frameworks || [])
          setSelectedFramework(response.default_framework || '')
        } catch (err) {
          console.error('Failed to get frameworks:', err)
          // Fallback frameworks
          setAvailableFrameworks(['selenium', 'jest', 'pytest', 'junit'])
          setSelectedFramework('selenium')
        }
      }
    }

    updateFrameworks()
  }, [selectedFiles])

  const handleGenerateSuggestions = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file')
      return
    }

    setLoadingSuggestions(true)
    setError('')
    setSuggestions([])
    setSelectedSuggestion(null)
    setGeneratedCode(null)

    try {
      let data
      if (isAuthenticated && repoData.repository?.full_name) {
        // Use OAuth endpoint for authenticated users with repository access
        const { generateSuggestionsOAuth } = await import('../services/api')
        data = await generateSuggestionsOAuth(
          selectedFiles,
          repoData.repository.full_name,
          selectedFramework
        )
      } else {
        // Use direct endpoint for public repository analysis
        data = await generateTestSuggestions(
          repoData.repoUrl,
          selectedFiles,
          selectedFramework
        )
      }
      setSuggestions(data.suggestions || [])
      setSuccess(`Generated ${data.suggestions?.length || 0} test suggestions`)
    } catch (err) {
      console.error('Failed to generate suggestions:', err)
      setError(
        err.response?.data?.detail || 
        'Failed to generate test suggestions. Please try again.'
      )
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleGenerateCode = async (suggestion) => {
    setLoadingCode(true)
    setError('')
    setGeneratedCode(null)
    setSelectedSuggestion(suggestion)

    try {
      let data
      if (isAuthenticated && repoData.repository?.full_name) {
        // Use OAuth endpoint for authenticated users with repository access
        const { generateCodeOAuth } = await import('../services/api')
        data = await generateCodeOAuth(
          suggestion.id,
          suggestion.summary,
          selectedFiles,
          repoData.repository.full_name,
          selectedFramework
        )
      } else {
        // Use direct endpoint for public repository analysis
        data = await generateTestCode(
          repoData.repoUrl,
          suggestion.id,
          suggestion.summary,
          selectedFiles,
          selectedFramework
        )
      }
      setGeneratedCode(data)
      setSuccess('Test code generated successfully!')
    } catch (err) {
      console.error('Failed to generate code:', err)
      setError(
        err.response?.data?.detail || 
        'Failed to generate test code. Please try again.'
      )
    } finally {
      setLoadingCode(false)
    }
  }

  const handleCreatePR = async () => {
    if (!generatedCode || !isAuthenticated) {
      setError('Authentication required to create pull requests')
      return
    }

    if (!repoData.repository?.full_name) {
      setError('Pull requests can only be created for authenticated repository access')
      return
    }

    setCreatingPR(true)
    setError('')

    try {
      const branchName = `testgen/${generatedCode.suggested_filename.replace(/\./g, '-')}-${Date.now()}`
      const commitMessage = `Add ${generatedCode.suggested_filename}\n\nGenerated test for: ${selectedSuggestion.summary}`

      const prData = await createPullRequest(
        repoData.repository.full_name,
        generatedCode.test_code,
        generatedCode.suggested_filename,
        branchName,
        commitMessage
      )

      setSuccess(
        <div>
          Pull request created successfully! 
          <a 
            href={prData.pr_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 ml-1 underline"
          >
            View PR #{prData.pr_number}
          </a>
        </div>
      )
    } catch (err) {
      console.error('Failed to create PR:', err)
      setError(
        err.response?.data?.detail || 
        'Failed to create pull request. Please try again.'
      )
    } finally {
      setCreatingPR(false)
    }
  }

  if (!repoData) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading repository data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/analyze')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Analyzer</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Generator</h1>
            <p className="text-gray-600">{repoData.repository.full_name}</p>
          </div>
        </div>
        <TestTube className="h-8 w-8 text-blue-600" />
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="text-green-800">{success}</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - File Selection & Framework */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Files ({selectedFiles.length} selected)
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {repoData.files?.slice(0, 20).map((file) => (
                <div
                  key={file.path}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => {
                    const isSelected = selectedFiles.includes(file.path)
                    if (isSelected) {
                      setSelectedFiles(selectedFiles.filter(f => f !== file.path))
                    } else {
                      setSelectedFiles([...selectedFiles, file.path])
                    }
                  }}
                >
                  {selectedFiles.includes(file.path) ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 truncate">
                    {file.path}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Framework Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Testing Framework
            </h3>
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableFrameworks.map((framework) => (
                <option key={framework} value={framework}>
                  {framework.charAt(0).toUpperCase() + framework.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Suggestions Button */}
          <button
            onClick={handleGenerateSuggestions}
            disabled={loadingSuggestions || selectedFiles.length === 0}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loadingSuggestions ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <TestTube className="h-5 w-5" />
                <span>Generate Test Suggestions</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column - Suggestions & Code */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Suggestions */}
          {suggestions.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Test Suggestions ({suggestions.length})
              </h3>
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSuggestion?.id === suggestion.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          Test Case {suggestion.id}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {suggestion.summary}
                        </p>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {suggestion.framework}
                        </span>
                      </div>
                      <button
                        onClick={() => handleGenerateCode(suggestion)}
                        disabled={loadingCode}
                        className="btn-primary text-sm ml-4"
                      >
                        {loadingCode && selectedSuggestion?.id === suggestion.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Generate Code'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Code */}
          {generatedCode && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generated Test Code
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedCode.test_code)}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedCode.test_code], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = generatedCode.suggested_filename
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-100 px-3 py-2 rounded-t border-b">
                <span className="text-sm font-mono text-gray-700">
                  {generatedCode.suggested_filename}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({generatedCode.framework} • {generatedCode.language})
                </span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-b max-h-96 overflow-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {generatedCode.test_code}
                </pre>
              </div>

              {/* Create PR Button */}
              {isAuthenticated && (
                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleCreatePR}
                    disabled={creatingPR}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {creatingPR ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Creating PR...</span>
                      </>
                    ) : (
                      <>
                        <GitBranch className="h-5 w-5" />
                        <span>Create Pull Request</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {!isAuthenticated && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Login with GitHub to create pull requests with generated test code.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {suggestions.length === 0 && !loadingSuggestions && (
            <div className="card text-center py-12">
              <Code className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Generate Tests
              </h3>
              <p className="text-gray-600">
                Select files and click "Generate Test Suggestions" to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestGenerator