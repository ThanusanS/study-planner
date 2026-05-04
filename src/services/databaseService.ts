import { ID, Query } from "appwrite";
import { databases, appwriteConfig } from "../lib/appwrite";

const { databaseId } = appwriteConfig;

// Types
export interface Subject {
  $id?: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  order?: number;
  archived?: boolean;
}

export interface Topic {
  $id?: string;
  subjectId: string;
  name: string;
}

export interface Task {
  $id?: string;
  userId: string;
  subjectId: string;
  title: string;
  dueDate: string;
  reminderTime?: string;
  status: "pending" | "completed";
  createdAt: string;
  priority?: "low" | "medium" | "high";
  tags?: string;
  notes?: string;
  archived?: boolean;
  completedAt?: string;
  repeat?: "none" | "daily" | "weekly" | "monthly";
}

export interface Exam {
  $id?: string;
  userId: string;
  subjectId: string;
  examName: string;
  examDate: string;
  notes?: string;
  location?: string;
  reminderTime?: string;
  archived?: boolean;
}

export interface ProgressLog {
  $id?: string;
  userId: string;
  date: string;
  tasksCompleted: number;
}

export interface PomodoroSession {
  $id?: string;
  userId: string;
  subjectId?: string;
  startTime: string;
  endTime: string;
  duration: number;
  createdAt: string;
}

class DatabaseService {
  // ========== SUBJECTS ==========
  async createSubject(subject: Omit<Subject, "$id">): Promise<Subject> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.subjectsCollectionId,
      ID.unique(),
      subject,
    );
  }

  async getSubjects(
    userId: string,
    options?: { includeArchived?: boolean },
  ): Promise<Subject[]> {
    const queries = [
      Query.equal("userId", userId),
      Query.orderAsc("order"),
      Query.orderDesc("createdAt"),
    ];

    if (!options?.includeArchived) {
      queries.push(Query.equal("archived", false));
    }

    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.subjectsCollectionId,
      queries,
    );
    return response.documents as Subject[];
  }

  async updateSubject(
    subjectId: string,
    data: Partial<Subject>,
  ): Promise<Subject> {
    return await databases.updateDocument(
      databaseId,
      appwriteConfig.subjectsCollectionId,
      subjectId,
      data,
    );
  }

  async deleteSubject(subjectId: string): Promise<void> {
    await databases.deleteDocument(
      databaseId,
      appwriteConfig.subjectsCollectionId,
      subjectId,
    );
  }

  // ========== TOPICS ==========
  async createTopic(topic: Omit<Topic, "$id">): Promise<Topic> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.topicsCollectionId,
      ID.unique(),
      topic,
    );
  }

  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.topicsCollectionId,
      [Query.equal("subjectId", subjectId)],
    );
    return response.documents as Topic[];
  }

  async deleteTopic(topicId: string): Promise<void> {
    await databases.deleteDocument(
      databaseId,
      appwriteConfig.topicsCollectionId,
      topicId,
    );
  }

  async updateTopic(topicId: string, data: Partial<Topic>): Promise<Topic> {
    return await databases.updateDocument(
      databaseId,
      appwriteConfig.topicsCollectionId,
      topicId,
      data,
    );
  }

  // ========== TASKS ==========
  async createTask(task: Omit<Task, "$id">): Promise<Task> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.tasksCollectionId,
      ID.unique(),
      task,
    );
  }

  async getTasks(
    userId: string,
    limit = 100,
    options?: { includeArchived?: boolean; sort?: "dueDate" | "createdAt" },
  ): Promise<Task[]> {
    const sortField = options?.sort === "createdAt" ? "createdAt" : "dueDate";
    const queries = [
      Query.equal("userId", userId),
      Query.orderDesc(sortField),
      Query.limit(limit),
    ];

    if (!options?.includeArchived) {
      queries.push(Query.equal("archived", false));
    }

    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.tasksCollectionId,
      queries,
    );
    return response.documents as Task[];
  }

  async getTasksByDate(userId: string, date: string): Promise<Task[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.tasksCollectionId,
      [
        Query.equal("userId", userId),
        Query.equal("dueDate", date),
        Query.orderDesc("createdAt"),
      ],
    );
    return response.documents as Task[];
  }

  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    return await databases.updateDocument(
      databaseId,
      appwriteConfig.tasksCollectionId,
      taskId,
      data,
    );
  }

  async deleteTask(taskId: string): Promise<void> {
    await databases.deleteDocument(
      databaseId,
      appwriteConfig.tasksCollectionId,
      taskId,
    );
  }

  // ========== EXAMS ==========
  async createExam(exam: Omit<Exam, "$id">): Promise<Exam> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.examsCollectionId,
      ID.unique(),
      exam,
    );
  }

  async getExams(
    userId: string,
    options?: { includeArchived?: boolean; sort?: "examDate" | "createdAt" },
  ): Promise<Exam[]> {
    const sortField = options?.sort === "createdAt" ? "createdAt" : "examDate";
    const queries = [Query.equal("userId", userId), Query.orderAsc(sortField)];

    if (!options?.includeArchived) {
      queries.push(Query.equal("archived", false));
    }

    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.examsCollectionId,
      queries,
    );
    return response.documents as Exam[];
  }

  async updateExam(examId: string, data: Partial<Exam>): Promise<Exam> {
    return await databases.updateDocument(
      databaseId,
      appwriteConfig.examsCollectionId,
      examId,
      data,
    );
  }

  async deleteExam(examId: string): Promise<void> {
    await databases.deleteDocument(
      databaseId,
      appwriteConfig.examsCollectionId,
      examId,
    );
  }

  // ========== PROGRESS LOGS ==========
  async createProgressLog(log: Omit<ProgressLog, "$id">): Promise<ProgressLog> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.progressLogsCollectionId,
      ID.unique(),
      log,
    );
  }

  async getProgressLogs(userId: string, limit = 30): Promise<ProgressLog[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.progressLogsCollectionId,
      [
        Query.equal("userId", userId),
        Query.orderDesc("date"),
        Query.limit(limit),
      ],
    );
    return response.documents as ProgressLog[];
  }

  // ========== POMODORO SESSIONS ==========
  async createPomodoroSession(
    session: Omit<PomodoroSession, "$id">,
  ): Promise<PomodoroSession> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.pomodoroSessionsCollectionId,
      ID.unique(),
      session,
    );
  }

  async getPomodoroSessions(
    userId: string,
    limit = 100,
  ): Promise<PomodoroSession[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.pomodoroSessionsCollectionId,
      [
        Query.equal("userId", userId),
        Query.orderDesc("createdAt"),
        Query.limit(limit),
      ],
    );
    return response.documents as PomodoroSession[];
  }

  async updatePomodoroSession(
    sessionId: string,
    data: Partial<PomodoroSession>,
  ): Promise<PomodoroSession> {
    return await databases.updateDocument(
      databaseId,
      appwriteConfig.pomodoroSessionsCollectionId,
      sessionId,
      data,
    );
  }

  async deletePomodoroSession(sessionId: string): Promise<void> {
    await databases.deleteDocument(
      databaseId,
      appwriteConfig.pomodoroSessionsCollectionId,
      sessionId,
    );
  }

  async getPomodoroSessionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<PomodoroSession[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.pomodoroSessionsCollectionId,
      [
        Query.equal("userId", userId),
        Query.greaterThanEqual("createdAt", startDate),
        Query.lessThanEqual("createdAt", endDate),
        Query.orderDesc("createdAt"),
      ],
    );
    return response.documents as PomodoroSession[];
  }
}

export default new DatabaseService();
