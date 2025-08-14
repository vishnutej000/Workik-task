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
  Loader2,
  AlertCircle,
  Eye,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Settings,
  CheckSquare,
  Square,
  Copy
} from 'lucide-react'
import axios from 'axios'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const RepositoryDetails = () => {
  const { repoPath } = useParams() // Format: owner%2Frepo
  const navigate = useNavigate()
  const { sessionToken } = useAuth()

  const [repository, setRepository] = useState(null)
  const [files, setFiles] = useState([])
  const [fileTree, setFileTree] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [loadingContent, setLoadingContent] = useState(false)
  const [selectedFilesForTests, setSelectedFilesForTests] = useState([])
  const [showTestSelection, setShowTestSelection] = useState(false)

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
                <span className="text-sm" style={{ color: 'var(--gh-text-primary)' }}>{value.name}</span>
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
          const isCodeFile = CONSTANTS.FILE_TYPES.CODE_EXTENSIONS.includes(
            file.name.split('.').pop()?.toLowerCase()
          )
          
          items.push(
            <div
              key={file.path}
              className={`flex items-center justify-between p-1 hover:bg-gray-50 rounded transition-colors ${selectedFile === file.path ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {/* Test Selection Checkbox - Only for code files */}
                {showTestSelection && isCodeFile && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFileSelection(file.path)
                    }}
                    className="cursor-pointer"
                  >
                    {selectedFilesForTests.includes(file.path) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                )}
                
                <div
                  className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
                  onClick={() => fetchFileContent(file.path)}
                >
                  {getFileIcon(file.name)}
                  <span className="text-sm truncate" style={{ color: 'var(--gh-text-primary)' }}>
                    {file.name}
                  </span>
                </div>
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

  const toggleFileSelection = (filePath) => {
    setSelectedFilesForTests(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(f => f !== filePath)
      } else {
        return [...prev, filePath]
      }
    })
  }

  const handleGenerateTests = () => {
    if (selectedFilesForTests.length === 0) {
      alert('Please select at least one file for test generation')
      return
    }

    // Create repository data structure similar to RepoAnalyzer
    const repoData = {
      repository: repository,
      files: files.filter(file => selectedFilesForTests.includes(file.path)),
      total_files: selectedFilesForTests.length,
      generateMode: 'selective',
      preSelectedFiles: selectedFilesForTests
    }

    // Store in sessionStorage and navigate to test generator
    sessionStorage.setItem('repoData', JSON.stringify({
      repoUrl: repository.html_url,
      ...repoData
    }))

    navigate('/generate')
  }

  const getFileLanguage = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const languageMap = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'bash',
      'bash': 'bash',
      'sql': 'sql',
      'dockerfile': 'dockerfile',
      'vue': 'vue',
      'svelte': 'svelte',
      'kt': 'kotlin',
      'swift': 'swift',
      'rust': 'rust',
      'rs': 'rust'
    }
    return languageMap[ext] || 'text'
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Code copied to clipboard')
    })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--gh-text-primary)' }}>
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
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--gh-text-primary)' }}>
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
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Repository Files
                </h2>
                {showTestSelection && (
                  <p className="text-sm text-blue-600 mt-1">
                    Click checkboxes next to code files to select them for testing
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  {files.length} files total
                </span>
                {showTestSelection && selectedFilesForTests.length > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    {selectedFilesForTests.length} selected for testing
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-y-auto">
              <div className="space-y-1">
                {renderFileTree(fileTree)}
              </div>
            </div>
          </div>
        </div>

        {/* File Content Viewer */}
        <div className="lg:col-span-2">
          <div className="card h-full">
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
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--gh-border-primary)' }}>
                {/* File Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ 
                  backgroundColor: 'var(--gh-bg-tertiary)', 
                  borderColor: 'var(--gh-border-primary)' 
                }}>
                  <div className="flex items-center space-x-2">
                    {getFileIcon(selectedFile)}
                    <span className="text-sm font-mono font-medium" style={{ color: 'var(--gh-text-primary)' }}>
                      {selectedFile}
                    </span>
                    <span className="text-xs px-2 py-1 rounded" style={{ 
                      backgroundColor: 'var(--gh-bg-overlay)', 
                      color: 'var(--gh-text-secondary)' 
                    }}>
                      {getFileLanguage(selectedFile)}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(fileContent)}
                    className="flex items-center space-x-1 text-xs px-2 py-1 rounded"
                    style={{ 
                      color: 'var(--gh-text-tertiary)',
                      ':hover': { 
                        color: 'var(--gh-text-primary)', 
                        backgroundColor: 'var(--gh-bg-overlay)' 
                      }
                    }}
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </button>
                </div>
                
                {/* File Content */}
                <div className="overflow-auto" style={{ backgroundColor: 'var(--gh-bg-primary)' }}>
                  <SyntaxHighlighter
                    language={getFileLanguage(selectedFile)}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      backgroundColor: 'var(--gh-bg-primary)',
                      maxHeight: '32rem',
                      overflow: 'auto'
                    }}
                    showLineNumbers={true}
                    lineNumberStyle={{
                      color: 'var(--gh-text-tertiary)',
                      paddingRight: '1rem',
                      minWidth: '3rem'
                    }}
                    wrapLines={true}
                    wrapLongLines={true}
                  >
                    {fileContent}
                  </SyntaxHighlighter>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No file selected</h3>
                <p className="text-sm">Click on a file to preview its content</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Generation Section */}
      <div className="mt-8 card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--gh-text-primary)' }}>
            Test Case Generation
          </h2>
          <button
            onClick={() => setShowTestSelection(!showTestSelection)}
            className={`btn-secondary text-sm ${showTestSelection ? '' : ''}`}
            style={showTestSelection ? { 
              backgroundColor: 'rgba(47, 129, 247, 0.15)', 
              color: 'var(--gh-accent-secondary)', 
              borderColor: 'var(--gh-accent-secondary)' 
            } : {}}
          >
            {showTestSelection ? 'Hide Selection' : 'Select Files for Testing'}
          </button>
        </div>

        {showTestSelection && (
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ 
              backgroundColor: 'rgba(47, 129, 247, 0.1)', 
              borderColor: 'var(--gh-accent-secondary)',
              border: '1px solid'
            }}>
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="h-5 w-5" style={{ color: 'var(--gh-accent-secondary)' }} />
                <h3 className="font-medium" style={{ color: 'var(--gh-text-primary)' }}>Select Code Files for Test Generation</h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--gh-text-secondary)' }}>
                Choose the code files you want to generate test cases for. Only code files (.py, .js, .jsx, .ts, .tsx, .java, etc.) can be selected.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--gh-bg-tertiary)' }}>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: 'var(--gh-text-primary)' }}>
                  Selected Files: {selectedFilesForTests.length}
                </span>
                {selectedFilesForTests.length > 0 && (
                  <span className="text-xs" style={{ color: 'var(--gh-text-tertiary)' }}>
                    ({selectedFilesForTests.map(f => f.split('/').pop()).join(', ')})
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedFilesForTests.length > 0 && (
                  <button
                    onClick={() => setSelectedFilesForTests([])}
                    className="text-xs px-2 py-1 rounded"
                    style={{ 
                      color: 'var(--gh-text-tertiary)',
                      ':hover': { color: 'var(--gh-text-primary)', backgroundColor: 'var(--gh-bg-overlay)' }
                    }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={handleGenerateTests}
                  disabled={selectedFilesForTests.length === 0}
                  className="btn-primary text-sm flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Generate Tests</span>
                </button>
              </div>
            </div>

            <div className="text-xs" style={{ color: 'var(--gh-text-tertiary)' }}>
              💡 <strong>Tip:</strong> Checkboxes appear next to code files in the file tree above. Click them to select files for test generation.
            </div>
          </div>
        )}

        {!showTestSelection && (
          <div className="text-center py-8" style={{ color: 'var(--gh-text-tertiary)' }}>
            <Settings className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--gh-text-tertiary)' }} />
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--gh-text-primary)' }}>Generate Test Cases</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--gh-text-secondary)' }}>
              Select specific files from your repository to generate AI-powered test cases
            </p>
            <button
              onClick={() => setShowTestSelection(true)}
              className="btn-primary text-sm"
            >
              Start Selecting Files
            </button>
          </div>
        )}
      </div>

    </div>
  )
}

export default RepositoryDetails