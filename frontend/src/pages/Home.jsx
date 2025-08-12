import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Github, TestTube, Code, Zap, Shield, GitBranch } from 'lucide-react'

const Home = () => {
  const { login, isAuthenticated, user } = useAuth()

  const features = [
    {
      icon: <Github className="h-8 w-8 text-blue-600" />,
      title: "GitHub Integration",
      description: "Connect with GitHub repositories and analyze code files automatically"
    },
    {
      icon: <TestTube className="h-8 w-8 text-green-600" />,
      title: "Multi-Framework Support",
      description: "Generate tests for Selenium, Jest, pytest, JUnit, Cypress, and more"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "AI-Powered Generation",
      description: "Smart test case suggestions using advanced AI models"
    },
    {
      icon: <Code className="h-8 w-8 text-purple-600" />,
      title: "Complete Test Code",
      description: "Generate production-ready test code with proper imports and structure"
    },
    {
      icon: <GitBranch className="h-8 w-8 text-indigo-600" />,
      title: "Pull Request Creation",
      description: "Automatically create PRs with generated test files"
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Secure & Fast",
      description: "Secure token handling with fast API responses"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="flex justify-center mb-6">
          <TestTube className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          TestGen AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Generate comprehensive test cases for your code using AI. 
          Support for multiple frameworks including Selenium, Jest, pytest, and more.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/analyze"
            className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
          >
            <Code className="h-5 w-5" />
            <span>Analyze Repository</span>
          </Link>
          
          {!isAuthenticated && (
            <button
              onClick={login}
              className="btn-secondary text-lg px-8 py-3 inline-flex items-center space-x-2"
            >
              <Github className="h-5 w-5" />
              <span>Login with GitHub</span>
            </button>
          )}
        </div>
      </div>

      {/* Welcome Message for Authenticated Users */}
      {isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatar_url}
              alt={user.name || user.login}
              className="h-12 w-12 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Welcome back, {user.name || user.login}!
              </h3>
              <p className="text-blue-700">
                You can now access your private repositories and create pull requests.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Powerful Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                {feature.icon}
                <h3 className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gray-50 -mx-4 px-4 rounded-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connect Repository
            </h3>
            <p className="text-gray-600">
              Enter a GitHub repository URL or connect via OAuth
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select Files
            </h3>
            <p className="text-gray-600">
              Choose code files to analyze and select testing framework
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-yellow-600">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generate Tests
            </h3>
            <p className="text-gray-600">
              AI analyzes your code and suggests comprehensive test cases
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">4</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Create PR
            </h3>
            <p className="text-gray-600">
              Generate code and optionally create a pull request
            </p>
          </div>
        </div>
      </div>

      {/* Supported Frameworks */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Supported Testing Frameworks
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[
            { name: 'Selenium', color: 'bg-green-100 text-green-800' },
            { name: 'Jest', color: 'bg-red-100 text-red-800' },
            { name: 'pytest', color: 'bg-blue-100 text-blue-800' },
            { name: 'JUnit', color: 'bg-orange-100 text-orange-800' },
            { name: 'Cypress', color: 'bg-gray-100 text-gray-800' },
            { name: 'Playwright', color: 'bg-purple-100 text-purple-800' }
          ].map((framework, index) => (
            <div
              key={index}
              className={`${framework.color} px-4 py-2 rounded-lg text-center font-medium`}
            >
              {framework.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home