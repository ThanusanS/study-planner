# Appwrite Setup Guide

This Study Planner application uses Appwrite as the backend service for authentication, database, and serverless functions.

## Prerequisites

1. An Appwrite account (Cloud or Self-hosted)
2. Node.js and pnpm installed

## Step 1: Create Appwrite Project

1. Go to [Appwrite Cloud](https://cloud.appwrite.io) or your self-hosted instance
2. Create a new project
3. Note your **Project ID**

## Step 2: Configure Authentication

1. Navigate to **Auth** section in your Appwrite project
2. Enable **Email/Password** authentication
3. Configure session length (recommended: 30 days)

### Google OAuth

1. In the Auth section, enable **Google** as an OAuth provider
2. Create an OAuth client in Google Cloud Console
3. Copy the Google Client ID and Client Secret into Appwrite
4. Add your app URL to Appwrite **Platforms** as a Web app
5. Include both your local dev URL and production URL in the allowed redirect flow
6. The frontend uses Appwrite's OAuth redirect flow, so no Google API key is needed in the browser

## Step 3: Create Database

1. Go to **Databases** section
2. Create a new database called `study-planner`
3. Note your **Database ID**

## Step 4: Create Collections

Create the following collections with these attributes:

### 1. Subjects Collection

- Collection ID: `subjects`
- Attributes:
  - `userId` (string, required, size: 50)
  - `name` (string, required, size: 100)
  - `color` (string, required, size: 10)
  - `createdAt` (string, required, size: 50)
- Indexes:
  - `userId` (key: userId, type: ASC)
  - `createdAt` (key: createdAt, type: DESC)
- Permissions:
  - Read: `user:[USER_ID]`
  - Create: `user:[USER_ID]`
  - Update: `user:[USER_ID]`
  - Delete: `user:[USER_ID]`

### 2. Topics Collection

- Collection ID: `topics`
- Attributes:
  - `subjectId` (string, required, size: 50)
  - `name` (string, required, size: 100)
- Indexes:
  - `subjectId` (key: subjectId, type: ASC)
- Permissions:
  - Read: `user:[USER_ID]`
  - Create: `user:[USER_ID]`
  - Update: `user:[USER_ID]`
  - Delete: `user:[USER_ID]`

### 3. Tasks Collection

- Collection ID: `tasks`
- Attributes:
  - `userId` (string, required, size: 50)
  - `subjectId` (string, required, size: 50)
  - `title` (string, required, size: 200)
  - `dueDate` (string, required, size: 50)
  - `reminderTime` (string, size: 20)
  - `status` (string, required, size: 20)
  - `createdAt` (string, required, size: 50)
- Indexes:
  - `userId` (key: userId, type: ASC)
  - `dueDate` (key: dueDate, type: ASC)
  - `status` (key: status, type: ASC)
  - `createdAt` (key: createdAt, type: DESC)
- Permissions:
  - Read: `user:[USER_ID]`
  - Create: `user:[USER_ID]`
  - Update: `user:[USER_ID]`
  - Delete: `user:[USER_ID]`

### 4. Exams Collection

- Collection ID: `exams`
- Attributes:
  - `userId` (string, required, size: 50)
  - `subjectId` (string, required, size: 50)
  - `examName` (string, required, size: 200)
  - `examDate` (string, required, size: 50)
- Indexes:
  - `userId` (key: userId, type: ASC)
  - `examDate` (key: examDate, type: ASC)
- Permissions:
  - Read: `user:[USER_ID]`
  - Create: `user:[USER_ID]`
  - Update: `user:[USER_ID]`
  - Delete: `user:[USER_ID]`

### 5. ProgressLogs Collection

- Collection ID: `progressLogs`
- Attributes:
  - `userId` (string, required, size: 50)
  - `date` (string, required, size: 50)
  - `tasksCompleted` (integer, required)
- Indexes:
  - `userId` (key: userId, type: ASC)
  - `date` (key: date, type: DESC)
- Permissions:
  - Read: `user:[USER_ID]`
  - Create: `user:[USER_ID]`
  - Update: `user:[USER_ID]`
  - Delete: `user:[USER_ID]`

### 6. PomodoroSessions Collection

- Collection ID: `pomodoroSessions`
- Attributes:
  - `userId` (string, required, size: 50)
  - `subjectId` (string, size: 50)
  - `startTime` (string, required, size: 50)
  - `endTime` (string, required, size: 50)
  - `duration` (integer, required)
  - `createdAt` (string, required, size: 50)
- Indexes:
  - `userId` (key: userId, type: ASC)
  - `createdAt` (key: createdAt, type: DESC)
- Permissions:
  - Read: `user:[USER_ID]`
  - Create: `user:[USER_ID]`
  - Update: `user:[USER_ID]`
  - Delete: `user:[USER_ID]`

### 7. QuizHistory Collection

- Collection ID: `quizHistory`
- Attributes:
  - `userId` (string, required, size: 50)
  - `topic` (string, required, size: 200)
  - `difficulty` (string, required, size: 20)
  - `questionCount` (integer, required)
  - `questionType` (string, required, size: 20)
  - `quizContent` (string, required, size: 50000)
  - `createdAt` (string, required, size: 50)
  - `attempts` (integer, required)
- Indexes:
- Indexes:
  - `userId` (key: userId, type: ASC)
  - `createdAt` (key: createdAt, type: DESC)
  - `topic` (key: topic, type: ASC)
- Permissions:
  - Read: `user:[USER_ID]`
  - Create: `user:[USER_ID]`
  - Update: `user:[USER_ID]`
  - Delete: `user:[USER_ID]`

## Step 5: Update Configuration

Update `src/lib/appwrite.ts` with your credentials:

```typescript
export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1", // Or your self-hosted URL
  projectId: "YOUR_PROJECT_ID",
  databaseId: "YOUR_DATABASE_ID",
  subjectsCollectionId: "subjects",
  topicsCollectionId: "topics",
  tasksCollectionId: "tasks",
  examsCollectionId: "exams",
  progressLogsCollectionId: "progressLogs",
  pomodoroSessionsCollectionId: "pomodoroSessions",
  quizHistoryCollectionId: "quizHistory",
};
```

## Step 6: Configure CORS (Optional)

If deploying to production:

1. Go to **Settings** in your Appwrite project
2. Add your production domain to **Platforms**
3. Select **Web App** platform type

## Step 7: Set Up Functions (Optional)

For automated reminders and notifications:

### Task Reminder Function

1. Create a new function in Appwrite
2. Set schedule: `0 * * * *` (every hour)
3. Add code to check for upcoming tasks and send notifications

Example function code:

```javascript
const sdk = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);

  // Query tasks with reminders in the next hour
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  // Implement reminder logic here

  return res.json({ success: true });
};
```

## Step 8: Run the Application

```bash
pnpm install
pnpm dev
```

## Security Best Practices

1. **Never commit your API keys** to version control
2. Use **environment variables** for sensitive data
3. Set up proper **permissions** for each collection
4. Enable **rate limiting** in Appwrite settings
5. Use **HTTPS** in production
6. Implement **input validation** on the frontend

## Scaling for 100K Users

1. **Database Optimization**:
   - Add indexes on frequently queried fields (already included)
   - Use pagination (limit: 100 per query)
   - Implement caching on the frontend

2. **Appwrite Cloud**:
   - Upgrade to appropriate plan based on usage
   - Monitor function execution times
   - Set up automatic backups

3. **Frontend Optimization**:
   - Lazy load components
   - Implement virtual scrolling for large lists
   - Use React.memo for expensive components
   - Optimize images and assets

4. **Monitoring**:
   - Set up Appwrite analytics
   - Monitor database query performance
   - Track error rates and user metrics

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables
4. Deploy

### Appwrite

- **Cloud**: Already deployed
- **Self-hosted**: Follow [Appwrite installation guide](https://appwrite.io/docs/installation)

## Troubleshooting

### Common Issues

1. **Authentication fails**:
   - Check endpoint URL
   - Verify project ID
   - Ensure email/password auth is enabled

2. **Database errors**:
   - Verify collection IDs match config
   - Check permissions are set correctly
   - Ensure indexes are created

3. **CORS errors**:
   - Add your domain to platforms
   - Check endpoint configuration

## Support

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Discord](https://discord.com/invite/appwrite)
- [GitHub Issues](https://github.com/appwrite/appwrite/issues)
