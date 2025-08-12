import { Code, Loader2, CheckCircle } from 'lucide-react'

const TestSuggestions = ({ suggestions, selectedSuggestion, onGenerateCode, loading }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Test Case Suggestions</h2>
        <span className="text-sm text-gray-500">
          {suggestions.length} suggestions
        </span>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const isSelected = selectedSuggestion?.id === suggestion.id
          const isLoading = loading && isSelected

          return (
            <div
              key={suggestion.id}
              className={`border rounded-lg p-4 transition-all ${
                isSelected
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      Test Case #{index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {suggestion.framework}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 text-sm leading-relaxed">
                    {suggestion.summary}
                  </p>
                </div>

                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => onGenerateCode(suggestion)}
                    disabled={loading}
                    className={`btn-primary text-sm flex items-center space-x-2 ${
                      isLoading ? 'opacity-75' : ''
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : isSelected ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Generated</span>
                      </>
                    ) : (
                      <>
                        <Code className="h-4 w-4" />
                        <span>Generate Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isSelected && !isLoading && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>Code generated successfully</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {suggestions.length === 0 && (
        <div className="text-center py-8">
          <Code className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            No test suggestions available
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <p className="text-sm text-gray-600">
          <strong>Tip:</strong> Click "Generate Code" on any suggestion to create complete test code.
          The AI will analyze your selected files and generate production-ready tests.
        </p>
      </div>
    </div>
  )
}

export default TestSuggestions