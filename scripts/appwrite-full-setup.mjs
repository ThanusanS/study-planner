/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Appwrite FULL Database Setup Script — Study Planner App
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Recreates the ENTIRE "studyplan" database and ALL 16 collections:
 *
 *    Core:
 *      1. subjects           2. topics
 *      3. tasks              4. exams
 *      5. progressLogs       6. pomodoroSessions
 *
 *    AI Features:
 *      7. quizhistory        8. notesHistory
 *      9. roadmapHistory    10. tutorHistory
 *
 *    Billing & Plans:
 *     11. userPlans          12. usageLogs
 *     13. billingHistory
 *
 *    Co-Study Rooms:
 *     14. studyRooms         15. studyRoomMessages
 *     16. studyRoomMembers
 *
 *  Usage:
 *    node scripts/appwrite-full-setup.mjs
 *
 *  Requirements:
 *    - APPWRITE_API_KEY in .env or environment variable
 *    - node-appwrite package installed
 * ═══════════════════════════════════════════════════════════════════════
 */

import { Client, Databases, Permission, Role } from "node-appwrite";
import readline from "readline";
import fs from "fs";
import path from "path";

// ─── Configuration (must match src/lib/appwrite.ts) ───
const ENDPOINT    = "https://sgp.cloud.appwrite.io/v1";
const PROJECT_ID  = "69d4644900361e0d0c92";
const DATABASE_ID = "studyplan";

// ─── Helper to ask for API key ───
function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (answer) => { rl.close(); resolve(answer); }));
}

