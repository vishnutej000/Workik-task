import { TestTube, Code, Globe, Zap } from 'lucide-react'

const FrameworkSelector = ({ frameworks, selectedFramework, onFrameworkChange }) => {
  const frameworkInfo = {
    selenium: {
      icon: <Globe className="h-5 w-5" />,
      name: 'Selenium',
      description: 'Web automation testing',
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    jest: {
      icon: <Code className="h-5 w-5" />,
      name: 'Jest',
      description: 'JavaScript unit testing',
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    pytest: {
      icon: <TestTube className="h-5 w-5" />,
      name: 'pytest',
      description: 'Python testing framework',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    junit: {
      icon: <Code className="h-5 w-5" />,
      name: 'JUnit',
      description: 'Java unit testing',
      color: 'text-orange-600 bg-orange-50 border-orange-200'
    },
    cypress: {
      icon: <Globe className="h-5 w-5" />,
      name: 'Cypress',
      description: 'End-to-end testing',
      color: 'text-gray-600 bg-gray-50 border-gray-200'
    },
    playwright: {
      icon: <Zap className="h-5 w-5" />,
      name: 'Playwright',
      description: 'Cross-browser testing',
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    rspec: {
      icon: <TestTube className="h-5 w-5" />,
      name: 'RSpec',
      description: 'Ruby testing framework',
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    testing: {
      icon: <Code className="h-5 w-5" />,
      name: 'Go Testing',
      description: 'Go built-in testing',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200'
    }
  }

  const getFrameworkInfo = (framework) => {
    return frameworkInfo[framework] || {
      icon: <TestTube className="h-5 w-5" />,
      name: framework,
      description: 'Testing framework',
      color: 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Testing Framework</h2>
      
      {frameworks.length > 0 ? (
        <div className="space-y-3">
          {frameworks.map((framework) => {
            const info = getFrameworkInfo(framework)
            const isSelected = selectedFramework === framework
            
            return (
              <div
                key={framework}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                  isSelected
                    ? info.color
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => onFrameworkChange(framework)}
              >
                <div className="flex items-center space-x-3">
                  <div className={isSelected ? '' : 'text-gray-400'}>
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      isSelected ? '' : 'text-gray-900'
                    }`}>
                      {info.name}
                    </h3>
                    <p className={`text-sm ${
                      isSelected ? 'opacity-80' : 'text-gray-500'
                    }`}>
                      {info.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-current flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <TestTube className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            Select files to see available frameworks
          </p>
        </div>
      )}

      {selectedFramework && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {getFrameworkInfo(selectedFramework).name}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Test cases will be generated using {selectedFramework} conventions
          </p>
        </div>
      )}
    </div>
  )
}

export default FrameworkSelector