const { app } = require('@azure/functions');
const axios = require('axios');

// Configuration
const config = {
  hmsApiUrl: process.env.HMS_API_BASE_URL,
  hmsApiKey: process.env.HMS_API_KEY,
  sessionSecret: process.env.SESSION_SECRET
};

// Validate session token
async function validateSessionToken(sessionToken) {
  try {
    // Extract appointment number from session token
    const parts = sessionToken.split('_');
    if (parts.length < 3) {
      return { valid: false, error: 'Invalid session token format' };
    }

    const appointmentNumber = parts[0];
    const timestamp = parseInt(parts[1]);
    const currentTime = Date.now();

    // Check if session is expired (24 hours)
    const sessionAge = currentTime - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (sessionAge > maxAge) {
      return { valid: false, error: 'Session has expired' };
    }

    // Fetch appointment details from HMS to validate
    const appointment = await fetchAppointmentFromHMS(appointmentNumber);
    
    if (!appointment) {
      return { valid: false, error: 'Appointment not found' };
    }

    // Check if appointment status allows video call
    if (appointment.status !== 'video_url_sent' && appointment.status !== 'confirmed') {
      return { valid: false, error: 'Appointment not ready for video call' };
    }

    // Check if appointment time is within valid range (15 minutes before to 2 hours after)
    const appointmentTime = new Date(appointment.appointment_time);
    const timeUntilAppointment = appointmentTime.getTime() - currentTime;
    const maxEarlyTime = 15 * 60 * 1000; // 15 minutes before
    const maxLateTime = 2 * 60 * 60 * 1000; // 2 hours after

    if (timeUntilAppointment > maxEarlyTime && timeUntilAppointment < -maxLateTime) {
      return { valid: false, error: 'Video call not available at this time' };
    }

    return {
      valid: true,
      appointment: appointment,
      sessionToken: sessionToken
    };

  } catch (error) {
    console.error('Error validating session token:', error.message);
    return { valid: false, error: 'Session validation failed' };
  }
}

// Fetch appointment from HMS
async function fetchAppointmentFromHMS(appointmentNumber) {
  try {
    const response = await axios.get(`${config.hmsApiUrl}/appointments/${appointmentNumber}`, {
      headers: {
        'Authorization': `Bearer ${config.hmsApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching appointment from HMS:', error.message);
    return null;
  }
}

// Update session status
async function updateSessionStatus(sessionToken, status) {
  try {
    const parts = sessionToken.split('_');
    const appointmentNumber = parts[0];

    const response = await axios.put(`${config.hmsApiUrl}/appointments/${appointmentNumber}/session-status`, {
      session_token: sessionToken,
      status: status,
      updated_at: new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${config.hmsApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Session ${sessionToken} status updated to: ${status}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating session status:', error.message);
    return { success: false, error: error.message };
  }
}

// HTTP trigger for session validation
app.http('SessionValidator', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { sessionToken } = await request.json();

      if (!sessionToken) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Session token is required'
          }
        };
      }

      // Validate session token
      const validation = await validateSessionToken(sessionToken);

      if (validation.valid) {
        // Update session status to 'validated'
        await updateSessionStatus(sessionToken, 'validated');

        return {
          status: 200,
          body: {
            success: true,
            valid: true,
            appointment: validation.appointment,
            sessionToken: validation.sessionToken
          }
        };
      } else {
        return {
          status: 401,
          body: {
            success: false,
            valid: false,
            error: validation.error
          }
        };
      }

    } catch (error) {
      console.error('Error in session validator:', error.message);
      
      return {
        status: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      };
    }
  }
}); 