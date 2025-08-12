import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Download, FileCode } from 'lucide-react'

const CodeViewer = ({ code, filename, language, framework }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLanguageForHighlighter = (lang) => {
    const languageMap = {
      'python': 'python',
      'javascript': 'javascript',
      'typescript': 'typescript',
      'java': 'java',
      'go': 'go',
      'ruby': 'ruby',
      'php': 'php',
      'csharp': 'csharp',
      'swift': 'swift',
      'cpp': 'cpp',
      'c': 'c'
    }
    return languageMap[lang] || 'javascript'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <FileCode className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generated Test Code</h2>
            <p className="text-sm text-gray-600">
              {filename} • {framework} • {language}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="btn-secondary text-sm flex items-center space-x-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDownload}
            className="btn-secondary text-sm flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-sm font-mono text-gray-600">{filename}</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <SyntaxHighlighter
              language={getLanguageForHighlighter(language)}
              style={oneLight}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'white',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              showLineNumbers={true}
              lineNumberStyle={{
                color: '#9CA3AF',
                paddingRight: '1rem',
                minWidth: '3rem'
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Framework:</strong> {framework} • 
          <strong className="ml-2">Language:</strong> {language} • 
          <strong className="ml-2">Lines:</strong> {code.split('\n').length}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          This code is production-ready and includes proper imports, setup, and test structure.
        </p>
      </div>
    </div>
  )
}

export default CodeViewer