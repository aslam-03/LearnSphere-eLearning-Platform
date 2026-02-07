# LearnSphere - eLearning Platform

A production-grade, full-stack eLearning platform built for the hackathon. LearnSphere enables instructors to create comprehensive courses with lessons, quizzes, and assessments, while learners can discover, enroll, and complete courses with gamification features.

## 🎯 Features

### **Multi-Role System**
- **Admin**: Full platform access, instructor account creation, system management
- **Instructor**: Course creation, lesson management, quiz builder, learner reporting
- **Learner**: Course discovery, enrollment, full-screen learning, quizzes, progress tracking

**Note**: Instructors cannot self-register. Only admins can create instructor accounts through the admin panel.

### **Instructor/Admin Features**
- ✅ Course CRUD (Create, Read, Update, Delete)
- ✅ Rich course editor with metadata management
- ✅ Lesson builder supporting:
  - Video lessons (YouTube/Drive embed)
  - Document lessons (PDF via Cloudflare R2)
  - Image lessons (Images via R2)
  - Quiz lessons with multiple questions
- ✅ Quiz builder with reward configuration
- ✅ Course publishing controls
- ✅ Learner reporting (enrollments, progress, completion status)
- ✅ List & Kanban view for courses
- ✅ Course sharing
- ✅ Admin: Create instructor accounts
- ✅ Admin: Manage platform users
- ✅ Logout functionality in all dashboards

### **Learner Features**
- ✅ Course discovery with search
- ✅ Course enrollment
- ✅ My Courses dashboard with progress tracking
- ✅ Full-screen learning player
- ✅ Lesson sidebar navigation
- ✅ Quiz experience (one question per page, multiple attempts)
- ✅ Course reviews and ratings
- ✅ Gamification (points & badges)
- ✅ Profile panel with badge levels

### **Gamification System**
- Points earned through quiz completion
- Badge progression:
  - Newbie: 0 points
  - Explorer: 20 points
  - Achiever: 40 points
  - Specialist: 60 points
  - Expert: 80 points
  - Master: 100 points
- Attempt-based rewards (decreasing points per retry)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite |
| **Styling** | Tailwind CSS |
| **Routing** | React Router v6 |
| **Authentication** | Firebase Authentication (Email/Password) |
| **Database** | Cloud Firestore (Free Tier) |
| **Backend Logic** | Firebase Cloud Functions (Firestore triggers only) |
| **File Storage** | Cloudflare R2 (Public bucket) |
| **Deployment** | Vercel (Frontend), Firebase (Functions) |
| **Notifications** | React Hot Toast |

---

## 📁 Project Structure

```
LearnSphere/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx      # Role-based route protection
│   │   ├── config/
│   │   │   └── firebase.js             # Firebase initialization
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx         # Authentication context provider
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── CreateInstructorPage.jsx  # Admin creates instructors
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx       # Login page
│   │   │   │   └── RegisterPage.jsx    # Learner registration
│   │   │   ├── instructor/
│   │   │   │   ├── InstructorDashboard.jsx   # Course management
│   │   │   │   └── CourseEditPage.jsx        # Course + lesson editor
│   │   │   └── learner/
│   │   │       ├── LearnerDashboard.jsx      # My courses dashboard
│   │   │       ├── ExplorePage.jsx           # Browse/discover courses
│   │   │       ├── CourseDetailPage.jsx      # Course details & enrollment
│   │   │       └── LearningPlayerPage.jsx    # Full-screen learning player
│   │   ├── services/
│   │   │   ├── courseService.js        # Firestore course operations
│   │   │   ├── userService.js          # Firestore user operations
│   │   │   └── uploadService.js        # Cloudflare R2 upload utilities
│   │   ├── styles/
│   │   │   └── globals.css             # Global Tailwind styles
│   │   ├── utils/
│   │   │   └── helpers.js              # Common helper functions
│   │   ├── App.jsx                     # Main app with routing
│   │   └── main.jsx                    # React entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── functions/
│   ├── src/
│   │   └── index.js                    # Firebase Cloud Functions
│   └── package.json
├── .env                                # Environment variables (not in git)
├── .env.example                        # Example environment file
├── firebase.json                       # Firebase configuration
├── firestore.rules                     # Security rules
├── firestore.indexes.json              # Firestore indexes
├── vercel.json                         # Vercel deployment config
└── README.md                           # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project (free tier)
- Cloudflare account with R2 storage
- Vercel account (optional, for deployment)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LearnSphere-eLearning-Platform
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install functions dependencies
cd ../functions
npm install

# Return to root
cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudflare R2 Configuration
VITE_R2_ACCOUNT_ID=your_cloudflare_account_id
VITE_R2_ACCESS_KEY_ID=your_r2_access_key
VITE_R2_SECRET_ACCESS_KEY=your_r2_secret_key
VITE_R2_BUCKET_NAME=learnsphere-assets
VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### 4. Firebase Setup

#### Initialize Firebase
```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- Firestore (Database)
- Functions (Node.js)
- Hosting (optional, or use Vercel)

