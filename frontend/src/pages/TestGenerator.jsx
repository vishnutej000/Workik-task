import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  generateTestSuggestions, 
  generateTestCode, 
  createPullRequest,
  getFrameworksForFile 
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import FileSelector from '../components/FileSelector'
import FrameworkSelector from '../components/FrameworkSelector'
import TestSuggestions from '../components/TestSuggestions'
import CodeViewer from '../components/CodeViewer'
import { 
  TestTube, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  GitBranch,
  Code
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
      const data = await generateTestSuggestions(
        repoData.repoUrl,
        selectedFiles,
        selectedFramework
      )
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
      const data = await generateTestCode(
        repoData.repoUrl,
        suggestion.id,
        suggestion.summary,
        selectedFiles,
        selectedFramework
      )
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
          <FileSelector
            files={repoData.files}
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
          />

          {/* Framework Selection */}
          <FrameworkSelector
            frameworks={availableFrameworks}
            selectedFramework={selectedFramework}
            onFrameworkChange={setSelectedFramework}
          />

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
            <TestSuggestions
              suggestions={suggestions}
              selectedSuggestion={selectedSuggestion}
              onGenerateCode={handleGenerateCode}
              loading={loadingCode}
            />
          )}

          {/* Generated Code */}
          {generatedCode && (
            <div className="space-y-4">
              <CodeViewer
                code={generatedCode.test_code}
                filename={generatedCode.suggested_filename}
                language={generatedCode.language}
                framework={generatedCode.framework}
              />

              {/* Create PR Button */}
              {isAuthenticated && (
                <div className="flex justify-end">
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