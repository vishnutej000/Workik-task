# TestGen AI Frontend

A modern React application for generating AI-powered test cases for your code repositories.

## Features

- 🔐 **GitHub OAuth Integration** - Secure authentication with GitHub
- 📁 **Repository Management** - Browse and manage your GitHub repositories
- 🧪 **Inline Test Generation** - Generate test suggestions directly in the dashboard
- 📄 **File Browser** - Explore repository files with syntax highlighting
- 🎯 **Multi-Framework Support** - Supports Selenium, Jest, pytest, JUnit, and more
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_APP_NAME=TestGen AI
   VITE_GITHUB_OAUTH_ENABLED=true
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run clean` - Clean build artifacts

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navbar.jsx      # Navigation component
├── config/             # Configuration files
│   ├── env.js         # Environment configuration
│   └── constants.js   # Application constants
├── context/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── pages/             # Page components
│   ├── Home.jsx       # Landing page
│   ├── Dashboard.jsx  # User dashboard
│   ├── RepositoryDetails.jsx # Repository file browser
│   ├── RepoAnalyzer.jsx # Public repo analysis
│   ├── TestGenerator.jsx # Test code generation
│   └── AuthCallback.jsx # OAuth callback handler
├── services/          # API services
│   └── api.js        # HTTP client and API calls
├── utils/            # Utility functions
│   └── helpers.js    # Common helper functions
├── App.jsx           # Main app component
└── main.jsx         # React entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_APP_NAME` | Application name | `TestGen AI` |
| `VITE_GITHUB_OAUTH_ENABLED` | Enable GitHub OAuth | `true` |

## Features Overview

### 🏠 Home Page
- Welcome screen with feature overview
- Login with GitHub button
- Quick access to public repository analysis

### 📊 Dashboard
- List of user's GitHub repositories
- Inline test generation with file selection
- Repository statistics and information
- Quick actions for each repository

### 📁 Repository Details
- File browser organized by directories
- File content preview with syntax highlighting
- Direct links to GitHub
- File type icons and size information

### 🧪 Test Generation
- AI-powered test case suggestions
- Support for multiple testing frameworks
- Framework auto-detection based on file types
- Complete test code generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.