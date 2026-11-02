import { Client, Account, Databases, Functions } from "appwrite";

// Appwrite Configuration
// IMPORTANT: Replace these with your actual Appwrite project values
export const appwriteConfig = {
  endpoint:
    import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || "",
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || "studyplan",
  // Collection IDs
  subjectsCollectionId: "subjects",
  topicsCollectionId: "topics",
  tasksCollectionId: "tasks",
  examsCollectionId: "exams",
  progressLogsCollectionId: "progressLogs",
  pomodoroSessionsCollectionId: "pomodoroSessions",
  quizHistoryCollectionId: "quizhistory",
  // Billing & Pricing Collections
  userPlansCollectionId: "userPlans",
  usageLogsCollectionId: "usageLogs",
  billingHistoryCollectionId: "billingHistory",
  // AI Notes Generator
  notesHistoryCollectionId: "notesHistory",
  // AI Roadmap Generator
  roadmapHistoryCollectionId: "roadmapHistory",
  // AI Tutor
  tutorHistoryCollectionId: "tutorHistory",
  // Co-Study Rooms (Workable Real-time multiplayer)
  studyRoomsCollectionId: "studyRooms",
  studyRoomMessagesCollectionId: "studyRoomMessages",
  studyRoomMembersCollectionId: "studyRoomMembers",
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
