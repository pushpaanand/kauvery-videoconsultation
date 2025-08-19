const { app } = require('@azure/functions');
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const config = {
  hmsApiUrl: process.env.HMS_API_BASE_URL,
  hmsApiKey: process.env.HMS_API_KEY,
  frontendUrl: process.env.FRONTEND_URL,
  smsApiUrl: process.env.SMS_API_URL,
  smsApiKey: process.env.SMS_API_KEY,
  emailApiUrl: process.env.EMAIL_API_URL,
  emailApiKey: process.env.EMAIL_API_KEY,
  zegoAppId: process.env.ZEGO_APP_ID,
  zegoServerSecret: process.env.ZEGO_SERVER_SECRET,
  sessionSecret: process.env.SESSION_SECRET,
  preCallTimeMinutes: parseInt(process.env.PRE_CALL_TIME_MINUTES) || 15,
  fetchIntervalMinutes: parseInt(process.env.FETCH_INTERVAL_MINUTES) || 5
};

// In-memory storage for processed appointments (in production, use Azure Table Storage or Cosmos DB)
const processedAppointments = new Set();

// Generate secure session token
function generateSessionToken(appointmentNumber) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${appointmentNumber}_${timestamp}_${random}`;
}

// Generate secure video call URL
function generateSecureVideoCallURL(appointment, sessionToken) {
  const params = new URLSearchParams({
    session_token: sessionToken,
    app_no: appointment.appointment_number,
    userid: appointment.patient_id || `user_${Date.now()}`,
    username: appointment.patient_name,
    doctor_name: appointment.doctor_name || '',
    appointment_time: appointment.appointment_time,
    room_id: appointment.appointment_number,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  });

  return `${config.frontendUrl}/consultation?${params.toString()}`;
}

// Fetch appointments from HMS
async function fetchAppointmentsFromHMS() {
  try {
    console.log('Fetching appointments from HMS...');
    
    const response = await axios.get(`${config.hmsApiUrl}/appointments/pending-video-calls`, {
      headers: {
        'Authorization': `Bearer ${config.hmsApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`Fetched ${response.data.length} appointments from HMS`);
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments from HMS:', error.message);
    return [];
  }
}

// Check if it's time to send video call URL
function shouldSendVideoCallURL(appointment) {
  const appointmentTime = new Date(appointment.appointment_time);
  const currentTime = new Date();
  const timeUntilAppointment = appointmentTime.getTime() - currentTime.getTime();
  
  // Send URL if appointment is within preCallTime and not already sent
  return timeUntilAppointment <= (config.preCallTimeMinutes * 60 * 1000) && 
         timeUntilAppointment > 0 && 
         appointment.status !== 'video_url_sent';
}

