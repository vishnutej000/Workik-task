import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ENV } from '../config/env'
import { Github, Code, Zap, Shield, GitBranch, Settings } from 'lucide-react'
import AppIcon from '../components/AppIcon'

const Home = () => {
  const { login, isAuthenticated, user, loading } = useAuth()
  
  console.log('🏠 Home component render:', { isAuthenticated, user: user?.login, loading })

  const features = [
    {
      icon: <Github className="h-8 w-8 text-blue-600" />,
      title: "GitHub Integration",
      description: "Connect with GitHub repositories and analyze code files automatically"
    },
    {
      icon: <Settings className="h-8 w-8 text-green-600" />,
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

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="flex justify-center mb-6">
          <AppIcon size="xl" />
        </div>
        <h1 className="text-5xl font-bold mb-6" style={{ color: 'var(--gh-text-primary)' }}>
          {ENV.APP_NAME}
        </h1>
        <p className="text-xl mb-8 max-w-3xl mx-auto" style={{ color: 'var(--gh-text-secondary)' }}>
          Generate comprehensive test cases for your code using AI. 
          Support for multiple frameworks including Selenium, Jest, pytest, and more.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
              >
                <Github className="h-5 w-5" />
                <span>My Repositories</span>
              </Link>
              <Link
                to="/analyze"
                className="btn-secondary text-lg px-8 py-3 inline-flex items-center space-x-2"
              >
                <Code className="h-5 w-5" />
                <span>Analyze Public Repo</span>
              </Link>
            </>
          ) : (
            <Link
              to="/analyze"
              className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
            >
              <Code className="h-5 w-5" />
              <span>Analyze Repository</span>
            </Link>
          )}
        </div>
      </div>

      {/* Welcome Message for Authenticated Users */}
      {isAuthenticated && (
        <div className="card mb-12" style={{ backgroundColor: 'rgba(35, 134, 54, 0.1)', borderColor: 'var(--gh-accent-primary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={user.avatar_url}
                alt={user.name || user.login}
                className="h-12 w-12 rounded-full border-2"
                style={{ borderColor: 'var(--gh-accent-primary)' }}
              />
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--gh-text-primary)' }}>
                  Welcome back, {user.name || user.login}!
                </h3>
                <p style={{ color: 'var(--gh-text-secondary)' }}>
                  You can now access your private repositories and create pull requests.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Github className="h-4 w-4" />
              <span>View My Repos</span>
            </Link>
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


    </div>
  )
}

export default Home