// Environment configuration
export const ENV = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'TestGen AI',
  
  // Feature Flags
  GITHUB_OAUTH_ENABLED: import.meta.env.VITE_GITHUB_OAUTH_ENABLED === 'true',
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  
  // Development flags
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      GITHUB: '/auth/github',
      CALLBACK: '/auth/callback',
      USER: '/auth/user',
      LOGOUT: '/auth/logout'
    },
    REPOSITORIES: '/repositories',
    ANALYZE: '/repo/analyze',
    GENERATE_SUGGESTIONS: '/generate-test-suggestions',
    GENERATE_CODE: '/generate-test-code',
    CREATE_PR: '/create-pull-request',
    FRAMEWORKS: '/frameworks',
    HEALTH: '/health',
    DEBUG_AI: '/debug/ai-test'
  },
  
  // UI Configuration
  UI: {
    THEME: import.meta.env.VITE_THEME || 'light',
    LANGUAGE: import.meta.env.VITE_LANGUAGE || 'en'
  }
}

// Validation function to ensure required env vars are set
export const validateEnv = () => {
  const required = ['VITE_API_BASE_URL']
  const missing = required.filter(key => !import.meta.env[key])
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing)
  }
  
  return missing.length === 0
}

// Development logging
export const logEnvInfo = () => {
  if (ENV.IS_DEV) {
    console.group('🔧 Environment Configuration')
    console.log('API Base URL:', ENV.API_BASE_URL)
    console.log('App Name:', ENV.APP_NAME)
    console.log('Mode:', ENV.MODE)
    console.log('GitHub OAuth:', ENV.GITHUB_OAUTH_ENABLED ? 'Enabled' : 'Disabled')
    console.log('Debug Mode:', ENV.DEBUG_MODE ? 'Enabled' : 'Disabled')
    console.groupEnd()
  }
}

// Initialize environment validation and logging
validateEnv()
logEnvInfo()

export default ENV