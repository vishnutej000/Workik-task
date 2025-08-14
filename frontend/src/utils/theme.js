// GitHub theme utility functions

export const ghTheme = {
  // Background colors
  bg: {
    primary: 'var(--gh-bg-primary)',
    secondary: 'var(--gh-bg-secondary)', 
    tertiary: 'var(--gh-bg-tertiary)',
    overlay: 'var(--gh-bg-overlay)'
  },
  
  // Text colors
  text: {
    primary: 'var(--gh-text-primary)',
    secondary: 'var(--gh-text-secondary)',
    tertiary: 'var(--gh-text-tertiary)'
  },
  
  // Border colors
  border: {
    primary: 'var(--gh-border-primary)',
    secondary: 'var(--gh-border-secondary)'
  },
  
  // Accent colors
  accent: {
    primary: 'var(--gh-accent-primary)',
    secondary: 'var(--gh-accent-secondary)',
    danger: 'var(--gh-accent-danger)',
    warning: 'var(--gh-accent-warning)'
  }
}

// Helper function to create GitHub-styled components
export const ghStyles = {
  card: {
    backgroundColor: ghTheme.bg.secondary,
    border: `1px solid ${ghTheme.border.primary}`,
    borderRadius: '8px',
    color: ghTheme.text.primary
  },
  
  button: {
    primary: {
      backgroundColor: ghTheme.accent.primary,
      color: 'white',
      border: `1px solid ${ghTheme.accent.primary}`,
      borderRadius: '6px'
    },
    
    secondary: {
      backgroundColor: ghTheme.bg.tertiary,
      color: ghTheme.text.primary,
      border: `1px solid ${ghTheme.border.primary}`,
      borderRadius: '6px'
    }
  },
  
  input: {
    backgroundColor: ghTheme.bg.primary,
    border: `1px solid ${ghTheme.border.primary}`,
    borderRadius: '6px',
    color: ghTheme.text.primary
  },
  
  codeBlock: {
    backgroundColor: ghTheme.bg.primary,
    border: `1px solid ${ghTheme.border.primary}`,
    borderRadius: '6px',
    color: ghTheme.text.primary,
    fontFamily: "'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace"
  }
}

// Language color mapping for GitHub theme
export const getLanguageColor = (language) => {
  const colors = {
    'JavaScript': { bg: 'rgba(241, 224, 90, 0.15)', text: '#f1e05a', border: '#f1e05a' },
    'TypeScript': { bg: 'rgba(49, 120, 198, 0.15)', text: '#3178c6', border: '#3178c6' },
    'Python': { bg: 'rgba(53, 114, 165, 0.15)', text: '#3572a5', border: '#3572a5' },
    'Java': { bg: 'rgba(176, 114, 25, 0.15)', text: '#b07219', border: '#b07219' },
    'Go': { bg: 'rgba(0, 173, 216, 0.15)', text: '#00add8', border: '#00add8' },
    'Ruby': { bg: 'rgba(112, 21, 22, 0.15)', text: '#701516', border: '#701516' },
    'PHP': { bg: 'rgba(79, 93, 149, 0.15)', text: '#4f5d95', border: '#4f5d95' },
    'C#': { bg: 'rgba(35, 134, 54, 0.15)', text: '#239a3b', border: '#239a3b' },
    'C++': { bg: 'rgba(243, 75, 125, 0.15)', text: '#f34b7d', border: '#f34b7d' },
    'HTML': { bg: 'rgba(227, 76, 38, 0.15)', text: '#e34c26', border: '#e34c26' },
    'CSS': { bg: 'rgba(21, 114, 182, 0.15)', text: '#1572b6', border: '#1572b6' },
    'Rust': { bg: 'rgba(222, 165, 132, 0.15)', text: '#dea584', border: '#dea584' },
    'Kotlin': { bg: 'rgba(167, 136, 255, 0.15)', text: '#a97bff', border: '#a97bff' },
    'Swift': { bg: 'rgba(250, 109, 58, 0.15)', text: '#fa7343', border: '#fa7343' }
  }
  
  return colors[language] || { bg: 'rgba(139, 148, 158, 0.15)', text: '#8b949e', border: '#8b949e' }
}

export default ghTheme