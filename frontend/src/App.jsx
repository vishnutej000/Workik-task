import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import RepoAnalyzer from './pages/RepoAnalyzer'
import TestGenerator from './pages/TestGenerator'
import Dashboard from './pages/Dashboard'
import RepositoryDetails from './pages/RepositoryDetails'
import AuthCallback from './pages/AuthCallback'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--gh-bg-primary)' }}>
          <Routes>
            {/* Auth callback route - no navbar */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Main app routes - with navbar */}
            <Route path="/*" element={
              <>
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/repository/:repoPath" element={<RepositoryDetails />} />
                    <Route path="/analyze" element={<RepoAnalyzer />} />
                    <Route path="/generate" element={<TestGenerator />} />
                  </Routes>
                </main>
              </>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App