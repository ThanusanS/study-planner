import { Client, Account, Databases, Functions } from "appwrite";

// Appwrite Configuration
// IMPORTANT: Replace these with your actual Appwrite project values
export const appwriteConfig = {
  endpoint: "https://sgp.cloud.appwrite.io/v1", // Your Appwrite endpoint
  projectId: "69d4644900361e0d0c92", // Your project ID
  databaseId: "studyplan", // Your database ID
  // Collection IDs
  subjectsCollectionId: "subjects",
  topicsCollectionId: "topics",
  tasksCollectionId: "tasks",
  examsCollectionId: "exams",
  progressLogsCollectionId: "progressLogs",
  pomodoroSessionsCollectionId: "pomodoroSessions",
  quizHistoryCollectionId: "quizhistory",
};

// Initialize Appwrite Client
const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

// Export services
export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);

export default client;
