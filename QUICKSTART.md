# Quick Start Guide

Get the Study Planner running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- An Appwrite account

## Step 1: Get Appwrite Credentials (2 minutes)

### Option A: Appwrite Cloud (Easiest)

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up or log in
3. Click "Create Project"
4. Name it "Study Planner Dev"
5. Copy your **Project ID** (top right)

### Option B: Use Demo Mode (Testing Only)

Skip Appwrite setup and use mock data - see demo mode instructions at the end.

## Step 2: Create Database & Collections (5 minutes)

1. In Appwrite Console, go to **Databases**
2. Click "Create Database" → Name it "study-planner"
3. Copy your **Database ID**
4. Create these collections (click "Create Collection" for each):

**Quick Collection Setup:**

| Collection Name | ID | Attributes to Add |
|----------------|-----|-------------------|
| subjects | subjects | userId (string, 50), name (string, 100), color (string, 10), createdAt (string, 50) |
| topics | topics | subjectId (string, 50), name (string, 100) |
| tasks | tasks | userId (string, 50), subjectId (string, 50), title (string, 200), dueDate (string, 50), reminderTime (string, 20), status (string, 20), createdAt (string, 50) |
| exams | exams | userId (string, 50), subjectId (string, 50), examName (string, 200), examDate (string, 50) |
| progressLogs | progressLogs | userId (string, 50), date (string, 50), tasksCompleted (integer) |
| pomodoroSessions | pomodoroSessions | userId (string, 50), subjectId (string, 50), startTime (string, 50), endTime (string, 50), duration (integer), createdAt (string, 50) |

**For each collection:**
- Set permissions to: `Any` (for development)
- In production, use proper user-based permissions

## Step 3: Enable Authentication (1 minute)

1. Go to **Auth** section
2. Click on **Email/Password**
3. Toggle to **Enabled**

## Step 4: Configure the App (1 minute)

Open `src/lib/appwrite.ts` and update:

```typescript
export const appwriteConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'YOUR_PROJECT_ID', // ← Paste here
  databaseId: 'YOUR_DATABASE_ID', // ← Paste here
  subjectsCollectionId: 'subjects',
  topicsCollectionId: 'topics',
  tasksCollectionId: 'tasks',
  examsCollectionId: 'exams',
  progressLogsCollectionId: 'progressLogs',
  pomodoroSessionsCollectionId: 'pomodoroSessions',
};
```

## Step 5: Run the App (30 seconds)

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open your browser to `http://localhost:5173`

## Step 6: Create Your Account

1. Click **Register** tab
2. Enter your name, email, and password (min 8 characters)
3. Click **Create Account**
4. You're in! 🎉

## First Steps in the App

### 1. Create Subjects (30 seconds)

- Click **Subjects** in navigation
- Click **Add Subject**
- Add: Mathematics, Science, History (pick colors!)

### 2. Add Your First Task (30 seconds)

- Click **Tasks** in navigation
- Click **Add Task**
- Enter: "Complete homework"
- Select a subject
- Set due date to today
- Click **Create Task**

### 3. Try the Pomodoro Timer (25 minutes)

- Click **Pomodoro** in navigation
- Select a subject
- Click **Start**
- Focus for 25 minutes!

### 4. Track an Exam (30 seconds)

- Click **Exams** in navigation
- Click **Add Exam**
- Enter exam details
- See countdown on dashboard!

## Troubleshooting

### "Failed to load tasks"

**Fix**: Check Appwrite console:
1. Verify Database ID is correct
2. Verify Collection IDs match
3. Check permissions are set to "Any" for development

### "Login failed"

**Fix**: 
1. Verify Email/Password auth is enabled in Appwrite
2. Check Project ID is correct
3. Clear browser cache and try again

### "Collection not found"

**Fix**: 
1. Ensure collection ID exactly matches (case-sensitive)
2. Verify database ID is correct
3. Check collection exists in Appwrite console

### Still having issues?

1. Open browser console (F12)
2. Check for error messages
3. Verify network requests are going to correct endpoint
4. See [APPWRITE_SETUP.md](./APPWRITE_SETUP.md) for detailed setup

## Demo Mode (No Appwrite Setup)

Want to try the app without Appwrite setup? Use demo mode with mock data:

**Note**: This is for testing UI only. Data won't persist.

## Next Steps

### Learn More

- [Full Setup Guide](./APPWRITE_SETUP.md) - Detailed Appwrite configuration
- [README](./README.md) - Complete documentation
- [Deployment Guide](./DEPLOYMENT.md) - Deploy to production

### Customize

- Change theme colors in `src/styles/theme.css`
- Add more subject colors in `src/components/SubjectsManager.tsx`
- Customize Pomodoro times in `src/components/PomodoroTimer.tsx`

### Add Features

- Set up [Appwrite Functions](./APPWRITE_FUNCTIONS.md) for notifications
- Enable dark mode by default
- Add custom subjects
- Create study templates

## Production Deployment

Ready to deploy? See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Deploying to Vercel
- Setting up custom domain
- Configuring for 100K+ users
- Security best practices

## Support

- 📚 [Appwrite Docs](https://appwrite.io/docs)
- 💬 [GitHub Issues](https://github.com/yourusername/study-planner/issues)
- 🎮 [Appwrite Discord](https://discord.com/invite/appwrite)

---

**You're all set!** Start planning your studies! 🎓
