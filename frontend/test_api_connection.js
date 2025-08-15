// Test API Connection from Browser Console
// Copy and paste this into your browser console when on the frontend

async function testAPIConnection() {
  console.log('🧪 Testing API Connection...');
  
  // Test 1: Health check
  try {
    const healthResponse = await fetch('http://localhost:8000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
  } catch (error) {
    console.error('❌ Health Check Failed:', error);
    return;
  }
  
  // Test 2: Force suggestions endpoint
  try {
    const testData = {
      repo_url: "https://github.com/test/test",
      files: ["test.py"],
      framework: "pytest"
    };
    
    const response = await fetch('http://localhost:8000/repo/force-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    console.log('✅ Force Suggestions Test:', data);
    console.log(`📊 Suggestions Count: ${data.suggestions?.length || 0}`);
    
    if (data.suggestions && data.suggestions.length > 0) {
      console.log('🎉 API is working! The issue is in the frontend-backend integration.');
      console.log('📋 Sample suggestions:');
      data.suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.summary}`);
      });
    } else {
      console.log('❌ API returned 0 suggestions');
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    console.log('🔧 Possible issues:');
    console.log('  1. Backend server not running');
    console.log('  2. CORS issues');
    console.log('  3. Network connectivity');
    console.log('  4. Port mismatch (backend should be on 8000)');
  }
}

// Run the test
testAPIConnection();