const { app } = require('@azure/functions');
const axios = require('axios');

// Configuration
const config = {
  hmsApiUrl: process.env.HMS_API_BASE_URL || "http://192.168.44.18/Encryfile/api/values/decrypt",
  decryptionKey: process.env.DECRYPTION_KEY || "sfrwYIgtcgsRdwjo",
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    'https://videoconsultation-fsb6dbejh3c9htfn.canadacentral-01.azurewebsites.net',
    'http://localhost:3000',
    'https://localhost:3000'
  ]
};

// HTTP trigger for decryption proxy
app.http('DecryptionProxy', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('origin');
      
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': config.allowedOrigins.includes(origin) ? origin : config.allowedOrigins[0],
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        },
        body: ''
      };
    }

    try {
      const origin = request.headers.get('origin');
      
      // Set CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': config.allowedOrigins.includes(origin) ? origin : config.allowedOrigins[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      };

      // Parse request body
      const { text } = await request.json();

      if (!text) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: 'Encoded text is required'
          })
        };
      }

      console.log('🔐 Decryption request received for text:', text.substring(0, 20) + '...');

      // Call the new local API for decryption
      const decryptionResponse = await axios.post(config.hmsApiUrl, {
        key: config.decryptionKey,
        text: text
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Decryption successful');

      // Return the decrypted result
      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          decryptedText: decryptionResponse.data.decryptedText || decryptionResponse.data.text || decryptionResponse.data.value || decryptionResponse.data
        })
      };

    } catch (error) {
      console.error('❌ Decryption error:', error.message);
      
      const origin = request.headers.get('origin');
      const corsHeaders = {
        'Access-Control-Allow-Origin': config.allowedOrigins.includes(origin) ? origin : config.allowedOrigins[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      };

      // Return error response
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Decryption failed',
          details: error.message
        })
      };
    }
  }
}); 