#### Deploy Firestore Rules and Indexes
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

#### Deploy Cloud Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 5. Cloudflare R2 Setup

1. Create R2 bucket: `learnsphere-assets`
2. Enable public access
3. Generate access keys (API tokens)
4. Update `.env` with credentials

### 6. Run Development Server
```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173` (Vite default port)

---

## 📦 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env`

4. Redeploy:
```bash
vercel --prod
```

### Deploy Firebase Functions
```bash
firebase deploy --only functions
```

---

## 🗄️ Firestore Data Model

See [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) for complete database schema documentation.

### Key Collections:
- **users**: User profiles with roles and gamification data
- **courses**: Course metadata and configuration
- **lessons**: Lesson content (video, document, image, quiz)
- **quizzes**: Quiz questions and reward configuration
- **enrollments**: Learner course enrollments and progress
- **lessonProgress**: Individual lesson completion tracking
- **quizAttempts**: Quiz submission history and scoring
- **reviews**: Course reviews and ratings

---

## 🔐 Security Rules

The platform uses role-based security rules:
- **Learners** can only access published courses and their own data
- **Instructors** can manage their own courses
- **Admins** have full access

See [firestore.rules](./firestore.rules) for complete security configuration.

---

## 🎮 Usage Guide

### For Instructors

1. **Get instructor account** from an admin (instructors cannot self-register)
2. **Login** with your instructor credentials
3. **Create a course**:
   - Add title, description, tags, cover image
   - Set visibility and access rules
   - Publish when ready
3. **Add lessons**:
   - Video: Paste YouTube/Drive URL
   - Document: Upload PDF to R2
   - Image: Upload image to R2
   - Quiz: Build questions with multiple options
4. **Configure quiz rewards**:
   - Set points for attempts 1-4+
5. **View reports**:
   - Track enrollments, progress, completions

### For Learners

1. **Register** as a learner
2. **Discover courses**:
   - Browse published courses
   - Search by name or tags
3. **Enroll in courses**
4. **Start learning**:
   - Full-screen player
   - Complete lessons sequentially
   - Take quizzes (multiple attempts allowed)
5. **Earn points & badges**:
   - Quiz completion awards points
   - Unlock badges at thresholds
6. **Write reviews**:
   - Rate and review completed courses

---

## 🧪 Testing

### Test Accounts

Create test accounts:
- **Admin**: Manually create in Firestore with `role: 'admin'` in users collection
- **Instructor**: Admin creates via `/admin/create-instructor` page
- **Learner**: Self-register via signup page (only learner role available)

### Sample Data

Manually create sample courses via the instructor dashboard to test features.

---

## 📊 Performance Optimization

### Free Tier Considerations
- **Read Minimization**: Pagination with `limit()` queries
- **Write Batching**: Batch related writes together
- **Denormalization**: Store computed values (e.g., `lessonCount`)
- **No Real-time**: Use one-time reads instead of listeners

### Caching
- Course data cached in component state
- User profile cached in AuthContext

---

## 🐛 Known Limitations

1. **Payment**: Mock implementation (no real payment gateway)
2. **Video Hosting**: Only YouTube/Drive embeds (no R2 video streaming)
3. **Real-time Updates**: Limited to avoid quota exhaustion
4. **Advanced Reporting**: Basic metrics only
5. **Notifications**: No email/push notifications

---

## 🔧 Troubleshooting

### Firebase Auth Errors
- Ensure Firebase Auth is enabled in console
- Verify email/password provider is active

### Firestore Permission Denied
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check user role in Firestore console

### R2 Upload Fails
- Verify bucket is public
- Check access keys are correct
- Ensure CORS is configured

### Cloud Functions Not Triggering
- Check function deployment: `firebase deploy --only functions`
- View logs: `firebase functions:log`

---

## 📝 License

This project is built for hackathon purposes. Feel free to use and modify.

---

## 👥 Contributors

Built with ❤️ for the LearnSphere Hackathon

---

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Cloudflare R2 for file storage
- Vercel for deployment
- Tailwind CSS for styling
- React community for excellent tools

---

## 📧 Support

For issues or questions:
1. Check the [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md)
2. Review Firebase console for errors
3. Check browser console for client-side issues

---

**Built for LearnSphere Hackathon 2026** 🚀
