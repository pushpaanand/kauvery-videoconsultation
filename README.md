# Kauvery Tele Consultation - Video Consultation App

A React-based video consultation application with Zego integration for healthcare telemedicine services.

## Features

- **Video Consultation**: Real-time video calling using Zego Cloud SDK
- **Appointment Management**: API integration for appointment data
- **Automatic Updates**: Scheduler for periodic appointment updates
- **Responsive Design**: Mobile-friendly interface
- **Professional Branding**: Kauvery Hospital branded interface

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Zego Cloud account and credentials
- API endpoint for appointment data

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd video-consultation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # API Configuration
   REACT_APP_API_BASE_URL=https://your-api-endpoint.com
   REACT_APP_API_TOKEN=your_api_token_here

   # Zego Configuration
   REACT_APP_ZEGO_APP_ID=167959465
   REACT_APP_ZEGO_SERVER_SECRET=1c7c018987d37f50cf8adbbfe9909415

   # App Configuration
   REACT_APP_UPDATE_INTERVAL=30000
   REACT_APP_DEFAULT_ROOM_ID=default-room
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## Usage

### URL Parameters

The app accepts the following URL parameters:

- `app_no` or `roomID`: Appointment number or room ID
- `userid`: User ID (optional, auto-generated if not provided)
- `username`: Patient name (optional, defaults to "Patient Name")

### Example URLs

```
# Basic consultation
http://localhost:3000/consultation

# With appointment data
http://localhost:3000/consultation?app_no=APP123&username=John%20Doe&userid=USER456

# Direct video call
http://localhost:3000/video?roomID=ROOM789&username=Jane%20Smith
```

### API Integration

The app expects the following API endpoints:

#### Get Appointment
```
GET /appointments/{appointmentId}
```

Response:
```json
{
  "appointment_number": "APP123",
  "user_id": "USER456",
  "patient_name": "John Doe",
  "doctor_name": "Dr. Smith",
  "appointment_time": "2024-01-15T10:00:00Z",
  "status": "active",
  "room_id": "ROOM789"
}
```

#### Get Active Appointments
```
GET /appointments/active
```

Response:
```json
{
  "appointments": [
    {
      "appointment_number": "APP123",
      "user_id": "USER456",
      "patient_name": "John Doe",
      "status": "active"
    }
  ]
}
```

#### Update Appointment Status
```
PUT /appointments/{appointmentId}/status
```

Request:
```json
{
  "status": "completed"
}
```

## Project Structure

```
src/
├── components/
│   ├── VideoConsultation.js    # Main video consultation component
│   └── VideoConsultation.css   # Component styles
├── services/
│   └── appointmentService.js   # API service and scheduler
├── App.js                      # Main app with routing
└── index.js                    # App entry point
```

## Configuration

### Zego Cloud Setup

1. Create a Zego Cloud account at [https://www.zegocloud.com/](https://www.zegocloud.com/)
2. Create a new project
3. Get your App ID and Server Secret
4. Update the environment variables with your credentials

### API Configuration

1. Set up your appointment API endpoints
2. Configure authentication (Bearer token)
3. Update the `REACT_APP_API_BASE_URL` in your `.env` file

## Features

### Video Controls
- **Microphone**: Mute/unmute audio
- **Camera**: Turn video on/off
- **Screen Share**: Share screen content
- **End Call**: Terminate the consultation
- **Participants**: View participant count
- **Chat**: Text messaging (if enabled)

### Appointment Management
- **Automatic Updates**: Fetches appointment data every 30 seconds
- **Real-time Status**: Updates appointment status
- **Fallback Handling**: Graceful degradation if API is unavailable

### Responsive Design
- **Mobile Optimized**: Works on all device sizes
- **Touch Friendly**: Optimized for touch interfaces
- **Professional UI**: Healthcare-focused design

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
Make sure to set the correct environment variables for your production environment:

```env
REACT_APP_API_BASE_URL=https://your-production-api.com
REACT_APP_API_TOKEN=your_production_token
REACT_APP_ZEGO_APP_ID=your_zego_app_id
REACT_APP_ZEGO_SERVER_SECRET=your_zego_server_secret
```

### Deployment Platforms
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect your GitHub repository
- **AWS S3**: Upload the `build` folder to an S3 bucket
- **Heroku**: Deploy using the Heroku CLI

## Troubleshooting

### Common Issues

1. **Zego SDK not loading**
   - Check your App ID and Server Secret
   - Ensure you have a stable internet connection
   - Check browser console for errors

2. **API connection issues**
   - Verify your API endpoint is accessible
   - Check authentication token
   - Review network tab for failed requests

3. **Video not working**
   - Allow camera and microphone permissions
   - Check browser compatibility
   - Ensure HTTPS is used in production

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Security Considerations

- Use HTTPS in production
- Implement proper authentication
- Validate all API inputs
- Secure your Zego credentials
- Implement rate limiting on your API

## Support

For technical support or questions:
- Check the browser console for error messages
- Review the Zego Cloud documentation
- Contact your development team

## License

This project is proprietary software for Kauvery Hospital.
