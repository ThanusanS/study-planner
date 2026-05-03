import { ID, Query } from 'appwrite';
import { databases, appwriteConfig } from '../lib/appwrite';

const { databaseId } = appwriteConfig;

// Types
export interface Subject {
  $id?: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
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
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface Exam {
  $id?: string;
  userId: string;
  subjectId: string;
  examName: string;
  examDate: string;
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
  async createSubject(subject: Omit<Subject, '$id'>): Promise<Subject> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.subjectsCollectionId,
      ID.unique(),
      subject
    );
  }

  async getSubjects(userId: string): Promise<Subject[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.subjectsCollectionId,
      [Query.equal('userId', userId), Query.orderDesc('createdAt')]
    );
    return response.documents as Subject[];
  }

  async updateSubject(subjectId: string, data: Partial<Subject>): Promise<Subject> {
    return await databases.updateDocument(
      databaseId,
      appwriteConfig.subjectsCollectionId,
      subjectId,
      data
    );
  }

  async deleteSubject(subjectId: string): Promise<void> {
    await databases.deleteDocument(
      databaseId,
      appwriteConfig.subjectsCollectionId,
      subjectId
    );
  }

  // ========== TOPICS ==========
  async createTopic(topic: Omit<Topic, '$id'>): Promise<Topic> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.topicsCollectionId,
      ID.unique(),
      topic
    );
  }

  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.topicsCollectionId,
      [Query.equal('subjectId', subjectId)]
    );
    return response.documents as Topic[];
  }

  async deleteTopic(topicId: string): Promise<void> {
    await databases.deleteDocument(
      databaseId,
      appwriteConfig.topicsCollectionId,
      topicId
    );
  }

  // ========== TASKS ==========
  async createTask(task: Omit<Task, '$id'>): Promise<Task> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.tasksCollectionId,
      ID.unique(),
      task
    );
  }

  async getTasks(userId: string, limit = 100): Promise<Task[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.tasksCollectionId,
      [
        Query.equal('userId', userId),
        Query.orderDesc('dueDate'),
        Query.limit(limit)
      ]
    );
    return response.documents as Task[];
  }

  async getTasksByDate(userId: string, date: string): Promise<Task[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.tasksCollectionId,
      [
        Query.equal('userId', userId),
        Query.equal('dueDate', date),
        Query.orderDesc('createdAt')
      ]
    );
    return response.documents as Task[];
  }

  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    return await databases.updateDocument(
      databaseId,
      appwriteConfig.tasksCollectionId,
      taskId,
      data
    );
  }

  async deleteTask(taskId: string): Promise<void> {
    await databases.deleteDocument(
      databaseId,
      appwriteConfig.tasksCollectionId,
      taskId
    );
  }

  // ========== EXAMS ==========
  async createExam(exam: Omit<Exam, '$id'>): Promise<Exam> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.examsCollectionId,
      ID.unique(),
      exam
    );
  }

  async getExams(userId: string): Promise<Exam[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.examsCollectionId,
      [
        Query.equal('userId', userId),
        Query.orderAsc('examDate')
      ]
    );
    return response.documents as Exam[];
  }

  async deleteExam(examId: string): Promise<void> {
    await databases.deleteDocument(
      databaseId,
      appwriteConfig.examsCollectionId,
      examId
    );
  }

  // ========== PROGRESS LOGS ==========
  async createProgressLog(log: Omit<ProgressLog, '$id'>): Promise<ProgressLog> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.progressLogsCollectionId,
      ID.unique(),
      log
    );
  }

  async getProgressLogs(userId: string, limit = 30): Promise<ProgressLog[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.progressLogsCollectionId,
      [
        Query.equal('userId', userId),
        Query.orderDesc('date'),
        Query.limit(limit)
      ]
    );
    return response.documents as ProgressLog[];
  }

  // ========== POMODORO SESSIONS ==========
  async createPomodoroSession(session: Omit<PomodoroSession, '$id'>): Promise<PomodoroSession> {
    return await databases.createDocument(
      databaseId,
      appwriteConfig.pomodoroSessionsCollectionId,
      ID.unique(),
      session
    );
  }

  async getPomodoroSessions(userId: string, limit = 100): Promise<PomodoroSession[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.pomodoroSessionsCollectionId,
      [
        Query.equal('userId', userId),
        Query.orderDesc('createdAt'),
        Query.limit(limit)
      ]
    );
    return response.documents as PomodoroSession[];
  }

  async getPomodoroSessionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<PomodoroSession[]> {
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.pomodoroSessionsCollectionId,
      [
        Query.equal('userId', userId),
        Query.greaterThanEqual('createdAt', startDate),
        Query.lessThanEqual('createdAt', endDate),
        Query.orderDesc('createdAt')
      ]
    );
    return response.documents as PomodoroSession[];
  }
}

export default new DatabaseService();
