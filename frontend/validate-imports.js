#!/usr/bin/env node

/**
 * Simple script to validate that all imports in the project are resolvable
 * Run with: node validate-imports.js
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const srcDir = join(__dirname, 'src')

// Get all JS/JSX files recursively
function getAllFiles(dir, files = []) {
  const items = readdirSync(dir)
  
  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files)
    } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
      files.push(fullPath)
    }
  }
  
  return files
}

// Extract imports from file content
function extractImports(content) {
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g
  const imports = []
  let match
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1])
  }
  
  return imports
}

// Check if import path exists
function checkImportPath(importPath, currentFile) {
  if (importPath.startsWith('.')) {
    // Relative import
    const currentDir = dirname(currentFile)
    const resolvedPath = resolve(currentDir, importPath)
    
    // Try different extensions
    const extensions = ['', '.js', '.jsx', '/index.js', '/index.jsx']
    
    for (const ext of extensions) {
      try {
        const fullPath = resolvedPath + ext
        statSync(fullPath)
        return { exists: true, path: fullPath }
      } catch (e) {
        // Continue trying
      }
    }
    
    return { exists: false, path: resolvedPath }
  } else {
    // External import (node_modules) - assume it exists
    return { exists: true, path: importPath }
  }
}

// Main validation
function validateImports() {
  console.log('🔍 Validating imports...\n')
  
  const files = getAllFiles(srcDir)
  let totalImports = 0
  let invalidImports = 0
  const issues = []
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const imports = extractImports(content)
    totalImports += imports.length
    
    for (const importPath of imports) {
      const result = checkImportPath(importPath, file)
      
      if (!result.exists) {
        invalidImports++
        issues.push({
          file: file.replace(srcDir, 'src'),
          import: importPath,
          resolved: result.path
        })
      }
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ All imports are valid!')
    console.log(`📊 Checked ${totalImports} imports across ${files.length} files`)
  } else {
    console.log('❌ Found invalid imports:\n')
    
    for (const issue of issues) {
      console.log(`📁 ${issue.file}`)
      console.log(`   ❌ import '${issue.import}'`)
      console.log(`   📍 Resolved to: ${issue.resolved}`)
      console.log('')
    }
    
    console.log(`📊 ${invalidImports}/${totalImports} imports are invalid`)
    process.exit(1)
  }
}

// Run validation
try {
  validateImports()
} catch (error) {
  console.error('❌ Validation failed:', error.message)
  process.exit(1)
}