import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ENV } from '../config/env'
import { CONSTANTS } from '../config/constants'
import SystemMonitor from '../components/SystemMonitor'
import { 
  Github, 
  GitBranch, 
  Star, 
  Lock, 
  Unlock, 
  Calendar,
  Code,
  Settings,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckSquare,
  Square,
  Zap
} from 'lucide-react'
import axios from 'axios'

const Dashboard = () => {
  const { user, sessionToken } = useAuth()
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // State for inline test generation
  const [expandedRepo, setExpandedRepo] = useState(null)
  const [repoFiles, setRepoFiles] = useState({})
  const [selectedFiles, setSelectedFiles] = useState({})
  const [testSuggestions, setTestSuggestions] = useState({})
  const [loadingStates, setLoadingStates] = useState({})

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!sessionToken) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      try {
        console.log('📡 Fetching repositories...')
        const response = await axios.get(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.REPOSITORIES}`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        })
        
        console.log('✅ Repositories fetched:', response.data.length)
        setRepositories(response.data)
      } catch (err) {
        console.error('❌ Failed to fetch repositories:', err)
        setError(err.response?.data?.detail || 'Failed to fetch repositories')
      } finally {
        setLoading(false)
      }
    }

    fetchRepositories()
  }, [sessionToken])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getLanguageColor = (language) => {
    return CONSTANTS.LANGUAGE_COLORS[language] || CONSTANTS.LANGUAGE_COLORS.DEFAULT
  }

  // Render files in a simple tree-like structure for selection
  const renderFileList = (files, selected, repoKey) => {
    // Group files by directory
    const grouped = {}
    files.forEach(file => {
      const parts = file.path.split('/')
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root'
      if (!grouped[dir]) grouped[dir] = []
      grouped[dir].push(file)
    })

    return Object.entries(grouped)
      .sort(([a], [b]) => a === 'root' ? -1 : b === 'root' ? 1 : a.localeCompare(b))
      .map(([dir, dirFiles]) => (
        <div key={dir}>
          {dir !== 'root' && (
            <div className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-50 rounded">
              📁 {dir}
            </div>
          )}
          {dirFiles.map(file => (
            <div
              key={file.path}
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer ml-2"
              onClick={() => toggleFileSelection(repoKey, file.path)}
            >
              {selected.includes(file.path) ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 truncate">
                {file.path.split('/').pop()}
              </span>
            </div>
          ))}
        </div>
      ))
  }

  // Fetch repository files
  const fetchRepoFiles = async (repo) => {
    const repoKey = repo.full_name
    
    if (repoFiles[repoKey]) {
      return // Already fetched
    }

    setLoadingStates(prev => ({ ...prev, [repoKey]: 'files' }))

    try {
      const [owner, repoName] = repo.full_name.split('/')
      const response = await axios.get(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.REPOSITORIES}/${owner}/${repoName}/files`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      
      setRepoFiles(prev => ({ ...prev, [repoKey]: response.data }))
      setSelectedFiles(prev => ({ ...prev, [repoKey]: [] }))
    } catch (err) {
      console.error('Failed to fetch files:', err)
      setError(`Failed to fetch files for ${repo.name}`)
    } finally {
      setLoadingStates(prev => ({ ...prev, [repoKey]: null }))
    }
  }

  // Toggle repository expansion
  const toggleRepoExpansion = async (repo) => {
    const repoKey = repo.full_name
    setError('') // Clear any previous errors
    
    if (expandedRepo === repoKey) {
      setExpandedRepo(null)
    } else {
      setExpandedRepo(repoKey)
      await fetchRepoFiles(repo)
    }
  }

  // Toggle file selection
  const toggleFileSelection = (repoKey, filePath) => {
    setSelectedFiles(prev => {
      const currentFiles = prev[repoKey] || []
      const isSelected = currentFiles.includes(filePath)
      
      if (isSelected) {
        return { ...prev, [repoKey]: currentFiles.filter(f => f !== filePath) }
      } else {
        return { ...prev, [repoKey]: [...currentFiles, filePath] }
      }
    })
  }

  // Generate test suggestions
  const generateTestSuggestions = async (repo) => {
    const repoKey = repo.full_name
    const files = selectedFiles[repoKey] || []
    setError('') // Clear any previous errors
    
    if (files.length === 0) {
      setError('Please select at least one file to generate tests')
      return
    }

    setLoadingStates(prev => ({ ...prev, [repoKey]: 'generating' }))

    try {
      const response = await axios.post(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.GENERATE_SUGGESTIONS}`, {
        files: files,
        repo_full_name: repo.full_name
      }, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      
      setTestSuggestions(prev => ({ ...prev, [repoKey]: response.data }))
    } catch (err) {
      console.error('Failed to generate test suggestions:', err)
      setError(err.response?.data?.detail || 'Failed to generate test suggestions')
    } finally {
      setLoadingStates(prev => ({ ...prev, [repoKey]: null }))
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Your Repositories
          </h2>
          <p className="text-gray-600">
            Fetching your GitHub repositories...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Repositories
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <img
            src={user?.avatar_url}
            alt={user?.name || user?.login}
            className="h-12 w-12 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.name || user?.login}'s Repositories
            </h1>
            <p className="text-gray-600">
              {repositories.length} repositories found
            </p>
          </div>
        </div>
        
        <Link
          to="/analyze"
          className="btn-secondary inline-flex items-center space-x-2"
        >
          <Code className="h-4 w-4" />
          <span>Analyze Public Repo</span>
        </Link>
      </div>

      {/* Repository Grid */}
      {repositories.length === 0 ? (
        <div className="text-center py-16">
          <Github className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Repositories Found
          </h3>
          <p className="text-gray-600 mb-6">
            It looks like you don't have any repositories yet.
          </p>
          <a
            href="https://github.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Github className="h-4 w-4" />
            <span>Create Repository on GitHub</span>
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {repositories.map((repo) => {
            const repoKey = repo.full_name
            const isExpanded = expandedRepo === repoKey
            const files = repoFiles[repoKey] || []
            const selected = selectedFiles[repoKey] || []
            const suggestions = testSuggestions[repoKey] || []
            const loadingState = loadingStates[repoKey]

            return (
              <div key={repo.id} className="card hover:shadow-md transition-shadow">
                {/* Repository Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {repo.private ? (
                      <Lock className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-green-500" />
                    )}
                    <h3 className="font-semibold text-gray-900 truncate">
                      {repo.name}
                    </h3>
                  </div>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </div>

                {repo.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {repo.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-4">
                  {repo.language && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLanguageColor(repo.language)}`}>
                      {repo.language}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {repo.private ? 'Private' : 'Public'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-4">
                  <button
                    onClick={() => toggleRepoExpansion(repo)}
                    className="btn-primary text-sm inline-flex items-center space-x-1"
                    disabled={loadingState === 'files'}
                  >
                    {loadingState === 'files' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Settings className="h-3 w-3" />
                    )}
                    <span>Generate Tests</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/repository/${repo.full_name.replace('/', '%2F')}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 pt-4">
                    {/* File Selection */}
                    {files.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Select files to analyze ({selected.length} selected):
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {renderFileList(files.slice(0, CONSTANTS.UI.MAX_FILES_TO_SHOW), selected, repoKey)}
                          {files.length > CONSTANTS.UI.MAX_FILES_TO_SHOW && (
                            <p className="text-xs text-gray-500 p-2">
                              ... and {files.length - CONSTANTS.UI.MAX_FILES_TO_SHOW} more files
                            </p>
                          )}
                        </div>
                        
                        {selected.length > 0 && (
                          <button
                            onClick={() => generateTestSuggestions(repo)}
                            className="mt-3 btn-secondary text-sm inline-flex items-center space-x-1"
                            disabled={loadingState === 'generating'}
                          >
                            {loadingState === 'generating' ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
                            )}
                            <span>
                              {loadingState === 'generating' 
                                ? 'Generating...' 
                                : `Generate Tests for ${selected.length} files`
                              }
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Test Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-900 mb-3">
                          🎉 Test Suggestions Generated:
                        </h4>
                        <div className="space-y-2">
                          {suggestions.map((suggestion, index) => (
                            <div key={suggestion.id || index} className="bg-white p-3 rounded border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900 mb-1">
                                    <span className="font-medium">Test {suggestion.id}:</span> {suggestion.summary}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    Framework: {suggestion.framework}
                                  </span>
                                </div>
                                <Link
                                  to={`/generate?repo=${encodeURIComponent(repo.full_name)}&suggestion=${suggestion.id}&auth=true`}
                                  className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                >
                                  Generate Code
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Loading States */}
                    {loadingState === 'files' && (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Loading repository files...</p>
                      </div>
                    )}

                    {loadingState === 'generating' && (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Generating test suggestions...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            to="/analyze"
            className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <Code className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Analyze Public Repository</h3>
              <p className="text-sm text-gray-600">Test any public GitHub repository</p>
            </div>
          </Link>
          
          <a
            href="https://github.com/settings/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <Github className="h-8 w-8 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Manage GitHub Access</h3>
              <p className="text-sm text-gray-600">Review app permissions</p>
            </div>
          </a>
        </div>
      </div>

      {/* System Monitor - Only show in development */}
      {ENV.IS_DEV && (
        <div className="mt-8">
          <SystemMonitor />
        </div>
      )}
    </div>
  )
}

export default Dashboard