// Send SMS notification
async function sendSMSNotification(appointment, videoCallURL) {
  try {
    const message = `Dear ${appointment.patient_name}, your video consultation with ${appointment.doctor_name} is scheduled for ${new Date(appointment.appointment_time).toLocaleString('en-IN')}. Click here to join: ${videoCallURL} - Kauvery Hospital`;
    
    const response = await axios.post(config.smsApiUrl, {
      phone_number: appointment.patient_phone,
      message: message,
      appointment_id: appointment.appointment_id,
      notification_type: 'video_call_url'
    }, {
      headers: {
        'Authorization': `Bearer ${config.smsApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`SMS sent to ${appointment.patient_phone}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
}

// Send Email notification
async function sendEmailNotification(appointment, videoCallURL) {
  try {
    const emailContent = generateEmailContent(appointment, videoCallURL);
    
    const response = await axios.post(config.emailApiUrl, {
      email: appointment.patient_email,
      subject: 'Your Video Consultation Link - Kauvery Hospital',
      html_content: emailContent,
      appointment_id: appointment.appointment_id,
      notification_type: 'video_call_url'
    }, {
      headers: {
        'Authorization': `Bearer ${config.emailApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Email sent to ${appointment.patient_email}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

// Generate email content
function generateEmailContent(appointment, videoCallURL) {
  const appointmentTime = new Date(appointment.appointment_time);
  const formattedTime = appointmentTime.toLocaleString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #EC4899, #8B5CF6); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Kauvery Hospital</h1>
        <p style="color: white; margin: 10px 0 0 0;">Video Consultation</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333;">Your Video Consultation is Ready</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #8B5CF6; margin-top: 0;">Appointment Details</h3>
          <p><strong>Patient:</strong> ${appointment.patient_name}</p>
          <p><strong>Doctor:</strong> ${appointment.doctor_name}</p>
          <p><strong>Date & Time:</strong> ${formattedTime}</p>
          <p><strong>Appointment ID:</strong> ${appointment.appointment_number}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${videoCallURL}" 
             style="background: #8B5CF6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            🎥 Join Video Consultation
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
          <h4 style="margin-top: 0; color: #856404;">Important Instructions:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Click the button above 5 minutes before your appointment time</li>
            <li>Ensure you have a stable internet connection</li>
            <li>Allow camera and microphone access when prompted</li>
            <li>This link is valid for 24 hours only</li>
          </ul>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
          <p>If you have any issues, please contact our support team.</p>
          <p>Thank you for choosing Kauvery Hospital.</p>
        </div>
      </div>
    </div>
  `;
}

// Update appointment status in HMS
async function updateAppointmentStatus(appointmentId, status) {
  try {
    const response = await axios.put(`${config.hmsApiUrl}/appointments/${appointmentId}/status`, {
      status: status,
      updated_at: new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${config.hmsApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Appointment ${appointmentId} status updated to: ${status}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating appointment status:', error.message);
    return { success: false, error: error.message };
  }
}

// Process individual appointment
async function processAppointment(appointment) {
  const appointmentKey = `${appointment.appointment_number}_${appointment.appointment_time}`;
  
  // Skip if already processed
  if (processedAppointments.has(appointmentKey)) {
    return;
  }

  try {
    // Check if it's time to send the video call URL
    if (shouldSendVideoCallURL(appointment)) {
      console.log(`Processing appointment: ${appointment.appointment_number}`);
      
      // Generate secure session token and URL
      const sessionToken = generateSessionToken(appointment.appointment_number);
      const secureURL = generateSecureVideoCallURL(appointment, sessionToken);
      
      // Send notifications
      const smsResult = await sendSMSNotification(appointment, secureURL);
      const emailResult = await sendEmailNotification(appointment, secureURL);
      
      // If either SMS or Email was successful
      if (smsResult.success || emailResult.success) {
        // Mark as processed
        processedAppointments.add(appointmentKey);
        
        // Update appointment status in HMS
        await updateAppointmentStatus(appointment.appointment_id, 'video_url_sent');
        
        console.log(`✅ Video call URL sent for appointment: ${appointment.appointment_number}`);
        console.log(`   Session Token: ${sessionToken}`);
        console.log(`   Secure URL: ${secureURL}`);
      } else {
        console.error(`❌ Failed to send notifications for appointment: ${appointment.appointment_number}`);
      }
    }
  } catch (error) {
    console.error(`Error processing appointment ${appointment.appointment_number}:`, error.message);
  }
}

// Main Azure Function - runs on timer
app.timer('AppointmentScheduler', {
  schedule: `0 */${config.fetchIntervalMinutes} * * * *`, // Every X minutes
  handler: async (myTimer) => {
    const timeStamp = new Date().toISOString();
    
    console.log(`Appointment Scheduler triggered at: ${timeStamp}`);
    
    try {
      // Fetch appointments from HMS
      const appointments = await fetchAppointmentsFromHMS();
      
      // Process each appointment
      for (const appointment of appointments) {
        await processAppointment(appointment);
      }
      
      console.log(`Scheduler completed. Processed ${appointments.length} appointments.`);
    } catch (error) {
      console.error('Error in appointment scheduler:', error.message);
    }
  }
}); 