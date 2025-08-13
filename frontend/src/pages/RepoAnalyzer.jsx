import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeRepository } from '../services/api'
import { ENV } from '../config/env'
import { Github, Search, FileCode, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const RepoAnalyzer = () => {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [repoData, setRepoData] = useState(null)
  const navigate = useNavigate()

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL')
      return
    }

    setLoading(true)
    setError('')
    setRepoData(null)

    try {
      const data = await analyzeRepository(repoUrl.trim())
      setRepoData(data)
    } catch (err) {
      console.error('Analysis failed:', err)
      setError(
        err.response?.data?.detail || 
        'Failed to analyze repository. Please check the URL and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTests = () => {
    if (repoData) {
      // Store repo data in sessionStorage for the next page
      sessionStorage.setItem('repoData', JSON.stringify({
        repoUrl,
        ...repoData
      }))
      navigate('/generate')
    }
  }

  const formatRepoUrl = (url) => {
    // Clean up common URL formats
    return url
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/\.git$/, '')
      .trim()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Github className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Repository Analyzer
        </h1>
        <p className="text-gray-600">
          Enter a GitHub repository URL to analyze its code files and generate test cases
        </p>
      </div>

      {/* Repository URL Input */}
      <div className="card mb-8">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Repository URL
            </label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo or owner/repo"
                className="input-field pl-10"
                disabled={loading}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Supports formats: owner/repo, github.com/owner/repo, or full GitHub URLs
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !repoUrl.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing Repository...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Analyze Repository</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Repository Analysis Results */}
      {repoData && (
        <div className="space-y-6">
          {/* Repository Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Repository Information</h2>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">{repoData.repository.full_name}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {repoData.repository.description || 'No description available'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Language:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {repoData.repository.language || 'Multiple'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Files Found:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {repoData.total_files} code files
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Visibility:</span>
                  <span className={`text-sm font-medium ${
                    repoData.repository.private ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {repoData.repository.private ? 'Private' : 'Public'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <a
                href={repoData.repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View on GitHub →
              </a>
            </div>
          </div>

          {/* Files Preview */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Code Files</h2>
              <span className="text-sm text-gray-500">
                {repoData.files.length} files found
              </span>
            </div>

            {repoData.files.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {repoData.files.slice(0, 20).map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <FileCode className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-mono text-gray-900">{file.path}</span>
                    {file.size && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {(file.size / 1024).toFixed(1)}KB
                      </span>
                    )}
                  </div>
                ))}
                {repoData.files.length > 20 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    ... and {repoData.files.length - 20} more files
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No code files found in this repository</p>
              </div>
            )}
          </div>

          {/* Generate Tests Button */}
          {repoData.files.length > 0 && (
            <div className="text-center">
              <button
                onClick={handleGenerateTests}
                className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Generate Test Cases</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          How to use Repository Analyzer
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Enter any public GitHub repository URL</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>The system will automatically discover and filter code files</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Supported file types: .py, .js, .jsx, .ts, .tsx, .java, .go, .rb, and more</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>For private repositories, use the OAuth login feature</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default RepoAnalyzer