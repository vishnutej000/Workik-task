import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeRepository } from '../services/api'
import { ENV } from '../config/env'
import { Github, Search, FileCode, Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react'

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
    console.log('🚀 Generate Tests button clicked!')
    console.log('📊 repoData:', repoData)
    
    if (repoData) {
      // Store repo data in sessionStorage for the next page
      const dataToStore = {
        repoUrl,
        ...repoData,
        generateMode: 'selective' // Individual file selection mode
      }
      console.log('💾 Storing data in sessionStorage:', dataToStore)
      sessionStorage.setItem('repoData', JSON.stringify(dataToStore))
      
      console.log('🔄 Navigating to /generate...')
      // Force navigation using window.location for reliability
      window.location.href = '/generate'
    } else {
      console.log('❌ No repoData available!')
    }
  }

  const handleGenerateAllTests = () => {
    console.log('🚀 Generate All Tests button clicked!')
    console.log('📊 repoData:', repoData)
    
    if (repoData) {
      // Store repo data in sessionStorage for the next page with all files pre-selected
      const dataToStore = {
        repoUrl,
        ...repoData,
        generateMode: 'all', // Whole repository mode
        preSelectedFiles: repoData.files.map(file => file.path) // Pre-select all files
      }
      console.log('💾 Storing data in sessionStorage for whole repo:', dataToStore)
      sessionStorage.setItem('repoData', JSON.stringify(dataToStore))
      
      console.log('🔄 Navigating to /generate for whole repository...')
      // Force navigation using window.location for reliability
      window.location.href = '/generate'
    } else {
      console.log('❌ No repoData available!')
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
        <Github className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--gh-accent-secondary)' }} />
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--gh-text-primary)' }}>
          Repository Analyzer
        </h1>
        <p style={{ color: 'var(--gh-text-secondary)' }}>
          Enter a GitHub repository URL to analyze its code files and generate test cases
        </p>
      </div>

      {/* Repository URL Input */}
      <div className="card mb-8">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label htmlFor="repoUrl" className="block text-sm font-medium mb-2" style={{ color: 'var(--gh-text-primary)' }}>
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
            <p className="text-sm mt-1" style={{ color: 'var(--gh-text-tertiary)' }}>
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
        <div className="card mb-8 status-error">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" style={{ color: 'var(--gh-accent-danger)' }} />
            <p style={{ color: 'var(--gh-accent-danger)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Repository Analysis Results */}
      {repoData && (
        <div className="space-y-6">
          {/* Repository Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--gh-text-primary)' }}>Repository Information</h2>
              <CheckCircle className="h-6 w-6" style={{ color: 'var(--gh-accent-primary)' }} />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium" style={{ color: 'var(--gh-text-primary)' }}>{repoData.repository.full_name}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--gh-text-secondary)' }}>
                  {repoData.repository.description || 'No description available'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm" style={{ color: 'var(--gh-text-tertiary)' }}>Language:</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--gh-text-primary)' }}>
                    {repoData.repository.language || 'Multiple'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm" style={{ color: 'var(--gh-text-tertiary)' }}>Files Found:</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--gh-text-primary)' }}>
                    {repoData.total_files} code files
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm" style={{ color: 'var(--gh-text-tertiary)' }}>Visibility:</span>
                  <span className="text-sm font-medium" style={{ 
                    color: repoData.repository.private ? 'var(--gh-accent-warning)' : 'var(--gh-accent-primary)' 
                  }}>
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
                className="text-sm font-medium"
                style={{ color: 'var(--gh-accent-secondary)' }}
              >
                View on GitHub →
              </a>
            </div>
          </div>

          {/* Files Preview */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--gh-text-primary)' }}>Code Files</h2>
              <span className="text-sm" style={{ color: 'var(--gh-text-tertiary)' }}>
                {repoData.files.length} files found
              </span>
            </div>

            {repoData.files.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {repoData.files.slice(0, 20).map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 rounded file-tree-item"
                  >
                    <FileCode className="h-4 w-4" style={{ color: 'var(--gh-text-tertiary)' }} />
                    <span className="text-sm font-mono" style={{ color: 'var(--gh-text-primary)' }}>{file.path}</span>
                    {file.size && (
                      <span className="text-xs ml-auto" style={{ color: 'var(--gh-text-tertiary)' }}>
                        {(file.size / 1024).toFixed(1)}KB
                      </span>
                    )}
                  </div>
                ))}
                {repoData.files.length > 20 && (
                  <p className="text-sm text-center py-2" style={{ color: 'var(--gh-text-tertiary)' }}>
                    ... and {repoData.files.length - 20} more files
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileCode className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--gh-text-tertiary)' }} />
                <p style={{ color: 'var(--gh-text-tertiary)' }}>No code files found in this repository</p>
              </div>
            )}
          </div>

          {/* Generate Tests Buttons */}
          {repoData.files.length > 0 && (
            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {/* Individual File Selection */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleGenerateTests()
                  }}
                  className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
                >
                  <Search className="h-5 w-5" />
                  <span>Generate Tests</span>
                </button>

                {/* Whole Repository */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleGenerateAllTests()
                  }}
                  className="btn-secondary text-lg px-8 py-3 inline-flex items-center space-x-2"
                  style={{ 
                    backgroundColor: 'var(--gh-accent-secondary)', 
                    color: 'white',
                    borderColor: 'var(--gh-accent-secondary)'
                  }}
                >
                  <Zap className="h-5 w-5" />
                  <span>Generate All Tests</span>
                </button>
              </div>
              
              <div className="text-sm" style={{ color: 'var(--gh-text-tertiary)' }}>
                <p>
                  <strong>Generate Tests:</strong> Select individual files to test • 
                  <strong> Generate All Tests:</strong> Create tests for entire repository ({repoData.files.length} files)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 card" style={{ backgroundColor: 'rgba(47, 129, 247, 0.1)', borderColor: 'var(--gh-accent-secondary)' }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--gh-text-primary)' }}>
          How to use Repository Analyzer
        </h3>
        <ul className="space-y-2" style={{ color: 'var(--gh-text-secondary)' }}>
          <li className="flex items-start space-x-2">
            <span className="mt-1" style={{ color: 'var(--gh-accent-secondary)' }}>•</span>
            <span>Enter any public GitHub repository URL</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="mt-1" style={{ color: 'var(--gh-accent-secondary)' }}>•</span>
            <span>The system will automatically discover and filter code files</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="mt-1" style={{ color: 'var(--gh-accent-secondary)' }}>•</span>
            <span>Supported file types: .py, .js, .jsx, .ts, .tsx, .java, .go, .rb, and more</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="mt-1" style={{ color: 'var(--gh-accent-secondary)' }}>•</span>
            <span>Choose "Generate Tests" for individual file selection or "Generate All Tests" for entire repository</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="mt-1" style={{ color: 'var(--gh-accent-secondary)' }}>•</span>
            <span>For private repositories, use the OAuth login feature</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default RepoAnalyzer