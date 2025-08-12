import { useState } from 'react'
import { FileCode, Search, Check } from 'lucide-react'

const FileSelector = ({ files, selectedFiles, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFiles = files.filter(file =>
    file.path.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFileToggle = (filePath) => {
    const isSelected = selectedFiles.includes(filePath)
    if (isSelected) {
      onSelectionChange(selectedFiles.filter(f => f !== filePath))
    } else {
      // Limit to 5 files for better performance
      if (selectedFiles.length < 5) {
        onSelectionChange([...selectedFiles, filePath])
      }
    }
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      onSelectionChange([])
    } else {
      // Select up to 5 files
      const filesToSelect = filteredFiles.slice(0, 5).map(f => f.path)
      onSelectionChange(filesToSelect)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Select Files</h2>
        <span className="text-sm text-gray-500">
          {selectedFiles.length}/5 selected
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10 text-sm"
        />
      </div>

      {/* Select All Button */}
      {filteredFiles.length > 0 && (
        <button
          onClick={handleSelectAll}
          className="btn-secondary text-sm w-full mb-4"
        >
          {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
        </button>
      )}

      {/* File List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file, index) => {
            const isSelected = selectedFiles.includes(file.path)
            const isDisabled = !isSelected && selectedFiles.length >= 5

            return (
              <div
                key={index}
                className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-200'
                    : isDisabled
                    ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => !isDisabled && handleFileToggle(file.path)}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                
                <FileCode className="h-4 w-4 text-gray-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-gray-900 truncate">
                    {file.path}
                  </p>
                  {file.size && (
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)}KB
                    </p>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <FileCode className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'No files match your search' : 'No files available'}
            </p>
          </div>
        )}
      </div>

      {/* Selection Info */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Selected files:</strong>
          </p>
          <div className="mt-2 space-y-1">
            {selectedFiles.map((filePath, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-700 truncate">
                  {filePath}
                </span>
                <button
                  onClick={() => handleFileToggle(filePath)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedFiles.length >= 5 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            Maximum 5 files can be selected for optimal performance.
          </p>
        </div>
      )}
    </div>
  )
}

export default FileSelector