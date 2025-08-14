import { Github, Bot } from 'lucide-react'

const AppIcon = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }
  
  const iconSize = sizeClasses[size] || sizeClasses.md
  const botSize = size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'
  
  return (
    <div className={`relative ${className}`}>
      <Github 
        className={iconSize} 
        style={{ color: 'var(--gh-text-primary)' }} 
      />
      <div 
        className={`absolute -bottom-1 -right-1 rounded-full p-1`}
        style={{ backgroundColor: 'var(--gh-accent-secondary)' }}
      >
        <Bot className={`${botSize} text-white`} />
      </div>
    </div>
  )
}

export default AppIcon