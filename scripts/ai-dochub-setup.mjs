/**
 * Appwrite Setup Script - AI Doc Hub & AI Features Collections
 * 
 * This script creates the four required Appwrite database collections
 * for the AI Doc Hub features:
 *   1. notesHistory   - Academic Summaries & Flashcard Decks
 *   2. roadmapHistory - Progressive Learning Roadmaps
 *   3. quizhistory    - Exam-style Practice Quizzes
 *   4. tutorHistory   - AI Socratic Tutor Logs
 *
 * Usage:
 *   node scripts/ai-dochub-setup.mjs
 */

import { Client, Databases, Permission, Role } from "node-appwrite";
import readline from "readline";
import fs from "fs";
import path from "path";

// ─── Configuration (must match src/lib/appwrite.ts) ───
const ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const PROJECT_ID = "69d4644900361e0d0c92";
const DATABASE_ID = "studyplan";

const COLLECTIONS = {
  notesHistory: "notesHistory",
  roadmapHistory: "roadmapHistory",
  quizhistory: "quizhistory",
  tutorHistory: "tutorHistory",
};

// ─── Helper to ask for API key ───
function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (answer) => { rl.close(); resolve(answer); }));
}

// ─── Main setup function ───
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║     AI Doc Hub & AI Features - Collection Setup Script   ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // Get API Key
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

  // Initialize server SDK client
  const client = new Client();
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(apiKey.trim());
  const db = new Databases(client);

  // Shared permissions: Any authenticated user can read/create/update/delete
  const permissions = [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  // ════════════════════════════════════════════════════════
  // 1. notesHistory (Academic Summaries & Flashcards)
  // ════════════════════════════════════════════════════════
  try {
    console.log("📦 Creating collection: notesHistory ...");
    await db.createCollection(DATABASE_ID, COLLECTIONS.notesHistory, "Notes History", permissions);
    console.log("   ✅ Collection created.");
  } catch (e) {
    if (e.code === 409) {
      console.log("   ⏭  Collection 'notesHistory' already exists. Skipping creation.");
    } else {
      console.error("   ❌ Error:", e.message);
    }
  }

  const notesAttrs = [
    { key: "userId",       type: "string",  size: 255, required: true  },
    { key: "topic",        type: "string",  size: 500, required: true  },
    { key: "subject",      type: "string",  size: 255, required: false },
    { key: "noteType",     type: "enum",    elements: ["short", "full"], required: true },
    { key: "notesContent", type: "string",  size: 100000, required: true  },
    { key: "createdAt",    type: "datetime", required: true },
  ];

  for (const attr of notesAttrs) {
    try {
      if (attr.type === "string") {
        await db.createStringAttribute(DATABASE_ID, COLLECTIONS.notesHistory, attr.key, attr.size, attr.required);
      } else if (attr.type === "enum") {
        await db.createEnumAttribute(DATABASE_ID, COLLECTIONS.notesHistory, attr.key, attr.elements, attr.required);
      } else if (attr.type === "datetime") {
        await db.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.notesHistory, attr.key, attr.required);
      }
      console.log(`   ✅ Attribute: ${attr.key}`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`   ⏭  Attribute '${attr.key}' already exists.`);
      } else {
        console.error(`   ❌ Attribute '${attr.key}':`, e.message);
      }
    }
  }

  // Create indexes for notesHistory
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.notesHistory, "idx_userId", "key", ["userId"]);
    console.log("   ✅ Index: idx_userId");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_userId already exists.");
    else console.error("   ❌ Index:", e.message);
  }
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.notesHistory, "idx_createdAt", "key", ["createdAt"], ["desc"]);
    console.log("   ✅ Index: idx_createdAt");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_createdAt already exists.");
    else console.error("   ❌ Index:", e.message);
  }

  // ════════════════════════════════════════════════════════
  // 2. roadmapHistory (Learning Roadmaps)
  // ════════════════════════════════════════════════════════
  try {
    console.log("\n📦 Creating collection: roadmapHistory ...");
    await db.createCollection(DATABASE_ID, COLLECTIONS.roadmapHistory, "Roadmap History", permissions);
    console.log("   ✅ Collection created.");
  } catch (e) {
    if (e.code === 409) {
      console.log("   ⏭  Collection 'roadmapHistory' already exists. Skipping creation.");
    } else {
      console.error("   ❌ Error:", e.message);
    }
  }

  const roadmapAttrs = [
    { key: "userId",         type: "string",  size: 255, required: true  },
    { key: "goal",           type: "string",  size: 500, required: true  },
    { key: "subject",        type: "string",  size: 255, required: false },
    { key: "duration",       type: "string",  size: 255, required: false },
    { key: "level",          type: "string",  size: 255, required: false },
    { key: "roadmapType",    type: "enum",    elements: ["quick", "detailed"], required: true },
    { key: "roadmapContent", type: "string",  size: 100000, required: true  },
    { key: "createdAt",      type: "datetime", required: true },
  ];

  for (const attr of roadmapAttrs) {
    try {
      if (attr.type === "string") {
        await db.createStringAttribute(DATABASE_ID, COLLECTIONS.roadmapHistory, attr.key, attr.size, attr.required);
      } else if (attr.type === "enum") {
        await db.createEnumAttribute(DATABASE_ID, COLLECTIONS.roadmapHistory, attr.key, attr.elements, attr.required);
      } else if (attr.type === "datetime") {
        await db.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.roadmapHistory, attr.key, attr.required);
      }
      console.log(`   ✅ Attribute: ${attr.key}`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`   ⏭  Attribute '${attr.key}' already exists.`);
      } else {
        console.error(`   ❌ Attribute '${attr.key}':`, e.message);
      }
    }
  }

  // Create indexes for roadmapHistory
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.roadmapHistory, "idx_userId", "key", ["userId"]);
    console.log("   ✅ Index: idx_userId");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_userId already exists.");
    else console.error("   ❌ Index:", e.message);
  }
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.roadmapHistory, "idx_createdAt", "key", ["createdAt"], ["desc"]);
    console.log("   ✅ Index: idx_createdAt");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_createdAt already exists.");
    else console.error("   ❌ Index:", e.message);
  }

  // ════════════════════════════════════════════════════════
  // 3. quizhistory (Practice Quizzes)
  // ════════════════════════════════════════════════════════
  try {
    console.log("\n📦 Creating collection: quizhistory ...");
    await db.createCollection(DATABASE_ID, COLLECTIONS.quizhistory, "Quiz History", permissions);
    console.log("   ✅ Collection created.");
  } catch (e) {
    if (e.code === 409) {
      console.log("   ⏭  Collection 'quizhistory' already exists. Skipping creation.");
    } else {
      console.error("   ❌ Error:", e.message);
    }
  }

  const quizAttrs = [
    { key: "userId",        type: "string",  size: 255, required: true  },
    { key: "topic",         type: "string",  size: 500, required: true  },
    { key: "difficulty",    type: "enum",    elements: ["easy", "medium", "hard"], required: true },
    { key: "questionCount", type: "integer", required: true },
    { key: "questionType",  type: "enum",    elements: ["mcq", "short", "mixed"], required: true },
    { key: "quizContent",   type: "string",  size: 100000, required: true  },
    { key: "createdAt",     type: "datetime", required: true },
    { key: "attempts",      type: "integer", required: false, defaultVal: 0 },
  ];

  for (const attr of quizAttrs) {
    try {
      if (attr.type === "string") {
        await db.createStringAttribute(DATABASE_ID, COLLECTIONS.quizhistory, attr.key, attr.size, attr.required);
      } else if (attr.type === "enum") {
        await db.createEnumAttribute(DATABASE_ID, COLLECTIONS.quizhistory, attr.key, attr.elements, attr.required);
      } else if (attr.type === "integer") {
        await db.createIntegerAttribute(DATABASE_ID, COLLECTIONS.quizhistory, attr.key, attr.required, undefined, undefined, attr.defaultVal);
      } else if (attr.type === "datetime") {
        await db.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.quizhistory, attr.key, attr.required);
      }
      console.log(`   ✅ Attribute: ${attr.key}`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`   ⏭  Attribute '${attr.key}' already exists.`);
      } else {
        console.error(`   ❌ Attribute '${attr.key}':`, e.message);
      }
    }
  }

  // Create indexes for quizhistory
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.quizhistory, "idx_userId", "key", ["userId"]);
    console.log("   ✅ Index: idx_userId");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_userId already exists.");
    else console.error("   ❌ Index:", e.message);
  }
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.quizhistory, "idx_createdAt", "key", ["createdAt"], ["desc"]);
    console.log("   ✅ Index: idx_createdAt");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_createdAt already exists.");
    else console.error("   ❌ Index:", e.message);
  }

  // ════════════════════════════════════════════════════════
  // 4. tutorHistory (Socratic Tutor Logs)
  // ════════════════════════════════════════════════════════
  try {
    console.log("\n📦 Creating collection: tutorHistory ...");
    await db.createCollection(DATABASE_ID, COLLECTIONS.tutorHistory, "Tutor History", permissions);
    console.log("   ✅ Collection created.");
  } catch (e) {
    if (e.code === 409) {
      console.log("   ⏭  Collection 'tutorHistory' already exists. Skipping creation.");
    } else {
      console.error("   ❌ Error:", e.message);
    }
  }

  const tutorAttrs = [
    { key: "userId",       type: "string",  size: 255, required: true  },
    { key: "topic",        type: "string",  size: 500, required: true  },
    { key: "subject",      type: "string",  size: 255, required: false },
    { key: "level",        type: "string",  size: 255, required: false },
    { key: "explainType",  type: "enum",    elements: ["simple", "deep", "doubt"], required: true },
    { key: "tutorContent", type: "string",  size: 100000, required: true  },
    { key: "createdAt",    type: "datetime", required: true },
  ];

  for (const attr of tutorAttrs) {
    try {
      if (attr.type === "string") {
        await db.createStringAttribute(DATABASE_ID, COLLECTIONS.tutorHistory, attr.key, attr.size, attr.required);
      } else if (attr.type === "enum") {
        await db.createEnumAttribute(DATABASE_ID, COLLECTIONS.tutorHistory, attr.key, attr.elements, attr.required);
      } else if (attr.type === "datetime") {
        await db.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.tutorHistory, attr.key, attr.required);
      }
      console.log(`   ✅ Attribute: ${attr.key}`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`   ⏭  Attribute '${attr.key}' already exists.`);
      } else {
        console.error(`   ❌ Attribute '${attr.key}':`, e.message);
      }
    }
  }

  // Create indexes for tutorHistory
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.tutorHistory, "idx_userId", "key", ["userId"]);
    console.log("   ✅ Index: idx_userId");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_userId already exists.");
    else console.error("   ❌ Index:", e.message);
  }
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.tutorHistory, "idx_createdAt", "key", ["createdAt"], ["desc"]);
    console.log("   ✅ Index: idx_createdAt");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_createdAt already exists.");
    else console.error("   ❌ Index:", e.message);
  }

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   ✅ All AI Doc Hub & AI collections are ready!          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("\n❌ Setup script failed:", err.message);
  process.exit(1);
});
