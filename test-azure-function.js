// Test script for Azure Function DecryptionProxy
const axios = require('axios');

// Configuration
const config = {
  azureFunctionUrl: 'https://videoconsultation-fsb6dbejh3c9htfn.canadacentral-01.azurewebsites.net/api/DecryptionProxy',
  testEncodedText: 'ODFlvLi0k4Ahvs6YIHnKCbJ//F1frN/vbVq+1c55QOZ1oa3keYEEZjCHHyvID7X5jfNNotg52mwz1TKIzOGJRw=='
};

async function testAzureFunction() {
  console.log('🧪 Testing Azure Function DecryptionProxy...');
  console.log('📍 Function URL:', config.azureFunctionUrl);
  console.log('🔐 Test encoded text:', config.testEncodedText.substring(0, 20) + '...');
  
  try {
    // Test 1: CORS preflight request
    console.log('\n1️⃣ Testing CORS preflight request...');
    const preflightResponse = await axios.options(config.azureFunctionUrl, {
      headers: {
        'Origin': 'https://videoconsultation-fsb6dbejh3c9htfn.canadacentral-01.azurewebsites.net',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('✅ CORS preflight successful');
    console.log('📋 CORS headers:', {
      'Access-Control-Allow-Origin': preflightResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': preflightResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': preflightResponse.headers['access-control-allow-headers']
    });
    
    // Test 2: Actual decryption request
    console.log('\n2️⃣ Testing decryption request...');
    const decryptionResponse = await axios.post(config.azureFunctionUrl, {
      text: config.testEncodedText
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://videoconsultation-fsb6dbejh3c9htfn.canadacentral-01.azurewebsites.net'
      },
      timeout: 10000
    });
    
    console.log('✅ Decryption request successful');
    console.log('📋 Response status:', decryptionResponse.status);
    console.log('📋 Response data:', decryptionResponse.data);
    
    if (decryptionResponse.data.success) {
      console.log('🎉 Azure Function is working correctly!');
      console.log('🔓 Decrypted result:', decryptionResponse.data.decryptedText);
    } else {
      console.log('❌ Decryption failed:', decryptionResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📋 Error response status:', error.response.status);
      console.error('📋 Error response data:', error.response.data);
      console.error('📋 Error response headers:', error.response.headers);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 The Azure Function might not be deployed yet or the URL is incorrect');
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 The Azure Function URL is not found. Check the URL and deployment status');
    }
    
    if (error.response && error.response.status === 404) {
      console.error('💡 The Azure Function is not found (404). Please deploy the function first.');
      console.error('💡 Follow the deployment guide in AZURE_FUNCTION_DEPLOYMENT.md');
    }
  }
}

// Run the test
testAzureFunction().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
}); 