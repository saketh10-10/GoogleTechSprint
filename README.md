# 🎓 EduSync - Campus Management System

A comprehensive Next.js application for educational institution management featuring event attendance tracking, room allocation, and academic Q&A platform.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.7-orange?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🔐 **Authentication System**

- Role-based access control (Student, Faculty, Admin)
- Email/Password authentication via Firebase
- Automatic account creation on first login
- Secure session management

### 📅 **Event Attendance Management**

- Create and manage events
- Time-bound QR code generation (30-second validity)
- QR code scanning for attendance marking
- Real-time attendance tracking
- Attendance reports and analytics

### 🏢 **RoomSync - Room Allocation**

- Manage rooms, sections, and allocations
- AI-powered allocation suggestions
- Real-time availability tracking
- Conflict detection
- Export allocation reports

### 💬 **IssueHub - Q&A Platform**

- Ask and answer technical questions
- Upvote/downvote system
- Category and tag-based organization
- User reputation and leaderboard
- Follow system for users
- Trending posts algorithm

### 👤 **User Management**

- Personal profiles with statistics
- Activity tracking
- Role-based dashboards
- Profile customization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project with:
  - Authentication (Email/Password enabled)
  - Firestore Database
  - Cloud Functions (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/edusync.git
   cd edusync
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**

   Create `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   NEXT_PUBLIC_USE_EMULATORS=false
   ```

4. **Enable Firebase Authentication**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to **Authentication** → **Sign-in method**
   - Enable **Email/Password** provider

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
edusync/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   ├── dashboard/            # Dashboard pages
│   ├── events/               # Event management
│   ├── issuehub/            # Q&A platform
│   ├── login/               # Authentication
│   ├── roomsync/            # Room allocation
│   └── scanner/             # QR scanner
├── components/              # React components
│   ├── ui/                  # UI components (Radix UI)
│   ├── issuehub/           # IssueHub components
│   └── roomsync/           # RoomSync components
├── lib/                     # Utility libraries
│   ├── firebase.ts         # Firebase configuration
│   ├── auth-service.ts     # Authentication logic
│   └── issuehub-service.ts # IssueHub services
├── public/                  # Static assets
│   ├── attendance/         # Legacy HTML pages
│   ├── auth/              # Legacy auth pages
│   └── roomsync/          # Legacy RoomSync pages
├── docs/                    # Documentation
├── functions/              # Firebase Cloud Functions
└── types/                  # TypeScript type definitions
```

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16.1 with App Router & Turbopack
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend & Services

- **BaaS**: Firebase 12.7
  - Authentication
  - Firestore Database
  - Cloud Functions
  - Hosting
- **Email**: SendGrid
- **QR Codes**: qrcode.js

### Development Tools

- **Package Manager**: npm
- **Linting**: ESLint
- **Code Style**: TypeScript strict mode

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- [System Overview](docs/SYSTEM_OVERVIEW.md) - Architecture and features
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment
- [Firebase Setup](docs/FIREBASE_AUTH_ENABLE.md) - Firebase configuration
- [Improvements](docs/IMPROVEMENTS.md) - Enhancement suggestions

## 🔒 Security Features

- Firestore Security Rules for data access control
- Time-bound QR codes (30-second expiry)
- Role-based authorization
- Secure authentication with Firebase
- Input validation and sanitization
- HTTPS enforcement in production

## 👥 User Roles

### Students

- View events and generate QR codes
- Mark attendance via QR
- Ask questions on IssueHub
- View room allocations

### Faculty

- Create and manage events
- Scan QR codes for attendance
- Answer student questions
- Create room allocations
- View analytics

### Admin

- Full system access
- User management
- System configuration
- Data export and reports

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
npm run build
vercel --prod
```

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Backend powered by [Firebase](https://firebase.google.com/)

## 📧 Contact

For questions or support, please open an issue or contact the maintainers.

---

**Made with ❤️ for educational institutions**
