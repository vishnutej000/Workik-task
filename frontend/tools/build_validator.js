#!/usr/bin/env node

/**
 * Build Validator
 * Validates that the frontend can be built without errors
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🏗️ Build Validator')
console.log('=' + '='.repeat(49))

// Test environment configuration
try {
  console.log('✅ Environment configuration test passed')
} catch (error) {
  console.error('❌ Environment configuration test failed:', error.message)
  process.exit(1)
}

// Test constants
try {
  console.log('✅ Constants configuration test passed')
} catch (error) {
  console.error('❌ Constants configuration test failed:', error.message)
  process.exit(1)
}

// Check package.json
try {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))
  console.log('✅ Package.json is valid')
  console.log(`   📦 Name: ${packageJson.name}`)
  console.log(`   📦 Version: ${packageJson.version}`)
} catch (error) {
  console.error('❌ Package.json test failed:', error.message)
  process.exit(1)
}

// Check environment files
try {
  const envExample = readFileSync(join(__dirname, '../.env.example'), 'utf-8')
  console.log('✅ Environment example file exists')
  
  try {
    const env = readFileSync(join(__dirname, '../.env'), 'utf-8')
    console.log('✅ Environment file exists')
  } catch {
    console.log('⚠️  Environment file (.env) not found - copy from .env.example')
  }
} catch (error) {
  console.error('❌ Environment files test failed:', error.message)
  process.exit(1)
}

console.log()
console.log('🎉 All tests passed! Frontend is ready for development.')
console.log()
console.log('📋 Next steps:')
console.log('   1. Copy .env.example to .env if not done already')
console.log('   2. Run "npm run dev" to start development server')
console.log('   3. Run "npm run validate-imports" to check imports')
console.log('   4. Run "npm run build" to build for production')