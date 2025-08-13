import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ENV } from '../config/env'
import { CONSTANTS } from '../config/constants'
import {
  Github,
  ArrowLeft,
  Folder,
  FileText,
  Code,
  TestTube,
  Loader2,
  AlertCircle,
  Eye,
  Download,
  Calendar,
  Star,
  GitBranch,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import axios from 'axios'

const RepositoryDetails = () => {
  const { repoPath } = useParams() // Format: owner%2Frepo
  const navigate = useNavigate()
  const { user, sessionToken } = useAuth()

  const [repository, setRepository] = useState(null)
  const [files, setFiles] = useState([])
  const [fileTree, setFileTree] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [loadingContent, setLoadingContent] = useState(false)

  // Parse repository path
  const fullRepoName = decodeURIComponent(repoPath.replace('%2F', '/'))
  const [owner, repoName] = fullRepoName.split('/')

  useEffect(() => {
    const fetchRepositoryDetails = async () => {
      if (!sessionToken) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      try {
        console.log('📡 Fetching repository details for:', fullRepoName)

        // Fetch repository info and files in parallel
        const [repoResponse, filesResponse] = await Promise.all([
          axios.get(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.REPOSITORIES}`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          }),
          axios.get(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.REPOSITORIES}/${owner}/${repoName}/files`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          })
        ])

        // Find the specific repository
        const repo = repoResponse.data.find(r => r.full_name === fullRepoName)
        if (!repo) {
          setError('Repository not found')
          return
        }

        setRepository(repo)
        setFiles(filesResponse.data)
        setFileTree(buildFileTree(filesResponse.data))
        console.log('✅ Repository details loaded:', repo.name, filesResponse.data.length, 'files')

      } catch (err) {
        console.error('❌ Failed to fetch repository details:', err)
        setError(err.response?.data?.detail || 'Failed to fetch repository details')
      } finally {
        setLoading(false)
      }
    }

    fetchRepositoryDetails()
  }, [sessionToken, fullRepoName, owner, repoName])

  const fetchFileContent = async (filePath) => {
    if (!sessionToken) return

    setLoadingContent(true)
    setError('')

    try {
      console.log('📄 Fetching file content:', filePath)
      const response = await axios.get(
        `${ENV.API_BASE_URL}${ENV.ENDPOINTS.REPOSITORIES}/${owner}/${repoName}/file-content`,
        {
          params: { file_path: filePath },
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        }
      )

      setFileContent(response.data.content)
      setSelectedFile(filePath)
      console.log('✅ File content loaded:', filePath)

    } catch (err) {
      console.error('❌ Failed to fetch file content:', err)
      setError(err.response?.data?.detail || 'Failed to fetch file content')
    } finally {
      setLoadingContent(false)
    }
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase()

    if (CONSTANTS.FILE_TYPES.CODE_EXTENSIONS.includes(ext)) {
      return <Code className="h-4 w-4 text-blue-600" />
    }

    return <FileText className="h-4 w-4 text-gray-500" />
  }

  const getLanguageColor = (language) => {
    return CONSTANTS.LANGUAGE_COLORS[language] || CONSTANTS.LANGUAGE_COLORS.DEFAULT
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const buildFileTree = (files) => {
    const tree = {}

    files.forEach(file => {
      const parts = file.path.split('/')
      let current = tree

      // Build nested structure
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]

        if (i === parts.length - 1) {
          // This is a file
          if (!current._files) current._files = []
          current._files.push({
            ...file,
            name: part,
            type: 'file'
          })
        } else {
          // This is a directory
          if (!current[part]) {
            current[part] = {
              type: 'directory',
              name: part,
              path: parts.slice(0, i + 1).join('/'),
              expanded: i < 2 // Auto-expand first 2 levels
            }
          }
          current = current[part]
        }
      }
    })

    return tree
  }

  const renderFileTree = (node, level = 0) => {
    const items = []

    // Render directories first
    Object.entries(node)
      .filter(([key]) => key !== '_files')
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, value]) => {
        if (value.type === 'directory') {
          items.push(
            <div key={value.path}>
              <div
                className={`flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer ${level === 0 ? 'font-medium' : ''
                  }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => toggleDirectory(value.path)}
              >
                {value.expanded ? (
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                )}
                <Folder className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-900">{value.name}</span>
                <span className="text-xs text-gray-500">
                  ({getDirectoryFileCount(value)})
                </span>
              </div>
              {value.expanded && renderFileTree(value, level + 1)}
            </div>
          )
        }
      })

    // Render files
    if (node._files) {
      node._files
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(file => {
          items.push(
            <div
              key={file.path}
              className={`flex items-center justify-between p-1 hover:bg-gray-50 rounded cursor-pointer transition-colors ${selectedFile === file.path ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
              onClick={() => fetchFileContent(file.path)}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {getFileIcon(file.name)}
                <span className="text-sm text-gray-900 truncate">
                  {file.name}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{formatFileSize(file.size)}</span>
                <Eye className="h-3 w-3" />
              </div>
            </div>
          )
        })
    }

    return items
  }

  const toggleDirectory = (path) => {
    setFileTree(prev => {
      const newTree = JSON.parse(JSON.stringify(prev))
      const parts = path.split('/')
      let current = newTree

      for (const part of parts) {
        if (current[part]) {
          current = current[part]
        }
      }

      if (current.type === 'directory') {
        current.expanded = !current.expanded
      }

      return newTree
    })
  }

  const getDirectoryFileCount = (dir) => {
    let count = 0

    if (dir._files) {
      count += dir._files.length
    }

    Object.values(dir).forEach(value => {
      if (value.type === 'directory') {
        count += getDirectoryFileCount(value)
      }
    })

    return count
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Repository Details
          </h2>
          <p className="text-gray-600">
            Fetching repository information and files...
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
            Error Loading Repository
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
            <Link to="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!repository) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Repository Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The repository "{fullRepoName}" was not found in your accessible repositories.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // File tree is built in useEffect

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/generate?repo=${encodeURIComponent(repository.full_name)}&auth=true`}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>Generate Tests</span>
          </Link>

          <a
            href={repository.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center space-x-2"
          >
            <Github className="h-4 w-4" />
            <span>View on GitHub</span>
          </a>
        </div>
      </div>

      {/* Repository Info */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {repository.private ? (
              <Lock className="h-6 w-6 text-gray-500" />
            ) : (
              <Unlock className="h-6 w-6 text-green-500" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {repository.full_name}
              </h1>
              {repository.description && (
                <p className="text-gray-600 mt-1">
                  {repository.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {repository.language && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLanguageColor(repository.language)}`}>
                {repository.language}
              </span>
            )}
            <span className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{files.length} files</span>
            </span>
            <span className={repository.private ? 'text-orange-600' : 'text-green-600'}>
              {repository.private ? 'Private' : 'Public'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* File Browser */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Repository Files
              </h2>
              <span className="text-sm text-gray-500">
                {files.length} files total
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-1">
                {renderFileTree(fileTree)}
              </div>
            </div>
          </div>
        </div>

        {/* File Content Viewer */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                File Preview
              </h2>
              {selectedFile && (
                <a
                  href={`https://github.com/${repository.full_name}/blob/main/${selectedFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View on GitHub
                </a>
              )}
            </div>

            {loadingContent ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading file content...</p>
              </div>
            ) : selectedFile ? (
              <div>
                <div className="bg-gray-100 px-3 py-2 rounded-t border-b">
                  <span className="text-sm font-mono text-gray-700">
                    {selectedFile}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-b max-h-80 overflow-auto">
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                    {fileContent.length > CONSTANTS.UI.MAX_FILE_PREVIEW_SIZE
                      ? fileContent.substring(0, CONSTANTS.UI.MAX_FILE_PREVIEW_SIZE) + '\n\n... (truncated, view full file on GitHub)'
                      : fileContent
                    }
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Click on a file to preview its content</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to={`/generate?repo=${encodeURIComponent(repository.full_name)}&auth=true`}
            className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <TestTube className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-medium text-gray-900">Generate Test Cases</h3>
              <p className="text-sm text-gray-600">Create AI-powered test suggestions</p>
            </div>
          </Link>

          <a
            href={repository.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <Github className="h-8 w-8 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">View on GitHub</h3>
              <p className="text-sm text-gray-600">Open repository in GitHub</p>
            </div>
          </a>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Back to Dashboard</h3>
              <p className="text-sm text-gray-600">Return to repository list</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RepositoryDetails