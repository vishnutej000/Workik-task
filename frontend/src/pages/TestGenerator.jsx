import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  generateTestSuggestions, 
  generateTestCode, 
  createPullRequest,
  getFrameworksForFile,
  generateSuggestionsOAuth,
  generateCodeOAuth,
  testSimpleSuggestions
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ENV } from '../config/env'
import { CONSTANTS } from '../config/constants'
import { 
  Settings, 
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
  Download,
  Github,
  ExternalLink,
  Zap
} from 'lucide-react'

const TestGenerator = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  // Repository data
  const [repoData, setRepoData] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [detectedFramework, setDetectedFramework] = useState('')
  
  // Test generation states
  const [suggestions, setSuggestions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const [generatedCode, setGeneratedCode] = useState(null)

  // Debug suggestions state changes
  useEffect(() => {
    console.log('🔍 Suggestions state changed:', suggestions)
    console.log('🔍 Suggestions length:', suggestions.length)
    console.log('🔍 Suggestions type:', typeof suggestions)
    console.log('🔍 Is array:', Array.isArray(suggestions))
    if (suggestions.length > 0) {
      console.log('🔍 First suggestion:', suggestions[0])
    }
  }, [suggestions])
  
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
      
      // Handle different generation modes
      if (data.generateMode === 'all' && data.preSelectedFiles) {
        // Pre-select all files for whole repository mode
        setSelectedFiles(data.preSelectedFiles)
        console.log('🎯 Whole repository mode: Pre-selected', data.preSelectedFiles.length, 'files')
      } else {
        console.log('📝 Individual file selection mode')
      }
    } else {
      navigate('/analyze')
    }
  }, [navigate])

  // Auto-detect framework when files are selected
  useEffect(() => {
    const detectFramework = async () => {
      if (selectedFiles.length > 0) {
        try {
          // Try backend detection first with repo URL for enhanced detection
          const repoUrl = repoData?.repoUrl || (repoData?.repository?.full_name ? `https://github.com/${repoData.repository.full_name}` : null)
          const url = repoUrl ? 
            `/frameworks/${selectedFiles[0]}?repo_url=${encodeURIComponent(repoUrl)}` :
            `/frameworks/${selectedFiles[0]}`
          
          const response = await fetch(`${ENV.API_BASE_URL}${url}`)
          const data = await response.json()
          
          setDetectedFramework(data.default_framework || 'pytest')
          console.log('🔧 Backend detected framework:', data.default_framework)
          console.log('🔧 Enhanced detection used:', data.enhanced_detection)
          
          if (data.enhanced_detection) {
            setSuccess(`Framework auto-detected: ${data.default_framework} (enhanced detection)`)
          }
        } catch (err) {
          console.error('Failed to detect framework from backend:', err)
          
          // Enhanced client-side framework detection
          const detectedFramework = detectFrameworkFromFiles(selectedFiles, repoData)
          setDetectedFramework(detectedFramework)
          console.log('🔧 Client-side detected framework:', detectedFramework)
        }
      }
    }

    detectFramework()
  }, [selectedFiles, repoData])

  // Enhanced framework detection function
  const detectFrameworkFromFiles = (files, repoData) => {
    console.log('🔍 Analyzing files for framework detection:', files)
    console.log('📁 Repository data:', repoData)
    
    // Count file types
    const fileStats = {
      python: 0,
      javascript: 0,
      typescript: 0,
      java: 0,
      csharp: 0,
      go: 0,
      ruby: 0,
      php: 0
    }
    
    // Analyze all files to understand the project
    const allFiles = repoData?.files || []
    const projectFiles = [...files, ...allFiles.map(f => f.path || f.name || f)].filter(Boolean)
    
    projectFiles.forEach(file => {
      const ext = file.split('.').pop()?.toLowerCase()
      switch (ext) {
        case 'py':
          fileStats.python++
          break
        case 'js':
        case 'jsx':
          fileStats.javascript++
          break
        case 'ts':
        case 'tsx':
          fileStats.typescript++
          break
        case 'java':
          fileStats.java++
          break
        case 'cs':
          fileStats.csharp++
          break
        case 'go':
          fileStats.go++
          break
        case 'rb':
          fileStats.ruby++
          break
        case 'php':
          fileStats.php++
          break
      }
    })
    
    console.log('📊 File statistics:', fileStats)
    
    // Check for specific framework indicators in file names and structure
    const packageJsonExists = allFiles.some(f => (f.path || f.name || f).includes('package.json'))
    const requirementsExists = allFiles.some(f => (f.path || f.name || f).includes('requirements.txt'))
    const pomXmlExists = allFiles.some(f => (f.path || f.name || f).includes('pom.xml'))
    const gradleExists = allFiles.some(f => (f.path || f.name || f).includes('build.gradle'))
    const cypressExists = allFiles.some(f => (f.path || f.name || f).includes('cypress'))
    const playwrightExists = allFiles.some(f => (f.path || f.name || f).includes('playwright'))
    const seleniumFiles = allFiles.some(f => (f.path || f.name || f).toLowerCase().includes('selenium'))
    
    console.log('🔍 Project indicators:', {
      packageJsonExists,
      requirementsExists,
      pomXmlExists,
      gradleExists,
      cypressExists,
      playwrightExists,
      seleniumFiles
    })
    
    // Get the primary language of the current file selection
    const primaryFile = files[0]
    const primaryExt = primaryFile?.split('.').pop()?.toLowerCase()
    
    console.log('📄 Primary file:', primaryFile, 'Extension:', primaryExt)
    
    // Detect framework based on file types and project structure
    if (cypressExists || allFiles.some(f => (f.path || f.name || f).includes('cypress.config'))) {
      return 'cypress'
    }
    
    if (playwrightExists || allFiles.some(f => (f.path || f.name || f).includes('playwright.config'))) {
      return 'playwright'
    }
    
    if (seleniumFiles && (fileStats.python > 0)) {
      return 'selenium'
    }
    
    // Language-based detection
    if (primaryExt === 'py' || fileStats.python > fileStats.javascript + fileStats.typescript) {
      // Check for specific Python testing frameworks
      if (allFiles.some(f => (f.path || f.name || f).includes('conftest.py'))) {
        return 'pytest'
      }
      if (allFiles.some(f => (f.path || f.name || f).toLowerCase().includes('unittest'))) {
        return 'unittest'
      }
      return 'pytest' // Default for Python
    }
    
    if ((primaryExt === 'js' || primaryExt === 'jsx') || 
        (fileStats.javascript > fileStats.python && fileStats.javascript > fileStats.typescript)) {
      // Check for React/Node.js testing frameworks
      if (allFiles.some(f => (f.path || f.name || f).includes('jest.config'))) {
        return 'jest'
      }
      if (allFiles.some(f => (f.path || f.name || f).includes('vitest.config'))) {
        return 'vitest'
      }
      if (allFiles.some(f => (f.path || f.name || f).includes('mocha'))) {
        return 'mocha'
      }
      return 'jest' // Default for JavaScript
    }
    
    if ((primaryExt === 'ts' || primaryExt === 'tsx') || 
        (fileStats.typescript > fileStats.javascript && fileStats.typescript > fileStats.python)) {
      // TypeScript projects
      if (allFiles.some(f => (f.path || f.name || f).includes('jest.config'))) {
        return 'jest'
      }
      if (allFiles.some(f => (f.path || f.name || f).includes('vitest.config'))) {
        return 'vitest'
      }
      return 'jest' // Default for TypeScript
    }
    
    if (primaryExt === 'java' || fileStats.java > 0) {
      // Java projects
      if (gradleExists || allFiles.some(f => (f.path || f.name || f).includes('build.gradle'))) {
        return 'junit'
      }
      if (pomXmlExists || allFiles.some(f => (f.path || f.name || f).includes('pom.xml'))) {
        return 'junit'
      }
      return 'junit' // Default for Java
    }
    
    if (primaryExt === 'cs' || fileStats.csharp > 0) {
      return 'nunit'
    }
    
    if (primaryExt === 'go' || fileStats.go > 0) {
      return 'testing'
    }
    
    if (primaryExt === 'rb' || fileStats.ruby > 0) {
      return 'rspec'
    }
    
    if (primaryExt === 'php' || fileStats.php > 0) {
      return 'phpunit'
    }
    
    // Default fallback based on most common file type
    if (fileStats.python > 0) return 'pytest'
    if (fileStats.javascript > 0 || fileStats.typescript > 0) return 'jest'
    if (fileStats.java > 0) return 'junit'
    
    return 'pytest' // Ultimate fallback
  }

  // Auto-generate tests when files are pre-selected (for "Generate All Tests" mode)
  useEffect(() => {
    const autoGenerateTests = async () => {
      if (repoData?.generateMode === 'all' && selectedFiles.length > 0 && detectedFramework && !loadingSuggestions && suggestions.length === 0) {
        console.log('🚀 Auto-generating tests for whole repository...')
        await handleGenerateSuggestions()
      }
    }

    // Small delay to ensure framework detection is complete
    const timer = setTimeout(autoGenerateTests, 1000)
    return () => clearTimeout(timer)
  }, [repoData, selectedFiles, detectedFramework, loadingSuggestions, suggestions.length])

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
      console.log('🚀 Starting test suggestion generation...')
      console.log('📊 Selected files:', selectedFiles)
      console.log('🔧 Framework:', detectedFramework)
      console.log('🔐 Authenticated:', isAuthenticated)
      console.log('📁 Repo data:', repoData)
      
      let data
      if (isAuthenticated && repoData.repository?.full_name) {
        console.log('📡 Using OAuth endpoint for authenticated user...')
        console.log('🔑 Repository:', repoData.repository.full_name)
        console.log('📄 Files:', selectedFiles)
        console.log('🔧 Framework:', detectedFramework)
        
        try {
          data = await generateSuggestionsOAuth(
            selectedFiles,
            repoData.repository.full_name,
            detectedFramework
          )
          console.log('✅ OAuth endpoint successful')
        } catch (oauthError) {
          console.error('❌ OAuth endpoint failed, trying direct endpoint:', oauthError)
          // Fallback to direct endpoint
          data = await generateTestSuggestions(
            repoData.repoUrl || `https://github.com/${repoData.repository.full_name}`,
            selectedFiles,
            detectedFramework
          )
          console.log('✅ Direct endpoint fallback successful')
        }
      } else {
        console.log('📡 Using direct endpoint for public repository...')
        console.log('🌐 Repo URL:', repoData.repoUrl)
        data = await generateTestSuggestions(
          repoData.repoUrl,
          selectedFiles,
          detectedFramework
        )
      }
      
      console.log('✅ API Response received:', data)
      console.log('📋 Suggestions count:', data.suggestions?.length || 0)
      console.log('📋 Full suggestions array:', data.suggestions)
      
      // FORCE set suggestions regardless - for debugging
      if (data.suggestions) {
        console.log('🔧 FORCING suggestions to be set...')
        setSuggestions(data.suggestions)
        setSuccess(`Generated ${data.suggestions.length} test suggestions`)
        console.log('🎉 Success: Set suggestions in state')
        console.log('🎉 Current suggestions state will be:', data.suggestions)
      } else {
        console.log('⚠️ No suggestions property in response')
        console.log('⚠️ Full response object:', JSON.stringify(data, null, 2))
        setSuggestions([])
        setError('No test suggestions were generated. Please try again or select different files.')
      }
    } catch (err) {
      console.error('❌ Failed to generate suggestions:', err)
      console.error('Error details:', err.response?.data)
      console.error('Error status:', err.response?.status)
      console.error('Error config:', err.config)
      console.error('Full error object:', err)
      
      setSuggestions([])
      setError(
        err.response?.data?.detail || 
        err.message ||
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
        console.log('🔐 Using OAuth endpoint for code generation...')
        try {
          data = await generateCodeOAuth(
            suggestion.id,
            suggestion.summary,
            selectedFiles,
            repoData.repository.full_name,
            detectedFramework
          )
          console.log('✅ OAuth code generation successful')
        } catch (oauthError) {
          console.error('❌ OAuth code generation failed, trying direct endpoint:', oauthError)
          // Fallback to direct endpoint
          data = await generateTestCode(
            repoData.repoUrl || `https://github.com/${repoData.repository.full_name}`,
            suggestion.id,
            suggestion.summary,
            selectedFiles,
            detectedFramework
          )
          console.log('✅ Direct code generation fallback successful')
        }
      } else {
        // Use direct endpoint for public repository analysis
        data = await generateTestCode(
          repoData.repoUrl,
          suggestion.id,
          suggestion.summary,
          selectedFiles,
          detectedFramework
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
    console.log('🚀 Starting PR creation...')
    console.log('📊 Generated code:', generatedCode)
    console.log('🔐 Authenticated:', isAuthenticated)
    console.log('📁 Repository:', repoData.repository)
    
    if (!generatedCode) {
      setError('No test code generated yet. Please generate test code first.')
      return
    }

    if (!isAuthenticated) {
      setError('GitHub authentication required to create pull requests. Please login first.')
      return
    }

    if (!repoData.repository?.full_name) {
      setError('Repository information missing. Pull requests can only be created for authenticated repository access.')
      return
    }

    setCreatingPR(true)
    setError('')

    try {
      const branchName = `testgen/${generatedCode.suggested_filename.replace(/\./g, '-')}-${Date.now()}`
      const commitMessage = `Add ${generatedCode.suggested_filename}\n\nGenerated test for: ${selectedSuggestion?.summary || 'test case'}`

      console.log('📝 PR Details:')
      console.log('  Repository:', repoData.repository.full_name)
      console.log('  Branch:', branchName)
      console.log('  File:', generatedCode.suggested_filename)
      console.log('  Commit message:', commitMessage)

      const prData = await createPullRequest(
        repoData.repository.full_name,
        generatedCode.test_code,
        generatedCode.suggested_filename,
        branchName,
        commitMessage
      )

      console.log('✅ PR created successfully:', prData)

      setSuccess(
        <div>
          Pull request created successfully! 
          <a 
            href={prData.pr_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-1 underline"
            style={{ color: 'var(--gh-accent-secondary)' }}
          >
            View PR #{prData.pr_number} <ExternalLink className="h-3 w-3 inline ml-1" />
          </a>
        </div>
      )
    } catch (err) {
      console.error('❌ Failed to create PR:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      
      let errorMessage = 'Failed to create pull request.'
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication expired. Please login again.'
      } else if (err.response?.status === 403) {
        errorMessage = 'Permission denied. You may not have write access to this repository.'
      } else if (err.response?.status === 404) {
        errorMessage = 'Repository not found or not accessible.'
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(`${errorMessage} Try the manual PR option instead.`)
    } finally {
      setCreatingPR(false)
    }
  }

  const handleCreateManualPR = () => {
    console.log('📝 Creating manual PR instructions...')
    
    if (!generatedCode) {
      setError('No test code generated yet. Please generate test code first.')
      return
    }

    // Create instructions for manual PR creation
    const repoUrl = repoData.repository?.html_url || 
                   (repoData.repoUrl ? repoData.repoUrl : `https://github.com/${repoData.repository?.full_name || 'owner/repo'}`)
    const branchName = `testgen/${generatedCode.suggested_filename.replace(/\./g, '-')}-${Date.now()}`
    const commitMessage = `Add ${generatedCode.suggested_filename}\n\nGenerated test for: ${selectedSuggestion?.summary || 'test case'}`
    
    console.log('📋 Manual PR details:')
    console.log('  Repository URL:', repoUrl)
    console.log('  Branch name:', branchName)
    console.log('  File name:', generatedCode.suggested_filename)
    
    const instructions = `# Manual Pull Request Instructions

## 📁 Repository: ${repoUrl}
## 📄 Test File: ${generatedCode.suggested_filename}
## 🌿 Branch: ${branchName}

---

## Step 1: Fork the Repository
1. Go to: ${repoUrl}
2. Click the "Fork" button to create your own copy
3. Wait for the fork to complete

## Step 2: Clone Your Fork
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/${repoUrl.split('/').slice(-2).join('/')}.git
cd ${repoUrl.split('/').pop()}
\`\`\`

## Step 3: Create a New Branch
\`\`\`bash
git checkout -b ${branchName}
\`\`\`

## Step 4: Create the Test File
Create a new file: \`${generatedCode.suggested_filename}\`

Copy and paste this test code:

\`\`\`${generatedCode.language || 'python'}
${generatedCode.test_code}
\`\`\`

## Step 5: Commit and Push
\`\`\`bash
git add ${generatedCode.suggested_filename}
git commit -m "${commitMessage.split('\n')[0]}"
git push origin ${branchName}
\`\`\`

## Step 6: Create Pull Request
1. Go to your forked repository on GitHub
2. You should see a "Compare & pull request" button
3. Click it and add a description:

**Title:** ${commitMessage.split('\n')[0]}

**Description:**
${commitMessage.split('\n').slice(1).join('\n')}

Framework: ${generatedCode.framework}
Language: ${generatedCode.language}

Generated by GitHub Test Case Generator

4. Click "Create pull request"

---

## 🎯 Quick Links
- Original Repository: ${repoUrl}
- Your Fork: https://github.com/YOUR_USERNAME/${repoUrl.split('/').slice(-2).join('/')}

## 📞 Need Help?
If you encounter issues:
1. Make sure you have write access to your fork
2. Check that the branch name is unique
3. Verify the test file syntax is correct
4. Ensure you're pushing to your fork, not the original repo

---
Generated by GitHub Test Case Generator
Generated on: ${new Date().toLocaleString()}
    `.trim()

    try {
      // Create a downloadable instructions file
      const blob = new Blob([instructions], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PR_Instructions_${generatedCode.suggested_filename.replace(/\./g, '_')}.md`
      a.click()
      URL.revokeObjectURL(url)

      console.log('✅ Instructions file downloaded')

      // Also show success message
      setSuccess(
        <div>
          PR instructions downloaded! 
          <a 
            href={repoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-1 underline"
            style={{ color: 'var(--gh-accent-secondary)' }}
          >
            Open Repository <ExternalLink className="h-3 w-3 inline ml-1" />
          </a>
        </div>
      )
      setError('')
    } catch (err) {
      console.error('❌ Failed to create instructions:', err)
      setError('Failed to create PR instructions. Please copy the test code manually.')
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
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">Test Generator</h1>
              {repoData?.generateMode === 'all' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  Whole Repository
                </span>
              )}
            </div>
            <p className="text-gray-600">{repoData.repository.full_name}</p>
            {repoData?.generateMode === 'all' && (
              <p className="text-sm text-blue-600 mt-1">
                All {repoData.files?.length || 0} files pre-selected for testing
              </p>
            )}
          </div>
        </div>
        <Settings className="h-8 w-8 text-blue-600" />
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
            {repoData?.generateMode === 'all' ? (
              // Whole Repository Mode - Show summary instead of selection
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Repository Files ({selectedFiles.length} files)
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <p className="text-blue-800 font-medium">
                      Whole Repository Mode Active
                    </p>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    All {selectedFiles.length} code files have been automatically selected for test generation.
                  </p>
                </div>
                {loadingSuggestions && (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-gray-600">Analyzing repository and generating test suggestions...</p>
                  </div>
                )}
              </>
            ) : (
              // Individual Selection Mode - Show file checkboxes
              <>
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
              </>
            )}
          </div>

          {/* Detected Framework */}
          {detectedFramework && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Testing Framework
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-2 bg-green-100 text-green-800 rounded-md font-medium">
                    {detectedFramework.charAt(0).toUpperCase() + detectedFramework.slice(1)}
                  </div>
                  <span className="text-sm text-gray-600">Auto-detected</span>
                </div>
                
                {/* Show detection method info */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <div className="font-medium mb-1">Detection Info:</div>
                  <div>• Primary file: {selectedFiles[0]?.split('/').pop()}</div>
                  <div>• Language: {selectedFiles[0]?.split('.').pop()?.toUpperCase()}</div>
                  <div>• Method: {success?.includes('enhanced') ? 'Project structure analysis' : 'File extension + heuristics'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Suggestions Button - Only show in individual selection mode */}
          {repoData?.generateMode !== 'all' && (
            <div className="space-y-2">
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
                    <Settings className="h-5 w-5" />
                    <span>Generate Test Suggestions</span>
                  </>
                )}
              </button>
              
              {/* Debug Test Button */}
              <button
                onClick={async () => {
                  console.log('🧪 Testing simple endpoint...')
                  try {
                    const data = await testSimpleSuggestions()
                    console.log('🧪 Test response:', data)
                    setSuggestions(data.suggestions)
                    setSuccess(`Test: Loaded ${data.suggestions.length} suggestions`)
                    setError('')
                  } catch (err) {
                    console.error('🧪 Test failed:', err)
                    setError('Test endpoint failed')
                  }
                }}
                className="btn-secondary w-full text-sm"
              >
                🧪 Test Simple Suggestions
              </button>
              
              {/* OAuth Debug Button for authenticated users */}
              {isAuthenticated && repoData.repository?.full_name && (
                <button
                  onClick={async () => {
                    console.log('🔐 Testing OAuth endpoint...')
                    setError('')
                    try {
                      const data = await generateSuggestionsOAuth(
                        selectedFiles.length > 0 ? selectedFiles : ['README.md'],
                        repoData.repository.full_name,
                        detectedFramework || 'pytest'
                      )
                      console.log('🔐 OAuth test response:', data)
                      setSuggestions(data.suggestions)
                      setSuccess(`OAuth Test: Loaded ${data.suggestions.length} suggestions`)
                    } catch (err) {
                      console.error('🔐 OAuth test failed:', err)
                      setError(`OAuth test failed: ${err.message}`)
                    }
                  }}
                  className="btn-secondary w-full text-sm bg-blue-50 border-blue-200 text-blue-700"
                >
                  🔐 Test OAuth Endpoint
                </button>
              )}
            </div>
          )}
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
                <h3 className="text-lg font-semibold" style={{ color: 'var(--gh-text-primary)' }}>
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
              
              <div className="px-3 py-2 rounded-t border-b" style={{ 
                backgroundColor: 'var(--gh-bg-tertiary)', 
                borderColor: 'var(--gh-border-primary)' 
              }}>
                <span className="text-sm font-mono" style={{ color: 'var(--gh-text-primary)' }}>
                  {generatedCode.suggested_filename}
                </span>
                <span className="text-xs ml-2" style={{ color: 'var(--gh-text-tertiary)' }}>
                  ({generatedCode.framework} • {generatedCode.language})
                </span>
              </div>
              
              <div className="p-4 rounded-b max-h-96 overflow-auto" style={{ backgroundColor: 'var(--gh-bg-primary)' }}>
                <pre className="text-sm whitespace-pre-wrap font-mono" style={{ color: 'var(--gh-text-primary)' }}>
                  {generatedCode.test_code}
                </pre>
              </div>

              {/* Create PR Button */}
              <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--gh-border-primary)' }}>
                <div className="flex items-center space-x-2">
                  <span className="text-sm" style={{ color: 'var(--gh-text-secondary)' }}>
                    Ready to add this test to your repository?
                  </span>
                </div>
                
                {isAuthenticated ? (
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
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCreateManualPR}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <GitBranch className="h-4 w-4" />
                      <span>Create PR Manually</span>
                    </button>
                    <a
                      href="/auth/github"
                      className="btn-primary flex items-center space-x-2 text-sm"
                    >
                      <Github className="h-4 w-4" />
                      <span>Login for Auto PR</span>
                    </a>
                  </div>
                )}
              </div>

              {!isAuthenticated && (
                <div className="rounded-lg p-4" style={{ 
                  backgroundColor: 'rgba(47, 129, 247, 0.1)', 
                  borderColor: 'var(--gh-accent-secondary)',
                  border: '1px solid'
                }}>
                  <div className="flex items-start space-x-3">
                    <GitBranch className="h-5 w-5 mt-0.5" style={{ color: 'var(--gh-accent-secondary)' }} />
                    <div>
                      <h4 className="font-medium mb-1" style={{ color: 'var(--gh-text-primary)' }}>
                        Create Pull Request Options
                      </h4>
                      <ul className="text-sm space-y-1" style={{ color: 'var(--gh-text-secondary)' }}>
                        <li>• <strong>Manual PR:</strong> Get instructions to create PR yourself</li>
                        <li>• <strong>Auto PR:</strong> Login with GitHub for automatic PR creation</li>
                      </ul>
                    </div>
                  </div>
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
                {repoData?.generateMode === 'all' 
                  ? 'Test suggestions will be generated automatically for all repository files'
                  : 'Select files and click "Generate Test Suggestions" to get started'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestGenerator