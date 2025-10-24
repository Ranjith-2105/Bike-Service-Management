// Test script to verify all servers are working
const axios = require('axios');

async function testServer(name, url, endpoint = '') {
  try {
    console.log(`🔍 Testing ${name}...`);
    const response = await axios.get(`${url}${endpoint}`, { timeout: 5000 });
    console.log(`✅ ${name}: ${response.status} - ${response.statusText}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function testChatbot() {
  try {
    console.log('🔍 Testing Chatbot API...');
    const response = await axios.post('http://localhost:5000/api/chat', {
      text: 'Hello, test message'
    }, { timeout: 10000 });
    console.log(`✅ Chatbot API: Response received`);
    return true;
  } catch (error) {
    console.log(`❌ Chatbot API: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing all servers...\n');
  
  const results = await Promise.all([
    testServer('Main Server', 'http://localhost:3001'),
    testServer('Chatbot Health', 'http://localhost:5000', '/health'),
    testServer('Frontend', 'http://localhost:5173'),
    testChatbot()
  ]);
  
  const successCount = results.filter(Boolean).length;
  const totalCount = results.length;
  
  console.log(`\n📊 Test Results: ${successCount}/${totalCount} servers working`);
  
  if (successCount === totalCount) {
    console.log('🎉 All servers are working correctly!');
  } else {
    console.log('⚠️ Some servers need attention.');
  }
}

// Run tests after a delay to allow servers to start
setTimeout(runTests, 10000);