// ─── Delay helper (Appwrite needs time for attribute propagation) ───
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── Main setup function ───
async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║   Appwrite FULL Database Setup — Study Planner App          ║");
  console.log("║   Creates database + all 16 collections + attributes        ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  // ─── Get API Key ───
  let apiKey = process.env.APPWRITE_API_KEY;
  if (!apiKey) {
    try {
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/^APPWRITE_API_KEY=(.*)$/m);
        if (match && match[1]) {
          apiKey = match[1].trim();
          console.log("ℹ  Loaded APPWRITE_API_KEY from .env file.");
        }
      }
    } catch (err) {
      console.warn("   ⚠️  Failed to check/read .env file:", err.message);
    }
  }

  if (!apiKey) {
    console.log("⚠  APPWRITE_API_KEY environment variable not found.");
    console.log("   You can find your API key in Appwrite Console → Settings → API Keys.\n");
    apiKey = await askQuestion("🔑 Paste your Appwrite API Key: ");
  }

  if (!apiKey || apiKey.trim().length < 10) {
    console.error("❌ Invalid API key. Aborting.");
    process.exit(1);
  }

  // ─── Initialize server SDK client ───
  const client = new Client();
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(apiKey.trim());
  const db = new Databases(client);

  // ─── Shared permissions: Any authenticated user ───
  const permissions = [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  // ════════════════════════════════════════════════════════════
  //  STEP 0: Create Database (if deleted)
  // ════════════════════════════════════════════════════════════
  try {
    console.log("🗄️  Creating database: studyplan ...");
    await db.create(DATABASE_ID, "Study Planner");
    console.log("   ✅ Database created.");
  } catch (e) {
    if (e.code === 409) {
      console.log("   ⏭  Database 'studyplan' already exists. Skipping.");
    } else {
      console.error("   ❌ Error creating database:", e.message);
      console.error("   (If the database truly exists, you can ignore this)");
    }
  }

  // ════════════════════════════════════════════════════════════
  //  HELPER: Create a collection + attributes + indexes
  // ════════════════════════════════════════════════════════════
  async function setupCollection(collectionId, collectionName, attributes, indexes = []) {
    console.log(`\n📦 Creating collection: ${collectionId} (${collectionName}) ...`);

    // Create collection
    try {
      await db.createCollection(DATABASE_ID, collectionId, collectionName, permissions);
      console.log("   ✅ Collection created.");
    } catch (e) {
      if (e.code === 409) {
        console.log(`   ⏭  Collection '${collectionId}' already exists. Skipping creation.`);
      } else {
        console.error(`   ❌ Error:`, e.message);
        return; // Skip attributes if collection can't be created
      }
    }

    // Create attributes
    for (const attr of attributes) {
      // Appwrite does not allow default values on required attributes
      const effectiveDefault = attr.required ? undefined : (attr.defaultVal ?? undefined);
      try {
        switch (attr.type) {
          case "string":
            await db.createStringAttribute(
              DATABASE_ID, collectionId, attr.key,
              attr.size || 255, attr.required || false,
              effectiveDefault
            );
            break;
          case "integer":
            await db.createIntegerAttribute(
              DATABASE_ID, collectionId, attr.key,
              attr.required || false,
              attr.min ?? undefined,
              attr.max ?? undefined,
              effectiveDefault
            );
            break;
          case "float":
            await db.createFloatAttribute(
              DATABASE_ID, collectionId, attr.key,
              attr.required || false,
              undefined, undefined,
              effectiveDefault
            );
            break;
          case "boolean":
            await db.createBooleanAttribute(
              DATABASE_ID, collectionId, attr.key,
              attr.required || false,
              effectiveDefault
            );
            break;
          case "enum":
            await db.createEnumAttribute(
              DATABASE_ID, collectionId, attr.key,
              attr.elements,
              attr.required || false,
              attr.defaultVal ?? undefined
            );
            break;
        }
        console.log(`   ✅ Attribute: ${attr.key} (${attr.type})`);
      } catch (e) {
        if (e.code === 409) {
          console.log(`   ⏭  Attribute '${attr.key}' already exists.`);
        } else {
          console.error(`   ❌ Attribute '${attr.key}':`, e.message);
        }
      }
    }

    // Wait for attributes to propagate before creating indexes
    if (indexes.length > 0) {
      console.log("   ⏳ Waiting 2s for attributes to propagate...");
      await delay(2000);
    }

    // Create indexes
    for (const idx of indexes) {
      try {
        await db.createIndex(
          DATABASE_ID, collectionId,
          idx.key, idx.type || "key",
          idx.attributes,
          idx.orders || idx.attributes.map(() => "asc")
        );
        console.log(`   ✅ Index: ${idx.key}`);
      } catch (e) {
        if (e.code === 409) {
          console.log(`   ⏭  Index '${idx.key}' already exists.`);
        } else {
          console.error(`   ❌ Index '${idx.key}':`, e.message);
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  //  1. SUBJECTS
  // ════════════════════════════════════════════════════════════
  await setupCollection("subjects", "Subjects", [
    { key: "userId",    type: "string",  size: 255, required: true },
    { key: "name",      type: "string",  size: 255, required: true },
    { key: "color",     type: "string",  size: 50,  required: true },
    { key: "createdAt", type: "string",  size: 64,  required: true },
    { key: "order",     type: "integer", required: false, defaultVal: 0 },
    { key: "archived",  type: "boolean", required: false, defaultVal: false },
  ], [
    { key: "idx_userId",    attributes: ["userId"] },
    { key: "idx_order",     attributes: ["order"],     orders: ["asc"] },
    { key: "idx_createdAt", attributes: ["createdAt"], orders: ["desc"] },
    { key: "idx_archived",  attributes: ["archived"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  2. TOPICS
  // ════════════════════════════════════════════════════════════
  await setupCollection("topics", "Topics", [
    { key: "subjectId", type: "string", size: 255, required: true },
    { key: "name",      type: "string", size: 255, required: true },
  ], [
    { key: "idx_subjectId", attributes: ["subjectId"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  3. TASKS
  // ════════════════════════════════════════════════════════════
  await setupCollection("tasks", "Tasks", [
    { key: "userId",      type: "string",  size: 255,  required: true },
    { key: "subjectId",   type: "string",  size: 255,  required: true },
    { key: "title",       type: "string",  size: 500,  required: true },
    { key: "dueDate",     type: "string",  size: 64,   required: true },
    { key: "reminderTime",type: "string",  size: 64,   required: false },
    { key: "status",      type: "string",  size: 20,   required: true, defaultVal: "pending" },
    { key: "createdAt",   type: "string",  size: 64,   required: true },
    { key: "priority",    type: "string",  size: 20,   required: false, defaultVal: "medium" },
    { key: "tags",        type: "string",  size: 1000, required: false },
    { key: "notes",       type: "string",  size: 5000, required: false },
    { key: "archived",    type: "boolean", required: false, defaultVal: false },
    { key: "completedAt", type: "string",  size: 64,   required: false },
    { key: "repeat",      type: "string",  size: 20,   required: false, defaultVal: "none" },
  ], [
    { key: "idx_userId",    attributes: ["userId"] },
    { key: "idx_dueDate",   attributes: ["dueDate"],   orders: ["desc"] },
    { key: "idx_createdAt", attributes: ["createdAt"], orders: ["desc"] },
    { key: "idx_status",    attributes: ["status"] },
    { key: "idx_archived",  attributes: ["archived"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  4. EXAMS
  // ════════════════════════════════════════════════════════════
  await setupCollection("exams", "Exams", [
    { key: "userId",       type: "string", size: 255,  required: true },
    { key: "subjectId",    type: "string", size: 255,  required: true },
    { key: "examName",     type: "string", size: 500,  required: true },
    { key: "examDate",     type: "string", size: 64,   required: true },
    { key: "notes",        type: "string", size: 5000, required: false },
    { key: "location",     type: "string", size: 500,  required: false },
    { key: "reminderTime", type: "string", size: 64,   required: false },
    { key: "archived",     type: "boolean",required: false, defaultVal: false },
  ], [
    { key: "idx_userId",   attributes: ["userId"] },
    { key: "idx_examDate", attributes: ["examDate"], orders: ["asc"] },
    { key: "idx_archived", attributes: ["archived"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  5. PROGRESS LOGS
  // ════════════════════════════════════════════════════════════
  await setupCollection("progressLogs", "Progress Logs", [
    { key: "userId",         type: "string",  size: 255, required: true },
    { key: "date",           type: "string",  size: 64,  required: true },
    { key: "tasksCompleted", type: "integer", required: true, defaultVal: 0 },
  ], [
    { key: "idx_userId", attributes: ["userId"] },
    { key: "idx_date",   attributes: ["date"], orders: ["desc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  6. POMODORO SESSIONS
  // ════════════════════════════════════════════════════════════
  await setupCollection("pomodoroSessions", "Pomodoro Sessions", [
    { key: "userId",    type: "string",  size: 255, required: true },
    { key: "subjectId", type: "string",  size: 255, required: false },
    { key: "startTime", type: "string",  size: 64,  required: true },
    { key: "endTime",   type: "string",  size: 64,  required: true },
    { key: "duration",  type: "integer", required: true },
    { key: "createdAt", type: "string",  size: 64,  required: true },
  ], [
    { key: "idx_userId",    attributes: ["userId"] },
    { key: "idx_createdAt", attributes: ["createdAt"], orders: ["desc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  7. QUIZ HISTORY
  // ════════════════════════════════════════════════════════════
  await setupCollection("quizhistory", "Quiz History", [
    { key: "userId",        type: "string",  size: 255,    required: true },
    { key: "topic",         type: "string",  size: 500,    required: true },
    { key: "difficulty",    type: "string",  size: 20,     required: true },
    { key: "questionCount", type: "integer", required: true },
    { key: "questionType",  type: "string",  size: 20,     required: true },
    { key: "quizContent",   type: "string",  size: 1000000, required: true },
    { key: "createdAt",     type: "string",  size: 64,     required: true },
    { key: "attempts",      type: "integer", required: false, defaultVal: 0 },
  ], [
    { key: "idx_userId",    attributes: ["userId"] },
    { key: "idx_createdAt", attributes: ["createdAt"], orders: ["desc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  8. NOTES HISTORY
  // ════════════════════════════════════════════════════════════
  await setupCollection("notesHistory", "Notes History", [
    { key: "userId",       type: "string", size: 255,     required: true },
    { key: "topic",        type: "string", size: 500,     required: true },
    { key: "subject",      type: "string", size: 255,     required: false },
    { key: "noteType",     type: "string", size: 20,      required: true },
    { key: "notesContent", type: "string", size: 1000000, required: true },
    { key: "createdAt",    type: "string", size: 64,      required: true },
  ], [
    { key: "idx_userId",    attributes: ["userId"] },
    { key: "idx_createdAt", attributes: ["createdAt"], orders: ["desc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  9. ROADMAP HISTORY
  // ════════════════════════════════════════════════════════════
  await setupCollection("roadmapHistory", "Roadmap History", [
    { key: "userId",         type: "string", size: 255,     required: true },
    { key: "goal",           type: "string", size: 500,     required: true },
    { key: "subject",        type: "string", size: 255,     required: false },
    { key: "duration",       type: "string", size: 100,     required: false },
    { key: "level",          type: "string", size: 50,      required: false },
    { key: "roadmapType",    type: "string", size: 20,      required: true },
    { key: "roadmapContent", type: "string", size: 1000000, required: true },
    { key: "createdAt",      type: "string", size: 64,      required: true },
  ], [
    { key: "idx_userId",    attributes: ["userId"] },
    { key: "idx_createdAt", attributes: ["createdAt"], orders: ["desc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  10. TUTOR HISTORY
  // ════════════════════════════════════════════════════════════
  await setupCollection("tutorHistory", "Tutor History", [
    { key: "userId",       type: "string", size: 255,     required: true },
    { key: "topic",        type: "string", size: 500,     required: true },
    { key: "subject",      type: "string", size: 255,     required: false },
    { key: "level",        type: "string", size: 50,      required: false },
    { key: "explainType",  type: "string", size: 20,      required: true },
    { key: "tutorContent", type: "string", size: 1000000, required: true },
    { key: "createdAt",    type: "string", size: 64,      required: true },
  ], [
    { key: "idx_userId",    attributes: ["userId"] },
    { key: "idx_createdAt", attributes: ["createdAt"], orders: ["desc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  11. USER PLANS (Billing)
  // ════════════════════════════════════════════════════════════
  await setupCollection("userPlans", "User Plans", [
    { key: "userId",       type: "string",  size: 255, required: true },
    { key: "plan",         type: "string",  size: 20,  required: true, defaultVal: "free" },
    { key: "status",       type: "string",  size: 20,  required: true, defaultVal: "active" },
    { key: "aiCredits",    type: "integer", required: true, defaultVal: 10 },
    { key: "maxCredits",   type: "integer", required: true, defaultVal: 10 },
    { key: "renewalDate",  type: "string",  size: 64,  required: true },
    { key: "billingCycle", type: "string",  size: 20,  required: true, defaultVal: "monthly" },
  ], [
    { key: "idx_userId", attributes: ["userId"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  12. USAGE LOGS (Billing)
  // ════════════════════════════════════════════════════════════
  await setupCollection("usageLogs", "Usage Logs", [
    { key: "userId",      type: "string",  size: 255, required: true },
    { key: "actionType",  type: "string",  size: 255, required: true },
    { key: "creditsUsed", type: "integer", required: true, defaultVal: 0 },
    { key: "timestamp",   type: "string",  size: 64,  required: true },
  ], [
    { key: "idx_userId",    attributes: ["userId"] },
    { key: "idx_timestamp", attributes: ["timestamp"], orders: ["desc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  13. BILLING HISTORY
  // ════════════════════════════════════════════════════════════
  await setupCollection("billingHistory", "Billing History", [
    { key: "invoiceId", type: "string", size: 255, required: true },
    { key: "userId",    type: "string", size: 255, required: true },
    { key: "date",      type: "string", size: 64,  required: true },
    { key: "amount",    type: "string", size: 50,  required: true },
    { key: "planName",  type: "string", size: 100, required: true },
    { key: "cycle",     type: "string", size: 20,  required: true },
  ], [
    { key: "idx_userId", attributes: ["userId"] },
    { key: "idx_date",   attributes: ["date"], orders: ["desc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  14. STUDY ROOMS (Co-Study)
  // ════════════════════════════════════════════════════════════
  await setupCollection("studyRooms", "Study Rooms", [
    { key: "name",         type: "string",  size: 255,  required: true },
    { key: "description",  type: "string",  size: 1000, required: false },
    { key: "membersCount", type: "integer", required: false, defaultVal: 0 },
    { key: "maxMembers",   type: "integer", required: false, defaultVal: 10 },
    { key: "timerMode",    type: "string",  size: 20,   required: false, defaultVal: "work" },
    { key: "isPrivate",    type: "boolean", required: false, defaultVal: false },
    { key: "creatorId",    type: "string",  size: 255,  required: true },
    { key: "createdAt",    type: "string",  size: 64,   required: true },
  ], [
    { key: "idx_createdAt", attributes: ["createdAt"], orders: ["desc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  15. STUDY ROOM MESSAGES (Co-Study)
  // ════════════════════════════════════════════════════════════
  await setupCollection("studyRoomMessages", "Study Room Messages", [
    { key: "roomId",     type: "string",  size: 255,  required: true },
    { key: "senderName", type: "string",  size: 255,  required: true },
    { key: "senderId",   type: "string",  size: 255,  required: true },
    { key: "message",    type: "string",  size: 2000, required: true },
    { key: "timestamp",  type: "string",  size: 64,   required: true },
    { key: "isSystem",   type: "boolean", required: false, defaultVal: false },
  ], [
    { key: "idx_roomId",    attributes: ["roomId"] },
    { key: "idx_timestamp", attributes: ["timestamp"], orders: ["asc"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  16. STUDY ROOM MEMBERS (Co-Study)
  // ════════════════════════════════════════════════════════════
  await setupCollection("studyRoomMembers", "Study Room Members", [
    { key: "roomId",     type: "string",  size: 255, required: true },
    { key: "userId",     type: "string",  size: 255, required: true },
    { key: "userName",   type: "string",  size: 255, required: true },
    { key: "status",     type: "string",  size: 500, required: false },
    { key: "isFocusing", type: "boolean", required: false, defaultVal: true },
    { key: "lastActive", type: "string",  size: 64,  required: true },
  ], [
    { key: "idx_roomId", attributes: ["roomId"] },
    { key: "idx_userId", attributes: ["userId"] },
  ]);

  // ════════════════════════════════════════════════════════════
  //  DONE!
  // ════════════════════════════════════════════════════════════
  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║   ✅ ALL 16 COLLECTIONS CREATED SUCCESSFULLY!               ║");
  console.log("║                                                             ║");
  console.log("║   Database: studyplan                                       ║");
  console.log("║   Collections:                                              ║");
  console.log("║     Core:     subjects, topics, tasks, exams,               ║");
  console.log("║               progressLogs, pomodoroSessions                ║");
  console.log("║     AI:       quizhistory, notesHistory,                    ║");
  console.log("║               roadmapHistory, tutorHistory                  ║");
  console.log("║     Billing:  userPlans, usageLogs, billingHistory          ║");
  console.log("║     Co-Study: studyRooms, studyRoomMessages,               ║");
  console.log("║               studyRoomMembers                              ║");
  console.log("║                                                             ║");
  console.log("║   You can now run: npm run dev                              ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("\n❌ Setup script failed:", err.message);
  process.exit(1);
});
