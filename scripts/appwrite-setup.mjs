/**
 * Idempotently provision the Study Planner Appwrite database.
 *
 * Required environment variables:
 *   APPWRITE_ENDPOINT       (default: https://cloud.appwrite.io/v1)
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY        (server/API key; never expose this to Vite)
 *   APPWRITE_DATABASE_ID    (default: studyplan)
 *
 * Run with:
 *   pnpm appwrite:setup
 */

import "dotenv/config";
import {
  Client,
  Databases,
  Permission,
  Role,
} from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || "studyplan";

if (!projectId || !apiKey) {
  throw new Error(
    "Set APPWRITE_PROJECT_ID and APPWRITE_API_KEY before running pnpm appwrite:setup.",
  );
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);
const databases = new Databases(client);

const permissions = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const string = (key, size, required = false, defaultValue) => ({
  key,
  type: "string",
  size,
  required,
  defaultValue,
});
const integer = (key, required = false, defaultValue) => ({
  key,
  type: "integer",
  required,
  defaultValue,
});
const boolean = (key, required = false, defaultValue) => ({
  key,
  type: "boolean",
  required,
  defaultValue,
});
const datetime = (key, required = false) => ({
  key,
  type: "datetime",
  required,
});

const collections = [
  {
    id: "subjects",
    name: "Subjects",
    attributes: [
      string("userId", 255, true),
      string("name", 100, true),
      string("color", 20, true),
      string("createdAt", 64, true),
      integer("order", false, 0),
      boolean("archived", false, false),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_createdAt", ["createdAt"], ["desc"]],
    ],
  },
  {
    id: "topics",
    name: "Topics",
    attributes: [string("subjectId", 255, true), string("name", 200, true)],
    indexes: [["idx_subjectId", ["subjectId"], ["asc"]]],
  },
  {
    id: "tasks",
    name: "Tasks",
    attributes: [
      string("userId", 255, true),
      string("subjectId", 255, true),
      string("title", 500, true),
      string("dueDate", 64, true),
      string("reminderTime", 20),
      string("status", 20, true),
      string("createdAt", 64, true),
      string("priority", 20),
      string("tags", 2000),
      string("notes", 10000),
      boolean("archived", false, false),
      string("completedAt", 64),
      string("repeat", 20),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_dueDate", ["dueDate"], ["asc"]],
      ["idx_status", ["status"], ["asc"]],
      ["idx_createdAt", ["createdAt"], ["desc"]],
    ],
  },
  {
    id: "exams",
    name: "Exams",
    attributes: [
      string("userId", 255, true),
      string("subjectId", 255, true),
      string("examName", 500, true),
      string("examDate", 64, true),
      string("notes", 10000),
      string("location", 500),
      string("reminderTime", 20),
      boolean("archived", false, false),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_examDate", ["examDate"], ["asc"]],
    ],
  },
  {
    id: "progressLogs",
    name: "Progress Logs",
    attributes: [
      string("userId", 255, true),
      string("date", 64, true),
      integer("tasksCompleted", true),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_date", ["date"], ["desc"]],
    ],
  },
  {
    id: "pomodoroSessions",
    name: "Pomodoro Sessions",
    attributes: [
      string("userId", 255, true),
      string("subjectId", 255),
      string("startTime", 64, true),
      string("endTime", 64, true),
      integer("duration", true),
      string("createdAt", 64, true),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_createdAt", ["createdAt"], ["desc"]],
    ],
  },
  {
    id: "quizhistory",
    name: "Quiz History",
    attributes: [
      string("userId", 255, true),
      string("topic", 500, true),
      string("difficulty", 20, true),
      integer("questionCount", true),
      string("questionType", 20, true),
      string("quizContent", 100000, true),
      string("createdAt", 64, true),
      integer("attempts", false, 0),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_createdAt", ["createdAt"], ["desc"]],
      ["idx_topic", ["topic"], ["asc"]],
    ],
  },
  {
    id: "notesHistory",
    name: "Notes History",
    attributes: [
      string("userId", 255, true),
      string("topic", 500, true),
      string("subject", 255),
      string("noteType", 20, true),
      string("notesContent", 100000, true),
      string("createdAt", 64, true),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_createdAt", ["createdAt"], ["desc"]],
    ],
  },
  {
    id: "roadmapHistory",
    name: "Roadmap History",
    attributes: [
      string("userId", 255, true),
      string("goal", 500, true),
      string("subject", 255),
      string("duration", 100),
      string("level", 50),
      string("roadmapType", 20, true),
      string("roadmapContent", 100000, true),
      string("createdAt", 64, true),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_createdAt", ["createdAt"], ["desc"]],
    ],
  },
  {
    id: "tutorHistory",
    name: "Tutor History",
    attributes: [
      string("userId", 255, true),
      string("topic", 500, true),
      string("subject", 255),
      string("level", 50),
      string("explainType", 20, true),
      string("tutorContent", 100000, true),
      string("createdAt", 64, true),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_createdAt", ["createdAt"], ["desc"]],
    ],
  },
  {
    id: "userPlans",
    name: "User Plans",
    attributes: [
      string("userId", 255, true),
      string("plan", 20, true),
      string("status", 20, true),
      integer("aiCredits", true),
      integer("maxCredits", true),
      string("renewalDate", 64, true),
      string("billingCycle", 20, true),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_renewalDate", ["renewalDate"], ["asc"]],
    ],
  },
  {
    id: "usageLogs",
    name: "Usage Logs",
    attributes: [
      string("userId", 255, true),
      string("actionType", 255, true),
      integer("creditsUsed", true),
      string("timestamp", 64, true),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_timestamp", ["timestamp"], ["desc"]],
    ],
  },
  {
    id: "billingHistory",
    name: "Billing History",
    attributes: [
      string("invoiceId", 100, true),
      string("userId", 255, true),
      string("date", 100, true),
      string("amount", 100, true),
      string("planName", 100, true),
      string("cycle", 50, true),
    ],
    indexes: [
      ["idx_userId", ["userId"], ["asc"]],
      ["idx_date", ["date"], ["desc"]],
    ],
  },
  {
    id: "studyRooms",
    name: "Study Rooms",
    attributes: [
      string("name", 255, true),
      string("description", 1000),
      integer("membersCount", false, 0),
      integer("maxMembers", false, 10),
      string("timerMode", 20, false, "work"),
      boolean("isPrivate", false, false),
      string("creatorId", 255, true),
      string("createdAt", 64, true),
    ],
    indexes: [["idx_createdAt", ["createdAt"], ["desc"]]],
  },
  {
    id: "studyRoomMessages",
    name: "Study Room Messages",
    attributes: [
      string("roomId", 255, true),
      string("senderName", 255, true),
      string("senderId", 255, true),
      string("message", 2000, true),
      string("timestamp", 64, true),
      boolean("isSystem", false, false),
    ],
    indexes: [
      ["idx_roomId", ["roomId"], ["asc"]],
      ["idx_timestamp", ["timestamp"], ["asc"]],
    ],
  },
  {
    id: "studyRoomMembers",
    name: "Study Room Members",
    attributes: [
      string("roomId", 255, true),
      string("userId", 255, true),
      string("userName", 255, true),
      string("status", 500),
      boolean("isFocusing", false, true),
      string("lastActive", 64, true),
    ],
    indexes: [
      ["idx_roomId", ["roomId"], ["asc"]],
      ["idx_userId", ["userId"], ["asc"]],
    ],
  },
];

