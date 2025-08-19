// Environment Configuration
export const config = {
  // Zego Video SDK Credentials
  zego: {
    appId: process.env.REACT_APP_ZEGO_APP_ID || 167959465,
    serverSecret: process.env.REACT_APP_ZEGO_SERVER_SECRET || "1c7c018987d37f50cf8adbbfe9909415"
  },

  // API Configuration
  api: {
    baseUrl: process.env.REACT_APP_DECRYPTION_API_URL || "http://192.168.44.18/Encryfile/api/values/decrypt",
    decryptionKey: process.env.REACT_APP_DECRYPTION_KEY || "sfrwYIgtcgsRdwjo"
  },

  // Application Configuration
  app: {
    name: process.env.REACT_APP_APP_NAME || "Kauvery Hospital Video Consultation",
    version: process.env.REACT_APP_APP_VERSION || "1.0.0",
    debugMode: process.env.REACT_APP_DEBUG_MODE === 'true' || true,
    logLevel: process.env.REACT_APP_LOG_LEVEL || "debug"
  }
};

// Helper function to get Zego credentials
export const getZegoCredentials = () => {
  return {
    appId: config.zego.appId,
    serverSecret: config.zego.serverSecret
  };
};

// Helper function to get API configuration
export const getApiConfig = () => {
  return {
    baseUrl: config.api.baseUrl,
    decryptionKey: config.api.decryptionKey
  };
};

// Helper function to check if running in development
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

// Helper function to check if debug mode is enabled
export const isDebugMode = () => {
  return config.app.debugMode;
};

export default config; 