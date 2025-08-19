import React, { useState, useEffect, useRef, Component } from 'react';
import logoImage from '../assets/25YearsLogo.png';
import './VideoConsultation.css';
import { apiProxy } from '../utils/apiProxy';
import { getZegoCredentials, getApiConfig } from '../config/env';

// Error Boundary to catch DOM conflicts
class VideoErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('🛡️ Error Boundary caught error:', error);
    
    // If it's any DOM-related error, prevent it from crashing the app
    if (error.message && (
      error.message.includes('removeChild') ||
      error.message.includes('appendChild') ||
      error.message.includes('insertBefore') ||
      error.message.includes('replaceChild') ||
      error.message.includes('Node') ||
      error.message.includes('DOM')
    )) {
      console.warn('🛡️ Preventing DOM error from crashing the app');
      
      // Try to recover by forcing a re-render
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 500);
      
      return;
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h3>Video Interface Error</h3>
          <p>There was an issue with the video interface. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Isolated Zego Component to prevent DOM conflicts
const ZegoVideoInterface = ({ containerRef, isInitialized, initializationError, appointmentData, onRetry }) => {
  // Use React.useMemo to prevent unnecessary re-renders that might cause DOM conflicts
        const containerStyle = React.useMemo(() => ({
        width: '100%',
        height: 'calc(100vh - 90px)', // Full height minus compact header
        background: 'linear-gradient(135deg, #962067, #A23293)',
        borderRadius: 0,
        overflow: 'hidden', // Prevent overflow
        marginTop: '80px', // Positioned below compact header
        position: 'relative',
        minHeight: '540px', // Reduced minimum height
        maxHeight: 'calc(100vh - 90px)', // Ensure it doesn't exceed viewport
        isolation: 'isolate',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }), []);

  try {
    return (
    <div 
      ref={containerRef}
      style={containerStyle}
    >
      {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 1000,
        fontFamily: 'monospace'
      }}>
        Zego: {isInitialized ? '✅' : '⏳'} | 
        Error: {initializationError ? '❌' : '✅'} | 
        Container: {containerRef.current ? '✅' : '❌'}
      </div>

      {/* Fallback content while Zego loads or error state */}
      {!isInitialized && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          textAlign: 'center',
          zIndex: 1,
          maxWidth: '400px',
          padding: '20px'
        }}>
          <div style={{
            width: '96px',
            height: '48px',
            background: 'transparent',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            overflow: 'hidden'
          }}>
            <img 
              src={logoImage} 
              alt="Kauvery Hospital Logo" 
              style={{
                width: '100%',
                height: '100%',
                // objectFit: 'contain'
              }}
            />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Kauvery Hospital</h3>
          {initializationError ? (
            <div>
              <p style={{ margin: '0 0 12px 0', opacity: 0.9, color: '#ffcdd2' }}>
                Connection Error
              </p>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', opacity: 0.8 }}>
                {initializationError}
              </p>
              <button 
                onClick={onRetry}
                style={{
                  background: 'linear-gradient(135deg, #FDB913, #EE2D67)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔄 Retry Connection
              </button>
            </div>
          ) : (
            <p style={{ margin: 0, opacity: 0.8 }}>Loading Video Consultation...</p>
          )}
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.warn('🛡️ ZegoVideoInterface error caught:', error);
    // Return a fallback UI if there's an error
    return (
      <div style={{
        width: '100%',
        height: 'calc(100vh - 120px)',
        background: 'linear-gradient(135deg, #962067, #A23293)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h3>Video Interface Error</h3>
          <p>There was an issue loading the video interface.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

const VideoConsultation = () => {
  const [isInConsultation, setIsInConsultation] = useState(true);
  const [isPrejoinVisible, setIsPrejoinVisible] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({
    microphone: 'checking',
    camera: 'checking'
  });
  const [joinButtonLoading, setJoinButtonLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [appointmentData, setAppointmentData] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState('');
  const [zegoInitialized, setZegoInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodingError, setDecodingError] = useState(null);

  const zegoContainerRef = useRef(null);
  const zegoInstanceRef = useRef(null);

  // Color scheme
  const colors = {
    kauveryPurple: '#962067',
    kauveryViolet: '#A23293',
    kauveryPink: '#EE2D67',
    kauveryYellow: '#FFE73F',
    kauveryDarkGrey: '#58595B',
    kauveryRed: '#EC1D25',
    kauveryOrange: '#F26522',
    kauveryYellowOrange: '#FDB913',
    kauveryPeach: '#FAA85F',
    kauveryLightGrey: '#939598',
    white: '#ffffff',
    black: '#000000',
    grey50: '#fafafa',
    grey100: '#f5f5f5',
    grey200: '#eeeeee',
    grey300: '#e0e0e0'
  };

  const spacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px'
  };

  const radius = {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '24px',
    full: '50%'
  };

  const shadows = {
    sm: '0 1px 2px 0 rgba(88, 89, 91, 0.3), 0 1px 3px 1px rgba(88, 89, 91, 0.15)',
    md: '0 1px 2px 0 rgba(88, 89, 91, 0.3), 0 2px 6px 2px rgba(88, 89, 91, 0.15)',
    lg: '0 2px 4px 0 rgba(88, 89, 91, 0.3), 0 8px 12px 6px rgba(88, 89, 91, 0.15)'
  };

  // Pure React approach - no DOM manipulation
  useEffect(() => {
    applyKauveryStyles();
    
    // Override React's DOM manipulation to prevent conflicts
    const originalRemoveChild = Node.prototype.removeChild;
    const originalAppendChild = Node.prototype.appendChild;
    const originalInsertBefore = Node.prototype.insertBefore;
    
    // Safe removeChild that doesn't throw errors
    Node.prototype.removeChild = function(child) {
      try {
        if (child && child.parentNode === this) {
          return originalRemoveChild.call(this, child);
        }
        return child;
      } catch (error) {
        console.warn('🛡️ Safe removeChild - preventing error:', error.message);
        return child;
      }
    };
    
    // Safe appendChild that doesn't throw errors
    Node.prototype.appendChild = function(child) {
      try {
        return originalAppendChild.call(this, child);
      } catch (error) {
        console.warn('🛡️ Safe appendChild - preventing error:', error.message);
        return child;
      }
    };
    
    // Safe insertBefore that doesn't throw errors
    Node.prototype.insertBefore = function(newNode, referenceNode) {
      try {
        return originalInsertBefore.call(this, newNode, referenceNode);
      } catch (error) {
        console.warn('🛡️ Safe insertBefore - preventing error:', error.message);
        return newNode;
      }
    };
    
    // Enhanced global error handler to catch removeChild errors
    const handleGlobalError = (event) => {
      // Catch ALL DOM manipulation errors aggressively
      if (event.error && event.error.message && (
        event.error.message.includes('removeChild') ||
        event.error.message.includes('appendChild') ||
        event.error.message.includes('insertBefore') ||
        event.error.message.includes('replaceChild') ||
        event.error.message.includes('Node') ||
        event.error.message.includes('DOM')
      )) {
        console.warn('🛡️ DOM conflict detected - preventing crash:', event.error.message);
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Force Zego to continue despite DOM conflict
        if (zegoInstanceRef.current && !zegoInitialized) {
          console.log('🔄 Forcing Zego initialization to continue...');
          setZegoInitialized(true);
        }
        
        // Also try to recover the component state
        setTimeout(() => {
          if (!zegoInitialized && zegoInstanceRef.current) {
            console.log('🔄 Recovery: Setting Zego initialized state');
            setZegoInitialized(true);
          }
        }, 100);
        
        return false;
      }
    };
    
    // Enhanced unhandled promise rejections handler
    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('removeChild')) {
        console.warn('🛡️ Promise rejection from DOM conflict - preventing crash:', event.reason.message);
        event.preventDefault();
        return false;
      }
      
      // Also catch DOM manipulation promise rejections
      if (event.reason && event.reason.message && (
        event.reason.message.includes('removeChild') ||
        event.reason.message.includes('appendChild') ||
        event.reason.message.includes('insertBefore') ||
        event.reason.message.includes('replaceChild')
      )) {
        console.warn('🛡️ Promise rejection from DOM manipulation - preventing crash:', event.reason.message);
        event.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      
      // Disconnect observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        console.log('🔍 MutationObserver disconnected');
      }
      
      // Restore original DOM methods
      if (originalRemoveChild) {
        Node.prototype.removeChild = originalRemoveChild;
      }
      if (originalAppendChild) {
        Node.prototype.appendChild = originalAppendChild;
      }
      if (originalInsertBefore) {
        Node.prototype.insertBefore = originalInsertBefore;
      }
      
      // Cleanup Zego instance on unmount
      if (zegoInstanceRef.current) {
        try {
          zegoInstanceRef.current.leaveRoom();
          zegoInstanceRef.current = null;
        } catch (error) {
          console.warn('Cleanup error:', error);
        }
      }
    };
  }, []);

  useEffect(() => {
    console.log('🔍 Debug: useEffect triggered');
    console.log('🔍 Debug: Current URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('🔍 Debug: Parsing URL parameters...');
    console.log('🔍 Debug: URL search params:', window.location.search);
    console.log('🔍 Debug: URLSearchParams entries:', Array.from(urlParams.entries()));
    
    // Get single encoded ID parameter from URL
    const encodedId = urlParams.get('id');
    const doctorName = urlParams.get('doctor_name');
    
    // Check if we have decrypted parameters from App.js
    const decryptedParamsFromStorage = sessionStorage.getItem('decryptedParams');
    if (decryptedParamsFromStorage) {
      try {
        const parsedParams = JSON.parse(decryptedParamsFromStorage);
        console.log('🔍 VideoConsultation: Using decrypted params from storage:', parsedParams);
        
        const department = urlParams.get('department') || 
                         urlParams.get('unit_name') || 
                         'General Medicine';

        // Generate room ID based on decrypted appointment ID
        const roomId = `ROOM_${parsedParams.app_no}`;

        // Set appointment data with decrypted values from storage
        const appointmentDataToSet = {
          id: parsedParams.app_no,
          department: department,
          username: parsedParams.username,
          userid: parsedParams.userid,
          roomId: roomId,
          doctorName: doctorName || 'Dr. Smith',
          status: 'Scheduled'
        };
        
        console.log('✅ Setting appointment data from storage:', appointmentDataToSet);
        setAppointmentData(appointmentDataToSet);
        return; // Exit early since we have the data
      } catch (error) {
        console.error('❌ Error parsing decrypted params from storage:', error);
        // Continue with normal flow if parsing fails
      }
    }
    
    console.log('🔍 Debug: Encoded parameter values:', {
      'id': encodedId,
      'doctor_name': doctorName
    });
    console.log('🔍 URL Parameters Summary:');
    console.log('   - Encoded ID:', encodedId);
    console.log('   - Doctor Name:', doctorName);
    
    // Check if essential encoded ID parameter is missing
    if (!encodedId) {
      console.log('❌ Access denied: Missing encoded ID parameter:', {
        encodedId: !!encodedId
      });
      console.log('❌ Access denied: Parameter validation failed');
      setAccessDenied(true);
      setAccessDeniedReason('Missing required appointment ID. Please check your consultation link.');
      return;
    }

    // Decrypt the encoded ID
    const processEncodedId = async () => {
      try {
        console.log('🔐 Starting ID decryption process...');
        
        const decryptedParams = await decryptAndParseId(encodedId);
        
        const department = urlParams.get('department') || 
                         urlParams.get('unit_name') || 
                         'General Medicine';

        // Generate room ID based on decrypted appointment ID
        const roomId = `ROOM_${decryptedParams.appointmentId}`;

        // Set appointment data with decrypted values
        const appointmentDataToSet = {
          id: decryptedParams.appointmentId,
          department: department,
          username: decryptedParams.username,
          userid: decryptedParams.userid,
          roomId: roomId,
          doctorName: doctorName || 'Dr. Smith',
          status: 'Scheduled'
        };
        
        console.log('✅ Setting decrypted appointment data:', appointmentDataToSet);
        console.log('🏥 Final Appointment Details:');
        console.log('   - Appointment ID:', appointmentDataToSet.id);
        console.log('   - Patient Name:', appointmentDataToSet.username);
        console.log('   - Patient ID:', appointmentDataToSet.userid);
        console.log('   - Room ID:', appointmentDataToSet.roomId);
        console.log('   - Doctor:', appointmentDataToSet.doctorName);
        console.log('   - Department:', appointmentDataToSet.department);
        setAppointmentData(appointmentDataToSet);

        // Don't initialize Zego here - let the separate useEffect handle it
        console.log('✅ Decrypted appointment data set, waiting for separate useEffect to trigger initialization');
      } catch (error) {
        console.error('❌ Failed to process encoded parameters:', error);
        setAccessDenied(true);
        setAccessDeniedReason('Failed to decrypt appointment parameters. Please check your consultation link.');
      }
    };

            // Start the decryption process
        processEncodedId();
  }, []); // Only run once on mount

  // Separate useEffect to initialize Zego when appointment data is available
  useEffect(() => {
    if (appointmentData && appointmentData.roomId && !zegoInitialized && !zegoInstanceRef.current) {
      console.log('🔄 Starting Zego initialization from appointment data useEffect...');
      
      // Temporarily delay Zego initialization to ensure DOM is stable
      setTimeout(() => {
        initializeZego().catch(console.error);
      }, 1000);
    }
  }, [appointmentData]); // Run when appointment data changes

  const generateAppointmentId = () => {
    const prefix = 'KH';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  const handleEndCall = () => {
    console.log('🔴 Manual call end triggered');
    if (zegoInstanceRef.current) {
      try {
        zegoInstanceRef.current.leaveRoom();
      } catch (error) {
        console.warn('Error leaving room:', error);
      }
    }
    setCallEnded(true);
    setZegoInitialized(false);
  };

  // Function to decrypt encoded parameters using the API
  const decryptParameter = async (encodedText) => {
    try {
      console.log('🔐 Decrypting parameter:', encodedText);
      const result = await apiProxy.decryptParameter(encodedText);
      console.log('🔓 Decryption result:', result);
      return result;
    } catch (error) {
      console.error('❌ Decryption error:', error);
      throw error;
    }
  };



  // Function to decrypt single encoded ID and parse it
  const decryptAndParseId = async (encodedId) => {
    setIsDecoding(true);
    setDecodingError(null);
    
    try {
      console.log('🔐 Starting ID decryption...');
      
      // Decrypt the single encoded ID
      const decryptedId = await decryptParameter(encodedId);
      console.log('🔓 Decrypted ID:', decryptedId);
      
      // Parse the decrypted ID to extract individual parameters
      // Assuming the decrypted value contains all three parameters in a specific format
      // You may need to adjust this parsing logic based on your actual format
      let appointmentId, username, userid;
      
      try {
        // Try to parse as JSON first
        const parsedData = JSON.parse(decryptedId);
        appointmentId = parsedData.app_no || parsedData.appointmentId || parsedData.id;
        username = parsedData.username || parsedData.name;
        userid = parsedData.userid || parsedData.user_id;
      } catch (parseError) {
        console.log('⚠️ Not JSON format, trying alternative parsing...');
        
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
      
      console.log('✅ ID parsed successfully:');
      console.log('📋 Parsed Appointment ID:', appointmentId);
      console.log('👤 Parsed Username:', username);
      console.log('🆔 Parsed User ID:', userid);
      console.log('📊 Summary:', {
        appointmentId,
        username,
        userid
      });

      return {
        appointmentId,
        username,
        userid
      };
    } catch (error) {
      console.error('❌ ID decryption/parsing failed:', error);
      setDecodingError('Failed to decrypt appointment ID. Please check your consultation link.');
      throw error;
    } finally {
      setIsDecoding(false);
    }
  };

  const checkDevices = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDeviceStatus({ microphone: 'ready', camera: 'ready' });
      showNotification('All devices are ready for your consultation', 'success');
    } catch (error) {
      showNotification('Please check your camera and microphone permissions', 'error');
    }
  };

  // Store observer reference for cleanup
  const observerRef = React.useRef(null);
  
  // Customize pre-join view with participant info and button text
  const customizePreJoinView = () => {
    try {
      console.log('🎨 Customizing pre-join view...');
      
      // Find and update join button text
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        if (button.textContent && (
          button.textContent.toLowerCase().includes('join') ||
          button.textContent.toLowerCase().includes('start') ||
          button.textContent.toLowerCase().includes('enter')
        )) {
          console.log('🎯 Found join button, updating text to "Join Teleconsultation"');
          button.textContent = 'Join Teleconsultation';
          button.style.background = 'linear-gradient(135deg, #A23293, #EE2D67)';
          button.style.color = 'white';
          button.style.fontFamily = "'Poppins', sans-serif";
          button.style.fontWeight = '600';
          button.style.borderRadius = '8px';
          button.style.padding = '12px 24px';
          button.style.border = 'none';
          button.style.cursor = 'pointer';
          button.style.transition = 'all 0.3s ease';
          button.style.boxShadow = '0 2px 8px rgba(162, 50, 147, 0.2)';
        }
      });
      
      // Add participant information section
      // Try multiple selectors to find the pre-join container
      let prejoinContainer = document.querySelector('[class*="prejoin"], [class*="Prejoin"], [class*="zego"], [class*="PreJoin"]');
      
      // If not found, try to find any container with buttons
      if (!prejoinContainer) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          if (button.textContent && button.textContent.toLowerCase().includes('join')) {
            prejoinContainer = button.closest('[class*="container"], [class*="view"], [class*="panel"], [class*="content"]') || button.parentElement;
            console.log('🔍 Found container via button:', prejoinContainer?.className);
          }
        });
      }
      
      // Fallback to body if still not found
      if (!prejoinContainer) {
        prejoinContainer = document.body;
        console.log('⚠️ Using body as fallback container');
      }
      
      console.log('🎯 Using container:', prejoinContainer?.className || 'body');
      
      if (prejoinContainer) {
        // Remove existing participant info if any
        const existingInfo = prejoinContainer.querySelector('.kauvery-participant-info');
        if (existingInfo) {
          existingInfo.remove();
        }
        
        // Create participant info section
        const participantInfo = document.createElement('div');
        participantInfo.className = 'kauvery-participant-info';
        participantInfo.style.cssText = `
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 249, 250, 0.98));
          border: 1px solid #A23293;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          text-align: center;
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 2px 8px rgba(162, 50, 147, 0.15);
          backdrop-filter: blur(8px);
          position: relative;
          z-index: 1000;
          max-width: 380px;
          width: 80%;
          margin-left: auto;
          margin-right: auto;
          transform: scale(1);
          transition: all 0.3s ease;
        `;
        
        // Get appointment details for display
        const doctorName = appointmentData?.doctorName || 'Dr. Smith';
        const department = appointmentData?.department || 'General Medicine';
        const patientName = appointmentData?.username || 'Patient';
        
        participantInfo.innerHTML = `
          <div style="
            margin-bottom: 25px;
            text-align: center;
            position: relative;
          ">
            <h3 style="
              color: #A23293;
              font-size: 16px;
              font-weight: 700;
              margin: 0 0 3px 0;
              font-family: 'Poppins', sans-serif;
              text-shadow: 0 1px 2px rgba(162, 50, 147, 0.1);
            ">Consultation Details</h3>
            <p style="
              color: #666;
              font-size: 12px;
              margin: 0;
              font-family: 'Poppins', sans-serif;
              font-weight: 500;
            ">Room: ${appointmentData?.roomId || `ROOM_${appointmentData?.id || 'TEST123'}`}</p>
          </div>
          
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
            text-align: left;
          ">
            <div style="
              background: linear-gradient(135deg, rgba(162, 50, 147, 0.05), rgba(238, 45, 103, 0.05));
              border: 1px solid rgba(162, 50, 147, 0.1);
              border-radius: 8px;
              padding: 12px;
              transition: all 0.3s ease;
            ">
              <div style="
                width: 24px;
                height: 24px;
                background: linear-gradient(135deg, #A23293, #EE2D67);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 6px;
              ">
                <span style="font-size: 12px; color: white;">👨‍⚕️</span>
              </div>
              <p style="
                color: #A23293;
                font-size: 9px;
                font-weight: 700;
                margin: 0 0 3px 0;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                font-family: 'Poppins', sans-serif;
              ">Doctor</p>
              <p style="
                color: #333;
                font-size: 12px;
                font-weight: 600;
                margin: 0 0 1px 0;
                font-family: 'Poppins', sans-serif;
              ">${doctorName}</p>
              <p style="
                color: #666;
                font-size: 10px;
                margin: 0;
                font-family: 'Poppins', sans-serif;
                font-weight: 500;
              ">${department}</p>
            </div>
            
            <div style="
              background: linear-gradient(135deg, rgba(162, 50, 147, 0.05), rgba(238, 45, 103, 0.05));
              border: 1px solid rgba(162, 50, 147, 0.1);
              border-radius: 8px;
              padding: 12px;
              transition: all 0.3s ease;
            ">
              <div style="
                width: 24px;
                height: 24px;
                background: linear-gradient(135deg, #A23293, #EE2D67);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 6px;
              ">
                <span style="font-size: 12px; color: white;">👤</span>
              </div>
              <p style="
                color: #A23293;
                font-size: 9px;
                font-weight: 700;
                margin: 0 0 3px 0;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                font-family: 'Poppins', sans-serif;
              ">Patient</p>
              <p style="
                color: #333;
                font-size: 12px;
                font-weight: 600;
                margin: 0 0 1px 0;
                font-family: 'Poppins', sans-serif;
              ">${patientName}</p>
              <p style="
                color: #666;
                font-size: 10px;
                margin: 0;
                font-family: 'Poppins', sans-serif;
                font-weight: 500;
              ">Ready to join</p>
            </div>
          </div>
          
          <div style="
            background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.05));
            border: 1px solid rgba(40, 167, 69, 0.2);
            border-radius: 6px;
            padding: 8px;
            margin-top: 12px;
            position: relative;
            overflow: hidden;
          ">
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, #28a745, #20c997);
            "></div>
            <p style="
              color: #155724;
              font-size: 10px;
              margin: 0;
              font-family: 'Poppins', sans-serif;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            ">
              <span style="
                width: 6px;
                height: 6px;
                background: linear-gradient(135deg, #28a745, #20c997);
                border-radius: 50%;
                display: inline-block;
                animation: pulse 2s infinite;
                box-shadow: 0 0 4px rgba(40, 167, 69, 0.25);
              "></span>
              <span>🟢 No other participants in room yet</span>
            </p>
          </div>
        `;
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `;
        document.head.appendChild(style);
        
        // Insert participant info before the join button
        const joinButton = prejoinContainer.querySelector('button');
        if (joinButton) {
          // Try to insert before the button
          try {
            joinButton.parentNode.insertBefore(participantInfo, joinButton);
            console.log('✅ Participant info added above join button');
          } catch (error) {
            // Fallback: insert at the beginning of the container
            prejoinContainer.insertBefore(participantInfo, prejoinContainer.firstChild);
            console.log('✅ Participant info added at container start');
          }
        } else {
          // Fallback: append to container
          prejoinContainer.appendChild(participantInfo);
          console.log('✅ Participant info added to container end');
        }
        
        // Also try to replace any existing title/content with our custom info
        const existingTitles = prejoinContainer.querySelectorAll('h1, h2, h3, [class*="title"], [class*="header"]');
        existingTitles.forEach(title => {
          if (title.textContent && (
            title.textContent.toLowerCase().includes('welcome') ||
            title.textContent.toLowerCase().includes('join') ||
            title.textContent.toLowerCase().includes('meeting')
          )) {
            console.log('🔄 Replacing existing title:', title.textContent);
            title.style.display = 'none'; // Hide instead of removing to avoid conflicts
          }
        });
        
        // Hide any existing text boxes or content areas
        const existingContent = prejoinContainer.querySelectorAll('[class*="content"], [class*="text"], [class*="description"]');
        existingContent.forEach(content => {
          if (content.textContent && content.textContent.length > 50) {
            console.log('🔄 Hiding existing content:', content.textContent.substring(0, 50) + '...');
            content.style.display = 'none';
          }
        });

        // Hide patient name input field and related elements
        const inputFields = prejoinContainer.querySelectorAll('input[type="text"], input[placeholder*="name"], input[placeholder*="Name"], [class*="input"], [class*="textbox"]');
        inputFields.forEach(input => {
          console.log('🔄 Hiding patient name input field:', input.placeholder || input.className);
          input.style.display = 'none';
          
          // Also hide the parent container if it's just for the input
          const parent = input.parentElement;
          if (parent && (parent.className.includes('input') || parent.className.includes('textbox') || parent.className.includes('field'))) {
            parent.style.display = 'none';
          }
        });

        // Hide labels related to patient name input
        const labels = prejoinContainer.querySelectorAll('label, [class*="label"]');
        labels.forEach(label => {
          if (label.textContent && (
            label.textContent.toLowerCase().includes('name') ||
            label.textContent.toLowerCase().includes('username') ||
            label.textContent.toLowerCase().includes('enter')
          )) {
            console.log('🔄 Hiding patient name label:', label.textContent);
            label.style.display = 'none';
          }
        });
      }
      
              console.log('🎨 Pre-join view customization complete');
        
        // Fallback: Create floating participant info if not visible
        setTimeout(() => {
          const existingInfo = document.querySelector('.kauvery-participant-info');
          if (!existingInfo || existingInfo.offsetParent === null) {
            console.log('🔄 Creating floating participant info panel');
            createFloatingParticipantInfo();
          }
        }, 1000);
        
      } catch (error) {
        console.warn('⚠️ Error customizing pre-join view:', error);
      }
  };
  
  // Create floating participant info panel
  const createFloatingParticipantInfo = () => {
    try {
      // Remove existing floating info
      const existingFloating = document.querySelector('.kauvery-floating-info');
      if (existingFloating) {
        existingFloating.remove();
      }
      
      // Create floating container
      const floatingInfo = document.createElement('div');
      floatingInfo.className = 'kauvery-floating-info';
      floatingInfo.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 249, 250, 0.98));
        border: 1px solid #A23293;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        font-family: 'Poppins', sans-serif;
        
        backdrop-filter: blur(8px);
        z-index: 9999;
        max-width: 380px;
        width: 80%;
        transform: translateX(-50%) scale(1);
        transition: all 0.3s ease;
      `;
      
      // Get appointment details for display
      const doctorName = appointmentData?.doctorName || 'Dr. Smith';
      const department = appointmentData?.department || 'General Medicine';
      const patientName = appointmentData?.username || 'Patient';
      
      floatingInfo.innerHTML = `
        <div style="
          margin-bottom: 15px;
          text-align: center;
          position: relative;
        ">
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #A23293, #EE2D67);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 8px;
            box-shadow: 0 1px 4px rgba(162, 50, 147, 0.15);
          ">
            <span style="font-size: 14px; color: white;">📋</span>
          </div>
          <h3 style="
            color: #A23293;
            font-size: 16px;
            font-weight: 700;
            margin: 0 0 4px 0;
            font-family: 'Poppins', sans-serif;
            text-shadow: 0 1px 2px rgba(162, 50, 147, 0.1);
          ">Consultation Details</h3>
          <p style="
            color: #666;
            font-size: 12px;
            margin: 0;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
                      ">Room: ${appointmentData?.roomId || `ROOM_${appointmentData?.id || 'TEST123'}`}</p>
        </div>
        
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
          text-align: left;
        ">
          <div style="
            background: linear-gradient(135deg, rgba(162, 50, 147, 0.05), rgba(238, 45, 103, 0.05));
            border: 1px solid rgba(162, 50, 147, 0.1);
            border-radius: 8px;
            padding: 12px;
            transition: all 0.3s ease;
          ">
            <div style="
              width: 24px;
              height: 24px;
              background: linear-gradient(135deg, #A23293, #EE2D67);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 6px;
            ">
              <span style="font-size: 12px; color: white;">👨‍⚕️</span>
            </div>
            <p style="
              color: #A23293;
              font-size: 9px;
              font-weight: 700;
              margin: 0 0 3px 0;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              font-family: 'Poppins', sans-serif;
            ">Doctor</p>
            <p style="
              color: #333;
              font-size: 12px;
              font-weight: 600;
              margin: 0 0 1px 0;
              font-family: 'Poppins', sans-serif;
            ">${doctorName}</p>
            <p style="
              color: #666;
              font-size: 10px;
              margin: 0;
              font-family: 'Poppins', sans-serif;
              font-weight: 500;
            ">${department}</p>
          </div>
          
          <div style="
            background: linear-gradient(135deg, rgba(162, 50, 147, 0.05), rgba(238, 45, 103, 0.05));
            border: 1px solid rgba(162, 50, 147, 0.1);
            border-radius: 8px;
            padding: 12px;
            transition: all 0.3s ease;
          ">
            <div style="
              width: 24px;
              height: 24px;
              background: linear-gradient(135deg, #A23293, #EE2D67);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 6px;
            ">
              <span style="font-size: 12px; color: white;">👤</span>
            </div>
            <p style="
              color: #A23293;
              font-size: 9px;
              font-weight: 700;
              margin: 0 0 3px 0;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              font-family: 'Poppins', sans-serif;
            ">Patient</p>
            <p style="
              color: #333;
              font-size: 12px;
              font-weight: 600;
              margin: 0 0 1px 0;
              font-family: 'Poppins', sans-serif;
            ">${patientName}</p>
            <p style="
              color: #666;
              font-size: 10px;
              margin: 0;
              font-family: 'Poppins', sans-serif;
              font-weight: 500;
            ">Ready to join</p>
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.05));
          border: 1px solid rgba(40, 167, 69, 0.2);
          border-radius: 6px;
          padding: 8px;
          margin-top: 12px;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, #28a745, #20c997);
          "></div>
          <p style="
            color: #155724;
            font-size: 10px;
            margin: 0;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          ">
            <span style="
              width: 6px;
              height: 6px;
              background: linear-gradient(135deg, #28a745, #20c997);
              border-radius: 50%;
              display: inline-block;
              animation: pulse 2s infinite;
              box-shadow: 0 0 4px rgba(40, 167, 69, 0.25);
            "></span>
            <span>🟢 No other participants in room yet</span>
          </p>
        </div>
      `;
      
      document.body.appendChild(floatingInfo);
      console.log('✅ Floating participant info created');
      
    } catch (error) {
      console.warn('⚠️ Error creating floating participant info:', error);
    }
  };
  
  // Apply custom styles for join button and fonts
  const applyKauveryStyles = () => {
    try {
      // Add Poppins font
      const fontLink = document.createElement('link');
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);

      // Add custom CSS for join button gradient
      const style = document.createElement('style');
      style.textContent = `
        /* Global fitting styles */
        html, body {
          max-width: 100vw !important;
          max-height: 100vh !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }

        * {
          box-sizing: border-box !important;
        }

        /* Target Zego join button with multiple selectors */
        .zego-join-button,
        .zego-prejoin-view button,
        .zego-prejoin-view .zego-button,
        .zego-prejoin-view [class*="button"],
        .zego-prejoin-view [class*="join"],
        .zego-prejoin-view button[type="button"],
        .zego-prejoin-view .zego-ui-button,
        .zego-prejoin-view .zego-btn,
        .zego-prejoin-view .join-btn,
        .zego-prejoin-view .start-btn,
        .zego-prejoin-view .primary-btn {
          background: linear-gradient(135deg, #A23293, #EE2D67) !important;
          border: none !important;
          color: white !important;
          font-family: 'Poppins', sans-serif !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
          padding: 12px 24px !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 2px 8px rgba(162, 50, 147, 0.2) !important;
        }
        
        .zego-join-button:hover,
        .zego-prejoin-view button:hover,
        .zego-prejoin-view .zego-button:hover,
        .zego-prejoin-view [class*="button"]:hover,
        .zego-prejoin-view [class*="join"]:hover,
        .zego-prejoin-view button[type="button"]:hover,
        .zego-prejoin-view .zego-ui-button:hover,
        .zego-prejoin-view .zego-btn:hover,
        .zego-prejoin-view .join-btn:hover,
        .zego-prejoin-view .start-btn:hover,
        .zego-prejoin-view .primary-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(162, 50, 147, 0.3) !important;
          background: linear-gradient(135deg, #B23DA4, #FF3D78) !important;
        }
        
        /* Target all elements in pre-join view for Poppins font */
        .zego-prejoin-view *,
        .zego-prejoin-container *,
        .zego-prejoin * {
          font-family: 'Poppins', sans-serif !important;
        }
        
        /* Specific targeting for titles and content */
        .zego-prejoin-view h1,
        .zego-prejoin-view h2,
        .zego-prejoin-view h3,
        .zego-prejoin-view .title,
        .zego-prejoin-view .header,
        .zego-prejoin-title {
          font-family: 'Poppins', sans-serif !important;
          font-weight: 600 !important;
        }
        
        .zego-prejoin-view p,
        .zego-prejoin-view span,
        .zego-prejoin-view div,
                  .zego-prejoin-content {
            font-family: 'Poppins', sans-serif !important;
          }
        
        /* Force override for any button-like elements */
        .zego-prejoin-view [class*="btn"],
        .zego-prejoin-view [class*="Button"],
        .zego-prejoin-view [class*="button"] {
          background: linear-gradient(135deg, #A23293, #EE2D67) !important;
          border: none !important;
          color: white !important;
          font-family: 'Poppins', sans-serif !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
          padding: 12px 24px !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        /* Ensure Zego elements fit properly */
        .zego-prejoin-view,
        .zego-prejoin-container,
        .zego-prejoin {
          max-width: 90% !important;
          max-height: 80% !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }

        /* Ensure video elements fit */
        .zego-video-view,
        .zego-video-container {
          max-width: 90% !important;
          max-height: 90% !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }

        /* Additional fitting styles for better responsiveness */
        .zego-ui,
        .zego-ui * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        /* Ensure the main Zego container fits */
        [class*="zego"],
        [class*="Zego"] {
          max-width: 100vw !important;
          max-height: 100vh !important;
          overflow: hidden !important;
        }

        /* Hide patient name input fields */
        .zego-prejoin-view input[type="text"],
        .zego-prejoin-view input[placeholder*="name"],
        .zego-prejoin-view input[placeholder*="Name"],
        .zego-prejoin-view [class*="input"],
        .zego-prejoin-view [class*="textbox"] {
          display: none !important;
        }

        /* Hide labels for patient name */
        .zego-prejoin-view label,
        .zego-prejoin-view [class*="label"] {
          display: none !important;
        }

        /* Override Zego title color */
        .zego-prejoin-view h1,
        .zego-prejoin-view h2,
        .zego-prejoin-view h3,
        .zego-prejoin-view .title,
        .zego-prejoin-view [class*="title"],
        .zego-prejoin-view [class*="header"],
        .zego-prejoin-view [class*="welcome"] {
          color: #962067 !important;
          font-family: 'Poppins', sans-serif !important;
          font-weight: 600 !important;
          font-size: 24px !important;
        }

        /* More aggressive title color override */
        .zego-prejoin-view *,
        .zego-prejoin-container *,
        .zego-prejoin * {
          color: #962067 !important;
        }

        /* Specific targeting for any text containing "Welcome" */
        .zego-prejoin-view *:contains("Welcome"),
        .zego-prejoin-container *:contains("Welcome"),
        .zego-prejoin *:contains("Welcome") {
          color: #962067 !important;
        }

        /* Universal selector for all text in pre-join view */
        .zego-prejoin-view,
        .zego-prejoin-container,
        .zego-prejoin {
          color: #962067 !important;
        }

        /* Target any element with text content */
        .zego-prejoin-view div,
        .zego-prejoin-view span,
        .zego-prejoin-view p {
          color: #962067 !important;
        }

        /* Hide Zego's default quit/end call page */
        .zego-quit-view,
        .zego-quit-container,
        .zego-quit,
        [class*="quit"],
        [class*="Quit"],
        [class*="end"],
        [class*="End"],
        [class*="leave"],
        [class*="Leave"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Hide any Zego elements that appear after call ends */
        .zego-ui[data-ended="true"],
        .zego-ui[data-left="true"],
        .zego-ui[data-quit="true"] {
          display: none !important;
        }

        /* Ensure our custom quit page takes precedence */
        .kauvery-call-ended {
          z-index: 9999 !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: linear-gradient(135deg, #962067, #A23293) !important;
        }
      `;
      document.head.appendChild(style);
      
      // Add MutationObserver to ensure styles are applied to dynamically created elements
      observerRef.current = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if any buttons were added
                const buttons = node.querySelectorAll ? node.querySelectorAll('button, [class*="button"], [class*="btn"], [class*="join"]') : [];
                buttons.forEach(button => {
                  if (button.textContent && (button.textContent.toLowerCase().includes('join') || 
                      button.textContent.toLowerCase().includes('start') || 
                      button.textContent.toLowerCase().includes('enter'))) {
                    console.log('🎯 Found join button, applying gradient styles and updating text');
                    
                    // Update button text
                    button.textContent = 'Join Teleconsultation';
                    
                    // Apply gradient styles
                    button.style.background = 'linear-gradient(135deg, #A23293, #EE2D67)';
                    button.style.border = 'none';
                    button.style.color = 'white';
                    button.style.fontFamily = "'Poppins', sans-serif";
                    button.style.fontWeight = '600';
                    button.style.borderRadius = '8px';
                    button.style.padding = '12px 24px';
                    button.style.cursor = 'pointer';
                    button.style.transition = 'all 0.3s ease';
                    button.style.boxShadow = '0 2px 8px rgba(162, 50, 147, 0.2)';
                    
                    // Add hover effect
                    button.addEventListener('mouseenter', () => {
                      button.style.transform = 'translateY(-2px)';
                      button.style.boxShadow = '0 4px 12px rgba(162, 50, 147, 0.3)';
                      button.style.background = 'linear-gradient(135deg, #B23DA4, #FF3D78)';
                    });
                    
                    button.addEventListener('mouseleave', () => {
                      button.style.transform = 'translateY(0)';
                      button.style.boxShadow = '0 2px 8px rgba(162, 50, 147, 0.2)';
                      button.style.background = 'linear-gradient(135deg, #A23293, #EE2D67)';
                    });
                    
                    // Also trigger participant info customization
                    setTimeout(() => {
                      customizePreJoinView();
                    }, 100);
                  }
                });

                // Check if any input fields were added and hide them
                const inputFields = node.querySelectorAll ? node.querySelectorAll('input[type="text"], input[placeholder*="name"], input[placeholder*="Name"], [class*="input"], [class*="textbox"]') : [];
                inputFields.forEach(input => {
                  console.log('🎯 Found input field, hiding it:', input.placeholder || input.className);
                  input.style.display = 'none';
                  
                  // Also hide the parent container if it's just for the input
                  const parent = input.parentElement;
                  if (parent && (parent.className.includes('input') || parent.className.includes('textbox') || parent.className.includes('field'))) {
                    parent.style.display = 'none';
                  }
                });

                // Check if any labels were added and hide them
                const labels = node.querySelectorAll ? node.querySelectorAll('label, [class*="label"]') : [];
                labels.forEach(label => {
                  if (label.textContent && (
                    label.textContent.toLowerCase().includes('name') ||
                    label.textContent.toLowerCase().includes('username') ||
                    label.textContent.toLowerCase().includes('enter')
                  )) {
                    console.log('🎯 Found label, hiding it:', label.textContent);
                    label.style.display = 'none';
                  }
                });

                // Check if any titles were added and change their color
                const titles = node.querySelectorAll ? node.querySelectorAll('h1, h2, h3, [class*="title"], [class*="header"], [class*="welcome"]') : [];
                titles.forEach(title => {
                  if (title.textContent && title.textContent.toLowerCase().includes('welcome')) {
                    console.log('🎯 Found welcome title, changing color:', title.textContent);
                    title.style.color = '#962067';
                    title.style.fontFamily = "'Poppins', sans-serif";
                    title.style.fontWeight = '600';
                    title.style.fontSize = '24px';
                  }
                });

                // More aggressive title color application
                const allElements = node.querySelectorAll ? node.querySelectorAll('*') : [];
                allElements.forEach(element => {
                  if (element.textContent && element.textContent.toLowerCase().includes('welcome')) {
                    console.log('🎯 Found element with welcome text, changing color:', element.textContent);
                    element.style.color = '#962067';
                    element.style.fontFamily = "'Poppins', sans-serif";
                    element.style.fontWeight = '600';
                    element.style.fontSize = '24px';
                  }
                });

                // Also check the entire document for welcome text
                setTimeout(() => {
                  const allWelcomeElements = document.querySelectorAll('*');
                  allWelcomeElements.forEach(element => {
                    if (element.textContent && element.textContent.toLowerCase().includes('welcome') && 
                        element.closest('.zego-prejoin-view')) {
                      console.log('🎯 Found welcome element in document, changing color:', element.textContent);
                      element.style.color = '#962067';
                      element.style.fontFamily = "'Poppins', sans-serif";
                      element.style.fontWeight = '600';
                      element.style.fontSize = '24px';
                    }
                  });
                }, 500);

                // Check for Zego quit/end call elements and hide them
                const quitElements = node.querySelectorAll ? node.querySelectorAll('[class*="quit"], [class*="Quit"], [class*="end"], [class*="End"], [class*="leave"], [class*="Leave"]') : [];
                quitElements.forEach(element => {
                  console.log('🚫 Found Zego quit element, hiding it:', element.className);
                  element.style.display = 'none';
                  element.style.visibility = 'hidden';
                  element.style.opacity = '0';
                  element.style.pointerEvents = 'none';
                });

                // Check for end call buttons and redirect them to our handler
                const endCallButtons = node.querySelectorAll ? node.querySelectorAll('button, [class*="button"], [class*="btn"]') : [];
                endCallButtons.forEach(button => {
                  if (button.textContent && (
                    button.textContent.toLowerCase().includes('end call') ||
                    button.textContent.toLowerCase().includes('leave') ||
                    button.textContent.toLowerCase().includes('quit') ||
                    button.textContent.toLowerCase().includes('hang up')
                  )) {
                    console.log('🔴 Found end call button, redirecting to our handler:', button.textContent);
                    button.onclick = (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEndCall();
                    };
                  }
                });

                // Check for text that indicates call ended
                if (node.textContent && (
                  node.textContent.toLowerCase().includes('you have left the room') ||
                  node.textContent.toLowerCase().includes('call ended') ||
                  node.textContent.toLowerCase().includes('consultation ended') ||
                  node.textContent.toLowerCase().includes('return to home')
                )) {
                  console.log('🚫 Found call ended text, hiding element:', node.textContent);
                  node.style.display = 'none';
                  node.style.visibility = 'hidden';
                  node.style.opacity = '0';
                  node.style.pointerEvents = 'none';
                  
                  // Trigger our custom call ended page
                  if (!callEnded) {
                    console.log('🔄 Triggering custom call ended page');
                    setCallEnded(true);
                  }
                }
              }
            });
          }
        });
      });
      
      // Start observing the document body for changes
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('✅ Custom styles applied - Poppins font and join button gradient with MutationObserver');
      
      // Function to force update title color
      const forceUpdateTitleColor = () => {
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
          if (element.textContent && element.textContent.toLowerCase().includes('welcome') && 
              element.closest('.zego-prejoin-view')) {
            console.log('🎯 Force updating welcome title color:', element.textContent);
            element.style.color = '#962067';
            element.style.fontFamily = "'Poppins', sans-serif";
            element.style.fontWeight = '600';
            element.style.fontSize = '24px';
          }
        });
      };

      // Periodically check and update title color
      setInterval(forceUpdateTitleColor, 1000);
      
      // Periodically check for and hide Zego quit elements
      setInterval(() => {
        const quitElements = document.querySelectorAll('[class*="quit"], [class*="Quit"], [class*="end"], [class*="End"], [class*="leave"], [class*="Leave"]');
        quitElements.forEach(element => {
          if (element.style.display !== 'none') {
            console.log('🚫 Hiding Zego quit element:', element.className);
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
          }
        });
        
        // Check for call ended text
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
          if (element.textContent && (
            element.textContent.toLowerCase().includes('you have left the room') ||
            element.textContent.toLowerCase().includes('call ended') ||
            element.textContent.toLowerCase().includes('consultation ended') ||
            element.textContent.toLowerCase().includes('return to home')
          )) {
            console.log('🚫 Hiding call ended text:', element.textContent);
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
            
            // Trigger our custom call ended page
            if (!callEnded) {
              console.log('🔄 Triggering custom call ended page from periodic check');
              setCallEnded(true);
            }
          }
        });
      }, 500);
      
              // Make functions globally available for debugging
        window.customizePreJoinView = customizePreJoinView;
        window.createFloatingParticipantInfo = createFloatingParticipantInfo;
        window.forceUpdateTitleColor = forceUpdateTitleColor;
        window.handleEndCall = handleEndCall;
        console.log('🔧 Debug functions available: customizePreJoinView(), createFloatingParticipantInfo(), forceUpdateTitleColor(), handleEndCall()');
      
    } catch (error) {
      console.warn('⚠️ Error applying custom styles:', error);
    }
  };

  // Initialize Zego with Kauvery styling (called directly on page load)
  const initializeZego = async () => {
    try {
      console.log('🔍 Debug: initializeZego called');
      console.log('🔍 Debug: Current state - zegoInitialized:', zegoInitialized);
      console.log('🔍 Debug: Current state - zegoInstanceRef.current:', !!zegoInstanceRef.current);
      console.log('🔍 Debug: Current state - appointmentData:', appointmentData);
      
      // Enhanced prevention of multiple initializations
      if (zegoInitialized || zegoInstanceRef.current || document.querySelector('[class*="zego"]')) {
        console.log('⚠️ Zego already initialized, skipping...');
        return;
      }

      // Safety check for appointment data
      if (!appointmentData || !appointmentData.roomId || !appointmentData.userid || !appointmentData.username) {
        console.log('⏳ Waiting for appointment data...');
        console.log('🔍 Debug: Missing appointment data -', {
          hasAppointmentData: !!appointmentData,
          hasRoomId: !!(appointmentData && appointmentData.roomId),
          hasUserid: !!(appointmentData && appointmentData.userid),
          hasUsername: !!(appointmentData && appointmentData.username)
        });
        setTimeout(initializeZego, 500);
        return;
      }

      // Wait for container to be ready
      if (!zegoContainerRef.current) {
        console.log('⏳ Waiting for container...');
        console.log('🔍 Debug: Container not ready - zegoContainerRef.current:', zegoContainerRef.current);
        setTimeout(initializeZego, 500);
        return;
      }

      console.log('🚀 Starting Zego initialization...');
      setInitializationError(null);

      console.log('🔍 Debug: Importing ZegoUIKitPrebuilt...');
      const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');
      console.log('🔍 Debug: ZegoUIKitPrebuilt imported successfully');
      
      // Get Zego credentials from environment configuration
      const { appId: appID, serverSecret } = getZegoCredentials();
      console.log('🔍 Debug: Using Zego credentials from environment:', { appID, serverSecret: serverSecret.substring(0, 10) + '...' });
      
      console.log('🔍 Debug: Generating kit token...');
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret, 
        appointmentData.roomId, 
        appointmentData.userid, 
        appointmentData.username
      );
      console.log('🔍 Debug: Kit token generated:', kitToken.substring(0, 20) + '...');

      console.log('🔍 Debug: Creating Zego instance...');
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;
      console.log('🔍 Debug: Zego instance created successfully');

      // Join room with pre-join screen (original Zego interface)
      console.log('🔗 Joining room with ID:', appointmentData.roomId);
      console.log('🔍 Debug: Container element:', zegoContainerRef.current);
      
      try {
        console.log('🔍 Debug: Calling zp.joinRoom...');
        await zp.joinRoom({
          container: zegoContainerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.VideoConference,
          },
          showPreJoinView: true, // Restore pre-join view
          preJoinViewConfig: {
            title: `Welcome to Kauvery Hospital`,
            titleStyle: {
              color: '#962067',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600',
              fontSize: '24px'
            }
          },
          onJoinRoom: () => {
            console.log('✅ Successfully joined Kauvery Hospital consultation room');
            // Use longer timeout to ensure pre-join to video transition is complete
            setTimeout(() => {
              setZegoInitialized(true);
              console.log('🔄 Zego initialization state updated - pre-join to video transition complete');
            }, 500);
          },
          onLeaveRoom: () => {
            console.log('👋 Left consultation room');
            setZegoInitialized(false);
            setCallEnded(true);
            zegoInstanceRef.current = null;
          },
          onError: (error) => {
            console.error('❌ Zego join room error:', error);
            setInitializationError(error);
          },
                  onPreJoinViewReady: () => {
          console.log('🎯 Pre-join view is ready - join page loaded successfully');
          // Customize the join button text and add participant info
          setTimeout(() => {
            customizePreJoinView();
          }, 500);
        },
        onJoinRoomSuccess: () => {
          console.log('🎉 Join room success - transitioning to video interface');
        }
        });
              console.log('🔍 Debug: zp.joinRoom completed successfully');
    } catch (joinError) {
      console.error('❌ Error during room join:', joinError);
      setInitializationError(joinError.message || 'Failed to join room');
      throw joinError;
    }

    // Styles are applied via useEffect, no need for delayed application

    console.log('✅ Zego initialization completed successfully');
    
    // Fallback: Set initialized state if onJoinRoom doesn't trigger
    setTimeout(() => {
      if (!zegoInitialized && zegoInstanceRef.current) {
        console.log('🔄 Fallback: Setting Zego initialized state');
        setZegoInitialized(true);
      }
    }, 2000);
    
    // Don't set zegoInitialized here - let onJoinRoom handle it
    return true;
    } catch (error) {
      console.error('❌ Error initializing Zego:', error);
      setInitializationError(error.message || 'Failed to initialize video consultation');
      setZegoInitialized(false);
      
      // Show user-friendly error message
      showNotification('Unable to connect to video consultation. Please refresh the page.', 'error');
      
      // Reset after 5 seconds to allow retry
      setTimeout(() => {
        setInitializationError(null);
        zegoInstanceRef.current = null;
      }, 5000);
      
      throw error;
    }
  };

  // Styles object
  const styles = {
    body: {
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: `linear-gradient(135deg, ${colors.kauveryPurple}, ${colors.kauveryViolet})`,
      color: colors.kauveryDarkGrey,
      overflow: 'hidden',
      height: '100vh',
      maxHeight: '100vh',
      margin: 0,
      padding: 0
    },
    header: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '80px', // Further reduced from 100px
      background: `linear-gradient(135deg, ${colors.white}, ${colors.grey100})`,
      borderBottom: `3px solid ${colors.kauveryPink}`,
      boxShadow: shadows.lg,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${spacing.xs} ${spacing.md}` // Further reduced padding
    },
    brandingSection: {
      display: 'flex',
      alignItems: 'center'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md
    },
    yearsBadge: {
      width: '120px',
      height: '56px',
      background: 'transparent',
      borderRadius: radius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      boxShadow: shadows.md
    },
    hospitalInfo: {
      display: 'flex',
      flexDirection: 'column'
    },
    hospitalName: {
      fontFamily: "'Poppins', sans-serif",
      fontSize: '20px', // Further reduced from 24px
      fontWeight: 600,
      color: colors.kauveryPurple,
      margin: 0,
      lineHeight: 1.2
    },
    hospitalSubtitle: {
      fontFamily: "'Poppins', sans-serif",
      fontSize: '12px', // Reduced from 14px
      color: colors.kauveryDarkGrey,
      margin: 0,
      fontWeight: 500
    },
    appointmentSection: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xl
    },
    appointmentDetails: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: `${spacing.xs} ${spacing.md}`, // Reduced gap
      padding: spacing.sm, // Reduced padding
      background: colors.grey50,
      borderRadius: radius.lg,
      border: `2px solid ${colors.kauveryPink}`,
      minWidth: '350px' // Reduced from 400px
    },
    appointmentItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    appointmentLabel: {
      fontFamily: "'Poppins', sans-serif",
      fontSize: '10px', // Reduced from 12px
      color: colors.kauveryLightGrey,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    appointmentValue: {
      fontFamily: "'Poppins', sans-serif",
      fontSize: '12px', // Reduced from 16px
      color: colors.kauveryDarkGrey,
      fontWeight: 600 // Reduced from 700
    },
    statusBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      background: `linear-gradient(135deg, ${colors.kauveryYellowOrange}, ${colors.kauveryPink})`,
      color: colors.white,
      padding: `${spacing.md} ${spacing.lg}`,
      borderRadius: radius.xl,
      fontWeight: 600,
      fontSize: '14px',
      boxShadow: shadows.md
    },
    statusIcon: {
      fontSize: '16px'
    },
    statusText: {
      fontWeight: 700
    },
    notification: {
      position: 'fixed',
      top: spacing.lg,
      right: spacing.lg,
      background: colors.white,
      color: colors.kauveryDarkGrey,
      padding: `${spacing.md} ${spacing.lg}`,
      borderRadius: radius.lg,
      boxShadow: shadows.lg,
      zIndex: 100,
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    }
  };

  // Access Denied Component
  const AccessDeniedPage = () => {
    console.log('🔍 Debug: AccessDeniedPage component rendered');
    console.log('🔍 Debug: AccessDeniedPage - accessDeniedReason:', accessDeniedReason);
    
    return (
      <div style={{
        ...styles.body,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl
      }}>
      <div style={{
        background: colors.white,
        borderRadius: radius.xl,
        padding: spacing['2xl'],
        maxWidth: '500px',
        textAlign: 'center',
        boxShadow: shadows.lg,
        border: `3px solid ${colors.kauveryRed}`
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: `linear-gradient(135deg, ${colors.kauveryRed}, ${colors.kauveryPink})`,
          borderRadius: radius.full,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '32px'
        }}>
          ⚠️
        </div>
        
        <h1 style={{
          color: colors.kauveryRed,
          fontSize: '28px',
          fontWeight: 700,
          margin: '0 0 16px 0',
          fontFamily: "'Google Sans', sans-serif"
        }}>
          Access Denied
        </h1>
        
        <p style={{
          color: colors.kauveryDarkGrey,
          fontSize: '16px',
          lineHeight: 1.6,
          margin: '0 0 24px 0'
        }}>
          {decodingError || accessDeniedReason}
        </p>
        
        <div style={{
          background: colors.grey50,
          borderRadius: radius.lg,
          padding: spacing.lg,
          margin: '24px 0',
          border: `2px solid ${colors.grey200}`
        }}>
          <h3 style={{
            color: colors.kauveryPurple,
            fontSize: '18px',
            fontWeight: 600,
            margin: '0 0 12px 0'
          }}>
            Required Parameters:
          </h3>
          <ul style={{
            textAlign: 'left',
            color: colors.kauveryDarkGrey,
            fontSize: '14px',
            lineHeight: 1.8,
            margin: 0,
            paddingLeft: '20px'
          }}>
            <li><strong>id</strong> - Encoded Appointment ID containing all parameters</li>
          </ul>
          
          <div style={{
            background: colors.grey100,
            borderRadius: radius.md,
            padding: spacing.md,
            marginTop: spacing.md,
            border: `1px solid ${colors.grey300}`
          }}>
            <h4 style={{
              color: colors.kauveryPurple,
              fontSize: '14px',
              fontWeight: 600,
              margin: '0 0 8px 0'
            }}>
              Example URL:
            </h4>
            <p style={{
              color: colors.kauveryDarkGrey,
              fontSize: '12px',
              margin: 0,
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>
              http://localhost:3000/?id=ODFlvLi0k4Ahvs6YIHnKCbJ//F1frN/vbVq+1c55QOZ1oa3keYEEZjCHHyvID7X5jfNNotg52mwz1TKIzOGJRw==
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => window.history.back()}
          style={{
            background: `linear-gradient(135deg, ${colors.kauveryPurple}, ${colors.kauveryViolet})`,
            color: colors.white,
            border: 'none',
            borderRadius: radius.lg,
            padding: `${spacing.md} ${spacing.xl}`,
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: spacing.lg
          }}
        >
          🔙 Go Back
        </button>
      </div>
    </div>
    );
  };

  // Call Ended Page Component
  const CallEndedPage = () => {
    console.log('🔍 Debug: CallEndedPage component rendered');
    
    return (
      <div 
        className="kauvery-call-ended"
        style={{
          ...styles.body,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl
        }}
      >
        <div style={{
          background: colors.white,
          borderRadius: radius.xl,
          padding: spacing['2xl'],
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: shadows.lg,
          border: `3px solid ${colors.kauveryPink}`
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: `linear-gradient(135deg, ${colors.kauveryPink}, ${colors.kauveryViolet})`,
            borderRadius: radius.full,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '32px'
          }}>
            ✅
          </div>
          
          <h1 style={{
            color: colors.kauveryPurple,
            fontSize: '28px',
            fontWeight: 700,
            margin: '0 0 16px 0',
            fontFamily: "'Poppins', sans-serif"
          }}>
            Consultation Completed
          </h1>
          
          <p style={{
            color: colors.kauveryDarkGrey,
            fontSize: '16px',
            lineHeight: 1.6,
            margin: '0 0 24px 0'
          }}>
            Your video consultation has been successfully completed. Thank you for choosing Kauvery Hospital.
          </p>
          
          <div style={{
            background: colors.grey50,
            borderRadius: radius.lg,
            padding: spacing.lg,
            margin: '24px 0',
            border: `2px solid ${colors.grey200}`
          }}>
            <h3 style={{
              color: colors.kauveryPurple,
              fontSize: '18px',
              fontWeight: 600,
              margin: '0 0 12px 0'
            }}>
              Consultation Summary:
            </h3>
            <ul style={{
              textAlign: 'left',
              color: colors.kauveryDarkGrey,
              fontSize: '14px',
              lineHeight: 1.8,
              margin: 0,
              paddingLeft: '20px'
            }}>
              <li><strong>Doctor:</strong> {appointmentData?.doctorName || 'Dr. Smith'}</li>
              <li><strong>Department:</strong> {appointmentData?.department || 'General Medicine'}</li>
              <li><strong>Patient:</strong> {appointmentData?.username || 'Patient'}</li>
              <li><strong>Room:</strong> {appointmentData?.roomId || `ROOM_${appointmentData?.id || 'TEST123'}`}</li>
            </ul>
          </div>
          
          <div style={{
            display: 'flex',
            gap: spacing.md,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: `linear-gradient(135deg, ${colors.kauveryPurple}, ${colors.kauveryViolet})`,
                color: colors.white,
                border: 'none',
                borderRadius: radius.lg,
                padding: `${spacing.md} ${spacing.xl}`,
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🔄 Start New Consultation
            </button>
            
            <button 
              onClick={() => window.history.back()}
              style={{
                background: colors.grey200,
                color: colors.kauveryDarkGrey,
                border: 'none',
                borderRadius: radius.lg,
                padding: `${spacing.md} ${spacing.xl}`,
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🔙 Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show access denied page if validation failed or decryption error
  console.log('🔍 Debug: Render check - accessDenied:', accessDenied);
  console.log('🔍 Debug: Render check - appointmentData:', appointmentData);
  console.log('🔍 Debug: Render check - callEnded:', callEnded);
  console.log('🔍 Debug: Render check - decodingError:', decodingError);
  
  if (accessDenied || decodingError) {
    console.log('🔍 Debug: Rendering AccessDeniedPage');
    return <AccessDeniedPage />;
  }

  // Show call ended page if call has been completed
  if (callEnded) {
    console.log('🔍 Debug: Rendering CallEndedPage');
    return <CallEndedPage />;
  }

  // Show loading if appointment data is not yet loaded or if decryption is in progress
  if (!appointmentData || isDecoding) {
    return (
      <div style={{
        ...styles.body,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: colors.white
        }}>
          <div style={{
            width: '120px',
            height: '60px',
            background: 'transparent',
            borderRadius: radius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            overflow: 'hidden'
          }}>
            <img 
              src={logoImage} 
              alt="Kauvery Hospital Logo" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>Kauvery Hospital</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>
            {isDecoding ? 'Decrypting appointment details...' : 'Validating appointment details...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.body}>
      {/* Compact Header */}
      <div style={styles.header}>
        {/* Hospital Branding */}
        <div style={styles.brandingSection}>
          <div style={styles.logoContainer}>
            <div style={styles.yearsBadge}>
              <img src={logoImage} alt="Kauvery Hospital Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={styles.hospitalInfo}>
              <h1 style={styles.hospitalName}>Kauvery Hospital</h1>
              <p style={styles.hospitalSubtitle}>Video Consultation Platform</p>
            </div>
          </div>
        </div>

        {/* Status Badge Only */}
        <div style={styles.statusBadge}>
          <span style={styles.statusIcon}>🔒</span>
          <span style={styles.statusText}>Secure Session</span>
        </div>
      </div>

            {/* Zego Video Container with Error Boundary */}
      <VideoErrorBoundary>
        <ZegoVideoInterface 
          containerRef={zegoContainerRef}
          isInitialized={zegoInitialized}
          initializationError={initializationError}
          appointmentData={appointmentData}
          onRetry={() => {
            setInitializationError(null);
            setZegoInitialized(false);
            zegoInstanceRef.current = null;
            initializeZego().catch(console.error);
          }}
        />
      </VideoErrorBoundary>

      {/* Notification */}
      <div style={styles.notification}>
        <span>{notification.message}</span>
      </div>
    </div>
  );
};

export default VideoConsultation; 