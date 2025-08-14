import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ENV } from '../config/env'
import { Github, LogOut, Code, Home } from 'lucide-react'
import AppIcon from './AppIcon'

const Navbar = () => {
  const { user, logout, login, isAuthenticated } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{ backgroundColor: 'var(--gh-bg-secondary)', borderBottom: '1px solid var(--gh-border-primary)' }}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <AppIcon size="md" />
            <span className="text-xl font-bold" style={{ color: 'var(--gh-text-primary)' }}>{ENV.APP_NAME}</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-blue-400' 
                  : 'hover:text-blue-400'
              }`}
              style={{ 
                color: isActive('/') ? 'var(--gh-accent-secondary)' : 'var(--gh-text-secondary)',
                backgroundColor: isActive('/') ? 'rgba(47, 129, 247, 0.1)' : 'transparent'
              }}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'text-blue-400' 
                    : 'hover:text-blue-400'
                }`}
                style={{ 
                  color: isActive('/dashboard') ? 'var(--gh-accent-secondary)' : 'var(--gh-text-secondary)',
                  backgroundColor: isActive('/dashboard') ? 'rgba(47, 129, 247, 0.1)' : 'transparent'
                }}
              >
                <Github className="h-4 w-4" />
                <span>My Repos</span>
              </Link>
            )}
            
            <Link
              to="/analyze"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/analyze') 
                  ? 'text-blue-400' 
                  : 'hover:text-blue-400'
              }`}
              style={{ 
                color: isActive('/analyze') ? 'var(--gh-accent-secondary)' : 'var(--gh-text-secondary)',
                backgroundColor: isActive('/analyze') ? 'rgba(47, 129, 247, 0.1)' : 'transparent'
              }}
            >
              <Code className="h-4 w-4" />
              <span>Analyze Repo</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.login}
                    className="h-8 w-8 rounded-full border-2"
                    style={{ borderColor: 'var(--gh-border-primary)' }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--gh-text-primary)' }}>
                    {user.name || user.login}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-red-900/20"
                  style={{ color: 'var(--gh-text-secondary)' }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm font-medium"
              >
                <Github className="h-4 w-4" />
                <span>Sign in with GitHub</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar