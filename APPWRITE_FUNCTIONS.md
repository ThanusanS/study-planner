# Appwrite Functions Guide

This document describes the serverless functions you can deploy to Appwrite for automated notifications and background tasks.

## Overview

Appwrite Functions are serverless functions that run on the Appwrite backend. They can be triggered by:
- Scheduled cron jobs
- Events (database changes, authentication events)
- HTTP requests

## Functions to Deploy

### 1. Task Reminders Function

**Purpose**: Sends browser/push notifications for tasks with upcoming reminders

**Trigger**: Cron schedule - `0 * * * *` (every hour)

**Environment Variables**:
```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
DATABASE_ID=your_database_id
TASKS_COLLECTION_ID=tasks
```

**Logic**:
1. Query all pending tasks with reminder times
2. Check if reminder time matches current hour
3. Verify task is due today
4. Send push notification to user
5. Log results

**Code Template**:
```javascript
const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const now = new Date();
  const currentHour = now.getHours();

  // Query tasks with reminders
  const tasks = await databases.listDocuments(
    process.env.DATABASE_ID,
    process.env.TASKS_COLLECTION_ID,
    [
      sdk.Query.equal('status', 'pending'),
      sdk.Query.isNotNull('reminderTime')
    ]
  );

  // Check each task and send reminders
  for (const task of tasks.documents) {
    const [hour, minute] = task.reminderTime.split(':');
    if (parseInt(hour) === currentHour) {
      // Send notification logic here
      log(`Reminder sent for: ${task.title}`);
    }
  }

  return res.json({ success: true });
};
```

### 2. Exam Alerts Function

**Purpose**: Sends daily alerts for upcoming exams (1, 3, and 7 days before)

**Trigger**: Cron schedule - `0 8 * * *` (daily at 8 AM)

**Environment Variables**:
```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
DATABASE_ID=your_database_id
EXAMS_COLLECTION_ID=exams
```

**Logic**:
1. Calculate dates for 1, 3, and 7 days from today
2. Query exams matching these dates
3. Send alerts to users
4. Log results

**Code Template**:
```javascript
const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const alertDays = [1, 3, 7];

  for (const days of alertDays) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dateString = targetDate.toISOString().split('T')[0];

    const exams = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.EXAMS_COLLECTION_ID,
      [sdk.Query.equal('examDate', dateString)]
    );

    // Send alerts for found exams
    log(`Found ${exams.documents.length} exams ${days} days away`);
  }

  return res.json({ success: true });
};
```

### 3. Progress Logger Function

**Purpose**: Automatically log daily progress based on completed tasks

**Trigger**: Cron schedule - `0 23 * * *` (daily at 11 PM)

**Environment Variables**:
```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
DATABASE_ID=your_database_id
TASKS_COLLECTION_ID=tasks
PROGRESS_LOGS_COLLECTION_ID=progressLogs
```

**Logic**:
1. Get all users from authentication
2. For each user, count completed tasks for today
3. Create or update progress log entry
4. Calculate streak

**Code Template**:
```javascript
const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const today = new Date().toISOString().split('T')[0];

  // Get tasks completed today
  const tasks = await databases.listDocuments(
    process.env.DATABASE_ID,
    process.env.TASKS_COLLECTION_ID,
    [
      sdk.Query.equal('status', 'completed'),
      sdk.Query.equal('dueDate', today)
    ]
  );

  // Group by user and create progress logs
  const userProgress = {};
  for (const task of tasks.documents) {
    userProgress[task.userId] = (userProgress[task.userId] || 0) + 1;
  }

  for (const [userId, count] of Object.entries(userProgress)) {
    await databases.createDocument(
      process.env.DATABASE_ID,
      process.env.PROGRESS_LOGS_COLLECTION_ID,
      sdk.ID.unique(),
      {
        userId,
        date: today,
        tasksCompleted: count
      }
    );
    log(`Progress logged for user ${userId}: ${count} tasks`);
  }

  return res.json({ success: true, usersLogged: Object.keys(userProgress).length });
};
```

## Deployment Steps

### 1. Create Function in Appwrite Console

1. Navigate to **Functions** in your Appwrite project
2. Click **Create Function**
3. Enter function details:
   - **Name**: task-reminders (or exam-alerts, progress-logger)
   - **Runtime**: Node.js 18.0
   - **Entrypoint**: index.js
   - **Schedule**: Enter cron expression
4. Click **Create**

### 2. Add Environment Variables

1. In function settings, go to **Variables**
2. Add all required environment variables
3. **Important**: Keep API key secure!

### 3. Deploy Function Code

**Option A: Via Appwrite CLI**
```bash
appwrite deploy function
```

**Option B: Via Console**
1. Go to function **Deployments** tab
2. Click **Create Deployment**
3. Upload code as ZIP or connect to Git
4. Click **Deploy**

### 4. Test Function

1. Go to **Execute** tab
2. Click **Execute Now**
3. Check **Logs** for output
4. Verify notifications are sent

## Alternative: Browser-Based Notifications

Since Appwrite Functions require additional setup, you can also implement reminders directly in the browser:

### Implementation in React

```typescript
// In TasksManager component
useEffect(() => {
  const checkReminders = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    tasks.forEach(task => {
      if (task.reminderTime && task.status === 'pending') {
        const [hour, minute] = task.reminderTime.split(':').map(Number);
        
        if (hour === currentHour && Math.abs(minute - currentMinute) <= 1) {
          sendNotification('Task Reminder', {
            body: task.title,
            tag: `task-${task.$id}`,
          });
        }
      }
    });
  };

  // Check every minute
  const interval = setInterval(checkReminders, 60000);
  return () => clearInterval(interval);
}, [tasks]);
```

This approach:
- Works entirely in the browser
- No server-side functions needed
- Requires app to be open
- Uses browser notifications API

## Best Practices

1. **Error Handling**: Always wrap code in try-catch
2. **Logging**: Use `log()` for debugging
3. **Rate Limits**: Respect Appwrite rate limits
4. **Pagination**: Use pagination for large datasets
5. **Timeouts**: Set appropriate execution timeouts
6. **Testing**: Test thoroughly before deploying
7. **Monitoring**: Monitor function execution logs

## Troubleshooting

### Function Not Executing

1. Check cron expression syntax
2. Verify function is enabled
3. Check execution logs for errors

### Missing Notifications

1. Verify Messaging service is configured
2. Check user has notification permissions
3. Verify push notification tokens exist

### Performance Issues

1. Add database indexes
2. Optimize queries
3. Reduce batch size
4. Use pagination

## Security Considerations

1. **API Keys**: Never expose in client code
2. **Permissions**: Use least privilege principle
3. **Input Validation**: Validate all data
4. **Rate Limiting**: Implement rate limits
5. **Logging**: Don't log sensitive data

## Cost Optimization

1. **Scheduling**: Run only when needed
2. **Batch Processing**: Process multiple items together
3. **Efficient Queries**: Use indexes and filters
4. **Caching**: Cache frequently accessed data
5. **Cleanup**: Delete old logs and data

## Monitoring

Track these metrics:
- Execution count
- Success rate
- Execution time
- Error rate
- Notification delivery rate

## Support

- [Appwrite Functions Docs](https://appwrite.io/docs/functions)
- [Node.js SDK](https://appwrite.io/docs/sdks#server)
- [Cron Expression Guide](https://crontab.guru/)
