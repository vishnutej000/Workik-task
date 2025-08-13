// Application constants
export const CONSTANTS = {
  // UI Configuration
  UI: {
    MAX_FILE_PREVIEW_SIZE: 2000, // characters
    DEFAULT_PAGE_SIZE: 20,
    MAX_FILES_TO_SHOW: 20,
    ANIMATION_DURATION: 300, // milliseconds
  },
  
  // File types and extensions
  FILE_TYPES: {
    CODE_EXTENSIONS: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'rb', 'php', 'cs', 'cpp', 'c', 'rs', 'kt', 'swift'],
    CONFIG_EXTENSIONS: ['json', 'yaml', 'yml', 'toml', 'ini', 'cfg'],
    MARKUP_EXTENSIONS: ['html', 'xml', 'md', 'rst'],
    STYLE_EXTENSIONS: ['css', 'scss', 'sass', 'less'],
  },
  
  // Language colors for badges
  LANGUAGE_COLORS: {
    'JavaScript': 'bg-yellow-100 text-yellow-800',
    'TypeScript': 'bg-blue-100 text-blue-800',
    'Python': 'bg-green-100 text-green-800',
    'Java': 'bg-red-100 text-red-800',
    'Go': 'bg-cyan-100 text-cyan-800',
    'Ruby': 'bg-red-100 text-red-800',
    'PHP': 'bg-purple-100 text-purple-800',
    'C#': 'bg-purple-100 text-purple-800',
    'C++': 'bg-blue-100 text-blue-800',
    'HTML': 'bg-orange-100 text-orange-800',
    'CSS': 'bg-blue-100 text-blue-800',
    'Rust': 'bg-orange-100 text-orange-800',
    'Kotlin': 'bg-purple-100 text-purple-800',
    'Swift': 'bg-orange-100 text-orange-800',
    'DEFAULT': 'bg-gray-100 text-gray-800'
  },
  
  // API Configuration
  API: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },
  
  // Test Framework Configuration
  FRAMEWORKS: {
    SELENIUM: 'selenium',
    JEST: 'jest',
    PYTEST: 'pytest',
    JUNIT: 'junit',
    CYPRESS: 'cypress',
    PLAYWRIGHT: 'playwright',
    RSPEC: 'rspec',
    TESTING: 'testing', // Go
  },
  
  // File size limits
  FILE_SIZE: {
    MAX_UPLOAD: 10 * 1024 * 1024, // 10MB
    MAX_PREVIEW: 1024 * 1024, // 1MB
  },
  
  // Messages
  MESSAGES: {
    LOADING: 'Loading...',
    ERROR_GENERIC: 'Something went wrong. Please try again.',
    ERROR_NETWORK: 'Network error. Please check your connection.',
    ERROR_AUTH: 'Authentication failed. Please login again.',
    SUCCESS_GENERIC: 'Operation completed successfully.',
  }
}

export default CONSTANTS