# Kauvery Hospital Video Consultation Platform

A secure, full-stack video consultation platform built with React and Express.js, featuring ZegoCloud video integration and comprehensive security measures.

## 📁 Project Structure

```
video-consultation/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoConsultation.js    # Main video interface
│   │   │   ├── VideoConsultation.css   # Video component styles
│   │   │   └── VideoCallManager.js     # Video call management
│   │   ├── assets/                     # Images and static files
│   │   ├── utils/                      # Utility functions
│   │   ├── App.js                      # Main React app component
│   │   └── index.js                    # React entry point
│   ├── public/                         # Public assets
│   └── package.json                    # Client dependencies
├── server/                 # Express.js backend server
│   └── server.js                       # Main server file
├── build/                  # Production build output
├── package.json            # Root package.json (manages both client & server)
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   
   Create `.env` files in both `client/` and `server/` directories:
   
   **client/.env:**
   ```env
   REACT_APP_ZEGO_APP_ID=your_zego_app_id
   REACT_APP_ZEGO_SERVER_SECRET=your_zego_server_secret
   REACT_APP_DECRYPTION_API_URL=https://hmsapiktv.kauverykonnect.com/Encryfile/api/values/decrypt
   REACT_APP_DECRYPTION_KEY=your_decryption_key
   REACT_APP_SERVER_URL=http://localhost:3001
   ```
   
   **server/.env:**
   ```env
   PORT=3001
   NODE_ENV=development
   DECRYPTION_KEY=your_decryption_key
   DECRYPTION_API_URL=https://hmsapiktv.kauverykonnect.com/Encryfile/api/values/decrypt
   ```

### Running the Application

#### Development Mode (Both Client & Server)
```bash
npm run dev
```
This starts:
- React development server on **port 3000**
- Express API server on **port 3001**

#### Client Only
```bash
npm run client:start
```

#### Server Only
```bash
npm run server:start
```

#### Production Mode
```bash
npm run start:prod
```

## 📋 Available Scripts

### Root Level Commands
- `npm run install:all` - Install dependencies for both client and server
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build the React application for production
- `npm run start:prod` - Build and start in production mode
- `npm run security-check` - Run security audit on both client and server
- `npm run clean:install` - Clean and reinstall all dependencies

### Client Commands
- `npm run client:start` - Start React development server
- `npm run client:build` - Build React app for production
- `npm run client:test` - Run React tests

### Server Commands
- `npm run server:start` - Start Express server
- `npm run server:dev` - Start Express server in development mode
- `npm run server:prod` - Start Express server in production mode
- `npm run dev:server` - Start Express server with auto-restart (nodemon)

## 🔧 Configuration

### Environment Variables

#### Client (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_ZEGO_APP_ID` | ZegoCloud application ID | Yes |
| `REACT_APP_ZEGO_SERVER_SECRET` | ZegoCloud server secret | Yes |
| `REACT_APP_DECRYPTION_API_URL` | External decryption API URL | Yes |
| `REACT_APP_DECRYPTION_KEY` | AES decryption key | Yes |
| `REACT_APP_SERVER_URL` | Express server URL | Yes |

#### Server (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `DECRYPTION_KEY` | AES decryption key | Required |
| `DECRYPTION_API_URL` | External decryption API URL | Required |

## 🔒 Security Features

### Server Security
- **CORS Protection**: Dynamic origin validation
- **Rate Limiting**: 100 requests per 15 minutes
- **Security Headers**: Via Helmet.js
- **Input Validation**: Comprehensive parameter validation
- **AES Encryption**: Configurable key lengths (16, 24, 32 bytes)
- **Error Handling**: Comprehensive error management

### Client Security
- **Environment Validation**: Startup validation of required variables
- **Parameter Validation**: URL parameter validation and decryption
- **Access Control**: Token-based access control
- **Error Boundaries**: React error boundaries for DOM conflicts

## 🎨 Features

### Video Consultation Interface
- **ZegoCloud Integration**: Professional video/audio streaming
- **Custom UI**: Branded pre-join and call-ended interfaces
- **Real-time Status**: Participant monitoring and status updates
- **Responsive Design**: Optimized for desktop, laptop, tablet, and mobile
- **DOM Safety**: Error boundaries and safe DOM manipulation

### User Experience
- **Access Control**: Secure parameter-based access
- **Error Handling**: Graceful error handling and user feedback
- **Loading States**: Professional loading and status indicators
- **Branding**: Kauvery Hospital branding throughout

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000 already in use:**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   ```

2. **Port 3001 already in use:**
   ```bash
   # Kill process on port 3001
   npx kill-port 3001
   ```

3. **Environment variables not loading:**
   - Ensure `.env` files are in the correct directories
   - Restart the development server after adding new variables

4. **ZegoCloud connection issues:**
   - Verify `REACT_APP_ZEGO_APP_ID` and `REACT_APP_ZEGO_SERVER_SECRET`
   - Check ZegoCloud dashboard for app status

### Development Tips

- Use `npm run dev:server` for server development with auto-restart
- Check browser console and server logs for detailed error information
- Use `npm run security-check` before deployment

## 📦 Deployment

### Production Build
```bash
npm run build
npm run start:prod
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production environment variables
3. Set up proper CORS origins for production domain
4. Configure SSL certificates for HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and security checks
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏥 About Kauvery Hospital

Kauvery Hospital is a leading healthcare provider committed to delivering exceptional patient care through innovative technology solutions.

---

**For support or questions, please contact the development team.** 