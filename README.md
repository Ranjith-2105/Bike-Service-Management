# 🚴‍♂️ Bike Service Management System

A full-stack web application for managing bike service bookings with a modern UI, admin panel, and AI-powered chatbot.

## 🚀 Features

- **User Authentication**: Login/Signup with secure password handling
- **Service Booking**: Book bike services with date/time selection
- **Admin Panel**: Manage bookings, update status, and send automated emails
- **AI Chatbot**: Powered by Google Gemini AI for customer support
- **PDF Reports**: Generate service history reports for users
- **Email Notifications**: Automated emails for status updates
- **Modern UI**: Professional design with light/dark theme support

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Axios for API calls
- Modern CSS with glassmorphism effects

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Nodemailer for email notifications
- PDFKit for report generation

### AI Chatbot
- Google Generative AI (Gemini)
- Multer for file uploads
- Express server on port 5000

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Google AI API key for chatbot

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install main server dependencies
cd server
npm install

# Install chatbot dependencies
cd ../chatbot
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration

The project includes a setup script that creates the necessary `.env` files:

```bash
# Run from project root
node setup-env.js
```

This creates:
- `server/.env` - Main server configuration
- `chatbot/.env` - Chatbot API configuration

### 3. Database Setup

The MongoDB connection is already configured in the code. Make sure your MongoDB Atlas cluster allows connections from your IP address.

### 4. Start the Application

#### Option 1: Automated Startup (Recommended)
```bash
# From project root
node start-servers.js
```

#### Option 2: Manual Startup
```bash
# Terminal 1 - Main Server
cd server
npm run dev

# Terminal 2 - Chatbot Server
cd chatbot
npm start

# Terminal 3 - Frontend
cd client
npm run dev
```

### 5. Test the Application

```bash
# Run tests to verify all servers
node test-servers.js
```

## 🌐 Server URLs

- **Main Server**: http://localhost:3001
- **Chatbot API**: http://localhost:5000
- **Frontend**: http://localhost:5173

## 👤 Default Admin Credentials

- **Email**: admin@gmail.com
- **Password**: Admin-01

## 📱 Usage

### For Users
1. Visit http://localhost:5173
2. Sign up for a new account or login
3. Book a bike service
4. View your booking history
5. Download PDF reports
6. Chat with the AI assistant

### For Admins
1. Login with admin credentials
2. View all service bookings
3. Update booking status (Pending → Accepted → Completed)
4. Set delivery dates and kilometers
5. Add service amounts
6. Send automated email notifications

## 🔧 Configuration

### Email Settings
Update `server/.env` with your SMTP credentials:
```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
MAIL_FROM=your-email@domain.com
```

### Chatbot API
Update `chatbot/.env` with your Google AI API key:
```
GEMINI_API_KEY=your-api-key
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**: Make sure ports 3001, 5000, and 5173 are available
2. **MongoDB Connection**: Check your Atlas cluster IP whitelist
3. **Chatbot Not Responding**: Verify your Google AI API key
4. **Email Not Sending**: Check SMTP credentials and firewall settings

### Server Status Check
```bash
# Check if servers are running
curl http://localhost:3001
curl http://localhost:5000/health
curl http://localhost:5173
```

## 📁 Project Structure

```
Full_Stack_Project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── assets/css/     # Styling files
│   └── package.json
├── server/                 # Main backend server
│   ├── models/            # MongoDB models
│   ├── index.js           # Main server file
│   └── package.json
├── chatbot/               # AI chatbot server
│   ├── server.js          # Chatbot server
│   └── package.json
├── start-servers.js       # Automated startup script
├── test-servers.js        # Server testing script
└── setup-env.js          # Environment setup script
```

## 🎨 UI Features

- **Modern Design**: Glassmorphism effects and gradients
- **Responsive Layout**: Works on desktop and mobile
- **Theme Support**: Light/dark mode toggle
- **Animations**: Smooth transitions and hover effects
- **Professional Styling**: Clean, modern interface

## 📧 Email Notifications

The system automatically sends emails when:
- Service status changes to "Accepted" (with delivery date and KM)
- Service status changes to "Completed" (with amount due)

## 📊 Reports

Users can download PDF reports containing:
- Service history (Accepted status only)
- Total spending summary
- Professional formatting with headers

## 🤖 AI Chatbot

The chatbot supports:
- Text conversations
- Image uploads and analysis
- Multiple Gemini model fallbacks
- Error handling and retry logic

## 🔒 Security

- Password input fields with show/hide toggle
- Secure API key management
- Input validation and sanitization
- CORS configuration

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Happy Coding! 🚴‍♂️✨**

*Project owned by Ranjith.M.V*