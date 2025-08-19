// Test script for new local decryption API
const axios = require('axios');

// Configuration
const config = {
  localApiUrl: 'http://192.168.44.18/Encryfile/api/values/decrypt',
  testEncodedText: 'ODFlvLi0k4Ahvs6YIHnKCbJ//F1frN/vbVq+1c55QOZ1oa3keYEEZjCHHyvID7X5jfNNotg52mwz1TKIzOGJRw==',
  decryptionKey: 'sfrwYIgtcgsRdwjo'
};

async function testLocalAPI() {
  console.log('🧪 Testing new local decryption API...');
  console.log('📍 API URL:', config.localApiUrl);
  console.log('🔐 Test encoded text:', config.testEncodedText.substring(0, 20) + '...');
  console.log('🔑 Decryption key:', config.decryptionKey.substring(0, 10) + '...');
  
  try {
    // Test 1: Check if API is accessible
    console.log('\n1️⃣ Testing API accessibility...');
    const healthCheck = await axios.get(config.localApiUrl.replace('/api/values/decrypt', ''), {
      timeout: 5000
    });
    console.log('✅ API server is accessible');
    console.log('📋 Server response:', healthCheck.status);
    
  } catch (error) {
    console.log('⚠️ API server health check failed (this is normal if the endpoint doesn\'t support GET)');
  }
  
  try {
    // Test 2: Actual decryption request
    console.log('\n2️⃣ Testing decryption request...');
    const decryptionResponse = await axios.post(config.localApiUrl, {
      key: config.decryptionKey,
      text: config.testEncodedText
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Decryption request successful');
    console.log('📋 Response status:', decryptionResponse.status);
    console.log('📋 Response headers:', decryptionResponse.headers);
    console.log('📋 Response data:', decryptionResponse.data);
    
    if (decryptionResponse.data) {
      console.log('🎉 Local API is working correctly!');
      console.log('🔓 Decrypted result:', decryptionResponse.data.decryptedText || decryptionResponse.data.text || decryptionResponse.data.value || decryptionResponse.data);
    } else {
      console.log('❌ Decryption failed: No data returned');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📋 Error response status:', error.response.status);
      console.error('📋 Error response data:', error.response.data);
      console.error('📋 Error response headers:', error.response.headers);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 The local API server is not running or not accessible');
      console.error('💡 Check if the server at 192.168.44.18 is running');
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 The local API URL is not found. Check the IP address and endpoint.');
    }
    
    if (error.code === 'ETIMEDOUT') {
      console.error('💡 Request timed out. The API server might be slow or overloaded.');
    }
    
    if (error.response && error.response.status === 404) {
      console.error('💡 The API endpoint is not found (404). Check the URL path.');
    }
    
    if (error.response && error.response.status === 500) {
      console.error('💡 Server error (500). Check the API server logs.');
    }
  }
}

// Test network connectivity
async function testNetworkConnectivity() {
  console.log('\n🌐 Testing network connectivity...');
  
  try {
    const pingResponse = await axios.get('http://192.168.44.18', {
      timeout: 3000
    });
    console.log('✅ Network connectivity to 192.168.44.18 is working');
  } catch (error) {
    console.log('⚠️ Network connectivity test failed:', error.message);
    console.log('💡 This might be normal if the server doesn\'t respond to GET requests');
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting local API tests...\n');
  
  await testNetworkConnectivity();
  await testLocalAPI();
  
  console.log('\n🏁 Test completed');
}

runTests().catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
}); 