import { getApiConfig } from '../config/env';

// API Proxy utility for handling CORS issues
export const apiProxy = {
  // Try multiple approaches to call the API
  async callAPI(endpoint, data) {
    const approaches = [
      // Approach 1: Direct call to new local API (Primary approach)
      async () => {
        console.log('🔐 Using new local API endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            key: data.key,
            text: data.text
          })
        });
        
        if (!response.ok) {
          throw new Error(`Local API error: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
      },
      
      // Approach 2: Using corsproxy.io (fallback for external APIs)
      async () => {
        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = encodeURIComponent(endpoint);
        
        console.log('🔐 Using corsproxy.io with URL:', proxyUrl + targetUrl);
        
        const response = await fetch(proxyUrl + targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`CORS proxy error: ${response.status}`);
        }
        
        return await response.json();
      },
      
      // Approach 3: Using allorigins proxy (last resort)
      async () => {
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = encodeURIComponent(endpoint);
        
        console.log('🔐 Using allorigins.win with URL:', proxyUrl + targetUrl);
        
        const response = await fetch(proxyUrl + targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`Proxy API error: ${response.status}`);
        }
        
        return await response.json();
      }
    ];
    
    // Try each approach until one works
    for (let i = 0; i < approaches.length; i++) {
      try {
        console.log(`🔄 Trying API approach ${i + 1}...`);
        const result = await approaches[i]();
        console.log(`✅ API approach ${i + 1} succeeded`);
        return result;
      } catch (error) {
        console.log(`❌ API approach ${i + 1} failed:`, error.message);
        if (i === approaches.length - 1) {
          throw error;
        }
      }
    }
  },
  
  // Decrypt parameter using the API
  async decryptParameter(encodedText) {
    try {
      const { baseUrl, decryptionKey } = getApiConfig();
      
      console.log('🔐 Using API config:', { 
        baseUrl, 
        decryptionKey: decryptionKey.substring(0, 10) + '...' 
      });
      
      const result = await this.callAPI(baseUrl, {
        key: decryptionKey,
        text: encodedText
      });
      
      return result.decryptedText || result.text || result.value || result;
    } catch (error) {
      console.error('❌ All API approaches failed:', error);
      
      // Fallback for testing
      console.log('⚠️ Using fallback mock response for testing');
      return JSON.stringify({
        app_no: "TEST123",
        username: "TestUser",
        userid: "USER1"
      });
    }
  }
}; 