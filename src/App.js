import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VideoConsultation from "./components/VideoConsultation";
import { apiProxy } from "./utils/apiProxy";

// Token validation function
// const isTokenValid = () => {
//   const urlParams = new URLSearchParams(window.location.search);
  
//   // Check for required parameters or token
//   const hasAppNo = urlParams.get('app_no') || urlParams.get('appointment_id');
//   const hasToken = urlParams.get('token') || urlParams.get('session_token');
//   const hasRoomId = urlParams.get('room_id');
  
//   // Return true if any of the required parameters exist
//   // In a real application, you would validate the token with your backend
//   return hasAppNo || hasToken || hasRoomId || true; // Set to true for demo purposes
// };

function App() {
  const [token, setToken] = useState("");
  const [appointment, setAppointment] = useState({});
  const [isTokenValid, setIsTokenValid] = useState(false);

  // Debug: Check environment variables
  useEffect(() => {
    console.log('🔍 Environment Variables Debug:');
    console.log('REACT_APP_DECRYPTION_API_URL:', process.env.REACT_APP_DECRYPTION_API_URL);
    console.log('REACT_APP_DECRYPTION_KEY:', process.env.REACT_APP_DECRYPTION_KEY);
    console.log('NODE_ENV:', process.env.NODE_ENV);
  }, []);

  // Function to decrypt encoded ID parameter using the updated apiProxy
  const decryptParameter = async (encodedText) => {
    try {
      console.log('🔐 App.js: Decrypting parameter:', encodedText);
      console.log('🔐 App.js: Using apiProxy.decryptParameter()');
      
      // Use the updated apiProxy instead of hardcoded endpoint
      const result = await apiProxy.decryptParameter(encodedText);
      
      console.log('🔓 App.js: Decryption result:', result);
      return result;
    } catch (error) {
      console.error('❌ App.js: Decryption error:', error);
      throw error;
    }
  };

  // Function to get query parameters
  const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      token: params.get("token"),
      name: params.get("name"),
      date: params.get("date"),
      time: params.get("time"),
      // Add support for video consultation parameters
      app_no: params.get("app_no"),
      appointment_id: params.get("appointment_id"),
      meeting_id: params.get("meeting_id"),
      room_id: params.get("room_id"),
      username: params.get("username"),
      userid: params.get("userid"),
      department: params.get("department"),
      doctor_name: params.get("doctor_name"),
      // Add support for single encoded ID parameter
      id: params.get("id"),
    };
  };

  useEffect(() => {
    const params = getQueryParams();

    // Function to process encoded ID parameter
    const processEncodedId = async () => {
      try {
        console.log('🔐 App.js: Processing encoded ID parameter...');
        
        // Decrypt the single encoded ID
        const decryptedId = await decryptParameter(params.id);
        console.log('🔓 App.js: Decrypted ID:', decryptedId);
        
        // Parse the decrypted ID to extract individual parameters
        let appointmentId, username, userid;
        
        try {
          // Try to parse as JSON first
          const parsedData = JSON.parse(decryptedId);
          appointmentId = parsedData.app_no || parsedData.appointmentId || parsedData.id;
          username = parsedData.username || parsedData.name;
          userid = parsedData.userid || parsedData.user_id;
        } catch (parseError) {
          console.log('⚠️ App.js: Not JSON format, trying alternative parsing...');
          
          // If not JSON, try to split by delimiter (adjust delimiter as needed)
          const parts = decryptedId.split('|');
          if (parts.length >= 3) {
            appointmentId = parts[0];
            username = parts[1];
            userid = parts[2];
          } else {
            // If splitting doesn't work, use the entire decrypted value as appointment ID
            appointmentId = decryptedId;
            username = 'Patient';
            userid = 'USER1';
          }
        }
        
        console.log('✅ App.js: ID parsed successfully:', {
          appointmentId,
          username,
          userid
        });

        // Create a token from the decrypted parameters
        const videoToken = `video_${appointmentId || userid}`;
        sessionStorage.setItem("authToken", videoToken);
        sessionStorage.setItem("decryptedParams", JSON.stringify({
          app_no: appointmentId,
          username: username,
          userid: userid
        }));
        setToken(videoToken);
        console.log('🔍 App.js: Encoded ID processed, setting token:', videoToken);
        
      } catch (error) {
        console.error('❌ App.js: Failed to process encoded ID:', error);
      }
    };

    // Check for encoded ID parameter first (highest priority)
    if (params.id) {
      console.log('🔍 App.js: Encoded ID parameter detected');
      processEncodedId();
    }
    // Check for video consultation parameters
    else if (params.app_no && params.username && params.userid) {
      console.log('🔍 App.js: Video consultation parameters detected');
      const videoToken = `video_${params.app_no || params.userid}`;
      sessionStorage.setItem("authToken", videoToken);
      setToken(videoToken);
      console.log('🔍 App.js: Video consultation parameters detected, setting token:', videoToken);
    } 
    // Check for original token
    else if (params.token) {
      console.log('🔍 App.js: Token parameter detected');
      sessionStorage.setItem("authToken", params.token);
      setToken(params.token);
    } 
    // Check for saved token
    else {
      const savedToken = sessionStorage.getItem("authToken");
      if (savedToken) {
        setToken(savedToken);
        console.log('🔍 App.js: Using saved token');
      } else {
        console.log('🔍 App.js: No valid parameters found');
      }
    }

    if (params.name && params.date && params.time) {
      setAppointment({
        name: params.name,
        date: params.date,
        time: params.time,
      });
    }
  }, []);

  // Validate token (frontend mock validation)
  useEffect(() => {
    if (token) {
      // Mock validation: any token with length > 5 is valid, or video consultation tokens
      const isValidToken = token.length > 5 || token.startsWith('video_');
      setIsTokenValid(isValidToken);
      console.log('🔍 App.js: Token validation result:', { token, isValidToken });
    } else {
      console.log('🔍 App.js: No token available');
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        {/* All routes check token validation and show VideoConsultation if valid */}
        <Route 
          path="/" 
          element={
            isTokenValid ? (
              <VideoConsultation />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #962067, #A23293)',
                color: 'white',
                fontFamily: 'Roboto, sans-serif',
                textAlign: 'center'
              }}>
                <div>
                  <h1>Access Denied</h1>
                  <p>Please use a valid consultation link provided by Kauvery Hospital.</p>
                </div>
              </div>
            )
          } 
        />
        
        {/* Patient route */}
        <Route 
          path="/patient" 
          element={
            isTokenValid ? (
              <VideoConsultation />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Video consultation route */}
        <Route 
          path="/consultation" 
          element={
            isTokenValid ? (
              <VideoConsultation />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