const isAlreadyExists = (error) => error?.code === 409;

async function ensureDatabase() {
  try {
    await databases.get(databaseId);
    console.log(`Database '${databaseId}' already exists.`);
  } catch (error) {
    if (error?.code !== 404) throw error;
    await databases.create(databaseId, "Study Planner");
    console.log(`Created database '${databaseId}'.`);
  }
}

async function ensureCollection(collection) {
  try {
    await databases.getCollection(databaseId, collection.id);
    console.log(`  Collection '${collection.id}' already exists.`);
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }
    await databases.createCollection(
      databaseId,
      collection.id,
      collection.name,
      permissions,
    );
    console.log(`  Created collection '${collection.id}'.`);
  }

  for (const attribute of collection.attributes) {
    try {
      if (attribute.type === "string") {
        await databases.createStringAttribute(
          databaseId,
          collection.id,
          attribute.key,
          attribute.size,
          attribute.required,
          attribute.defaultValue,
        );
      } else if (attribute.type === "integer") {
        await databases.createIntegerAttribute(
          databaseId,
          collection.id,
          attribute.key,
          attribute.required,
          undefined,
          undefined,
          attribute.defaultValue,
        );
      } else if (attribute.type === "boolean") {
        await databases.createBooleanAttribute(
          databaseId,
          collection.id,
          attribute.key,
          attribute.required,
          attribute.defaultValue,
        );
      } else {
        await databases.createDatetimeAttribute(
          databaseId,
          collection.id,
          attribute.key,
          attribute.required,
        );
      }
      console.log(`    Created attribute '${collection.id}.${attribute.key}'.`);
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
    }
  }

  for (const [key, attributes, orders] of collection.indexes) {
    try {
      await databases.createIndex(
        databaseId,
        collection.id,
        key,
        "key",
        attributes,
        orders,
      );
      console.log(`    Created index '${collection.id}.${key}'.`);
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
    }
  }
}

async function main() {
  console.log(`Provisioning Appwrite project '${projectId}' at ${endpoint}`);
  await ensureDatabase();
  for (const collection of collections) {
    await ensureCollection(collection);
  }
  console.log(`Ready: ${collections.length} collections in '${databaseId}'.`);
}

main().catch((error) => {
  console.error(`Appwrite setup failed: ${error.message}`);
  process.exitCode = 1;
});
