// Test script to verify the API fix
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testSuggestions() {
    console.log('🧪 Testing suggestion endpoints...');
    
    const testData = {
        repo_url: 'https://github.com/octocat/Hello-World',
        files: ['README'],
        framework: 'pytest'
    };
    
    // Test direct endpoint
    try {
        console.log('📡 Testing direct endpoint...');
        const response = await axios.post(`${API_BASE_URL}/repo/generate-suggestions`, testData);
        console.log('✅ Direct endpoint success:', {
            suggestions_count: response.data.suggestions?.length || 0,
            has_suggestions_key: 'suggestions' in response.data,
            framework: response.data.framework
        });
    } catch (error) {
        console.log('❌ Direct endpoint failed:', error.message);
    }
    
    // Test force endpoint
    try {
        console.log('📡 Testing force endpoint...');
        const response = await axios.post(`${API_BASE_URL}/repo/force-suggestions`, testData);
        console.log('✅ Force endpoint success:', {
            suggestions_count: response.data.suggestions?.length || 0,
            has_suggestions_key: 'suggestions' in response.data,
            framework: response.data.framework
        });
    } catch (error) {
        console.log('❌ Force endpoint failed:', error.message);
    }
    
    // Test debug endpoint
    try {
        console.log('📡 Testing debug endpoint...');
        const response = await axios.post(`${API_BASE_URL}/repo/generate-suggestions-debug`, testData);
        console.log('✅ Debug endpoint success:', {
            suggestions_count: response.data.suggestions?.length || 0,
            has_suggestions_key: 'suggestions' in response.data,
            framework: response.data.framework
        });
    } catch (error) {
        console.log('❌ Debug endpoint failed:', error.message);
    }
}

testSuggestions().catch(console.error);