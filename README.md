# LearnSphere - E-Learning Platform

A modern, full-featured e-learning platform built with React, TypeScript, and Firebase.

![LearnSphere](https://img.shields.io/badge/LearnSphere-E--Learning-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Firebase](https://img.shields.io/badge/Firebase-10-ffca28)

## Features

### For Learners
- **Course Discovery** - Browse and search published courses
- **Enrollment System** - Enroll in courses and track progress
- **Video & Document Lessons** - Multiple content types support
- **Interactive Quizzes** - Test knowledge with auto-graded quizzes
- **Progress Tracking** - Visual progress indicators for each course
- **Gamification** - Earn points and badges as you learn
- **Course Reviews** - Rate and review completed courses

### For Instructors
- **Course Builder** - Create courses with lessons, quizzes, and attachments
- **Quiz Builder** - Design quizzes with multiple-choice questions
- **Student Analytics** - Track enrollments and completion rates
- **Course Management** - Publish/unpublish courses, manage visibility
- **Invitation System** - Invite specific learners to private courses

### For Admins
- **Admin Dashboard** - Platform-wide analytics and management
- **User Management** - View and manage all users, change roles
- **Course Oversight** - Monitor all courses across the platform
- **Instructor Management** - Create instructor accounts, manage credentials
- **Reporting** - Export enrollment and completion data

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Forms**: React Hook Form, Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/learnsphere.git
   cd learnsphere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Deploy Firestore Rules**
   ```bash
   firebase login
   firebase deploy --only firestore:rules
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → **Sign-in method** → Enable **Email/Password** and **Google**
3. Create a **Firestore Database** in production mode
4. Enable **Storage** for file uploads
5. Copy your Firebase config to the `.env` file

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities, API, Firebase config
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app with routing
│   └── index.html
├── shared/
│   ├── types.ts            # TypeScript interfaces
│   └── schema.ts           # Zod schemas
├── firestore.rules         # Firestore security rules
├── firebase.json           # Firebase configuration
└── package.json
```

## User Roles

| Role | Permissions |
|------|-------------|
| **Learner** | Browse courses, enroll, complete lessons, take quizzes |
| **Instructor** | Create/manage own courses, view student analytics |
| **Admin** | Full platform access, user management, create instructors |

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Lucide Icons](https://lucide.dev/) for the icon set
- [Firebase](https://firebase.google.com/) for backend services

---

Built with ❤️ for the Odoo Hackathon
