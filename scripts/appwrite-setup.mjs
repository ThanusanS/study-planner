/**
 * Appwrite Setup Script - Co-Study Rooms Collections
 * 
 * This script creates the three required Appwrite database collections
 * for the Co-Study Focus Rooms feature:
 *   1. studyRooms       - Active study lobbies
 *   2. studyRoomMessages - Chat message logs
 *   3. studyRoomMembers  - Active participant presence records
 *
 * Usage:
 *   node scripts/appwrite-setup.mjs
 *
 * Requirements:
 *   - Set APPWRITE_API_KEY environment variable, OR the script will prompt you.
 *   - Your Appwrite project must already have a database named "studyplan".
 */

import { Client, Databases, Permission, Role } from "node-appwrite";
import readline from "readline";
import fs from "fs";
import path from "path";

// ─── Configuration (must match src/lib/appwrite.ts) ───
const ENDPOINT   = "https://sgp.cloud.appwrite.io/v1";
const PROJECT_ID = "69d4644900361e0d0c92";
const DATABASE_ID = "studyplan";

const COLLECTIONS = {
  studyRooms: "studyRooms",
  studyRoomMessages: "studyRoomMessages",
  studyRoomMembers: "studyRoomMembers",
};

// ─── Helper to ask for API key ───
function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (answer) => { rl.close(); resolve(answer); }));
}

// ─── Main setup function ───
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   Appwrite Co-Study Rooms - Collection Setup Script     ║");
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
  // 1. studyRooms
  // ════════════════════════════════════════════════════════
  try {
    console.log("📦 Creating collection: studyRooms ...");
    await db.createCollection(DATABASE_ID, COLLECTIONS.studyRooms, "Study Rooms", permissions);
    console.log("   ✅ Collection created.");
  } catch (e) {
    if (e.code === 409) {
      console.log("   ⏭  Collection 'studyRooms' already exists. Skipping creation.");
    } else {
      console.error("   ❌ Error:", e.message);
    }
  }

  const roomAttrs = [
    { key: "name",         type: "string",  size: 255, required: true  },
    { key: "description",  type: "string",  size: 1000, required: false },
    { key: "membersCount", type: "integer", required: false, defaultVal: 0 },
    { key: "maxMembers",   type: "integer", required: false, defaultVal: 10 },
    { key: "timerMode",    type: "string",  size: 20,  required: false, defaultVal: "work" },
    { key: "isPrivate",    type: "boolean", required: false, defaultVal: false },
    { key: "creatorId",    type: "string",  size: 255, required: true  },
    { key: "createdAt",    type: "string",  size: 64,  required: true  },
  ];

  for (const attr of roomAttrs) {
    try {
      if (attr.type === "string") {
        await db.createStringAttribute(DATABASE_ID, COLLECTIONS.studyRooms, attr.key, attr.size, attr.required, attr.defaultVal || undefined);
      } else if (attr.type === "integer") {
        await db.createIntegerAttribute(DATABASE_ID, COLLECTIONS.studyRooms, attr.key, attr.required, undefined, undefined, attr.defaultVal);
      } else if (attr.type === "boolean") {
        await db.createBooleanAttribute(DATABASE_ID, COLLECTIONS.studyRooms, attr.key, attr.required, attr.defaultVal);
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

  // Create indexes for studyRooms
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.studyRooms, "idx_createdAt", "key", ["createdAt"], ["desc"]);
    console.log("   ✅ Index: idx_createdAt");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_createdAt already exists.");
    else console.error("   ❌ Index:", e.message);
  }

  // ════════════════════════════════════════════════════════
  // 2. studyRoomMessages
  // ════════════════════════════════════════════════════════
  try {
    console.log("\n📦 Creating collection: studyRoomMessages ...");
    await db.createCollection(DATABASE_ID, COLLECTIONS.studyRoomMessages, "Study Room Messages", permissions);
    console.log("   ✅ Collection created.");
  } catch (e) {
    if (e.code === 409) {
      console.log("   ⏭  Collection 'studyRoomMessages' already exists. Skipping creation.");
    } else {
      console.error("   ❌ Error:", e.message);
    }
  }

  const msgAttrs = [
    { key: "roomId",     type: "string",  size: 255,  required: true  },
    { key: "senderName", type: "string",  size: 255,  required: true  },
    { key: "senderId",   type: "string",  size: 255,  required: true  },
    { key: "message",    type: "string",  size: 2000, required: true  },
    { key: "timestamp",  type: "string",  size: 64,   required: true  },
    { key: "isSystem",   type: "boolean", required: false, defaultVal: false },
  ];

  for (const attr of msgAttrs) {
    try {
      if (attr.type === "string") {
        await db.createStringAttribute(DATABASE_ID, COLLECTIONS.studyRoomMessages, attr.key, attr.size, attr.required, attr.defaultVal || undefined);
      } else if (attr.type === "boolean") {
        await db.createBooleanAttribute(DATABASE_ID, COLLECTIONS.studyRoomMessages, attr.key, attr.required, attr.defaultVal);
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

  // Create indexes for studyRoomMessages
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.studyRoomMessages, "idx_roomId", "key", ["roomId"], ["asc"]);
    console.log("   ✅ Index: idx_roomId");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_roomId already exists.");
    else console.error("   ❌ Index:", e.message);
  }
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.studyRoomMessages, "idx_timestamp", "key", ["timestamp"], ["asc"]);
    console.log("   ✅ Index: idx_timestamp");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_timestamp already exists.");
    else console.error("   ❌ Index:", e.message);
  }

  // ════════════════════════════════════════════════════════
  // 3. studyRoomMembers
  // ════════════════════════════════════════════════════════
  try {
    console.log("\n📦 Creating collection: studyRoomMembers ...");
    await db.createCollection(DATABASE_ID, COLLECTIONS.studyRoomMembers, "Study Room Members", permissions);
    console.log("   ✅ Collection created.");
  } catch (e) {
    if (e.code === 409) {
      console.log("   ⏭  Collection 'studyRoomMembers' already exists. Skipping creation.");
    } else {
      console.error("   ❌ Error:", e.message);
    }
  }

  const memberAttrs = [
    { key: "roomId",     type: "string",  size: 255, required: true  },
    { key: "userId",     type: "string",  size: 255, required: true  },
    { key: "userName",   type: "string",  size: 255, required: true  },
    { key: "status",     type: "string",  size: 500, required: false },
    { key: "isFocusing", type: "boolean", required: false, defaultVal: true },
    { key: "lastActive", type: "string",  size: 64,  required: true  },
  ];

  for (const attr of memberAttrs) {
    try {
      if (attr.type === "string") {
        await db.createStringAttribute(DATABASE_ID, COLLECTIONS.studyRoomMembers, attr.key, attr.size, attr.required, attr.defaultVal || undefined);
      } else if (attr.type === "boolean") {
        await db.createBooleanAttribute(DATABASE_ID, COLLECTIONS.studyRoomMembers, attr.key, attr.required, attr.defaultVal);
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

  // Create indexes for studyRoomMembers
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.studyRoomMembers, "idx_roomId", "key", ["roomId"], ["asc"]);
    console.log("   ✅ Index: idx_roomId");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_roomId already exists.");
    else console.error("   ❌ Index:", e.message);
  }
  try {
    await db.createIndex(DATABASE_ID, COLLECTIONS.studyRoomMembers, "idx_userId", "key", ["userId"], ["asc"]);
    console.log("   ✅ Index: idx_userId");
  } catch (e) {
    if (e.code === 409) console.log("   ⏭  Index idx_userId already exists.");
    else console.error("   ❌ Index:", e.message);
  }

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   ✅ All Co-Study Rooms collections are ready!          ║");
  console.log("║   You can now run: npm run dev                          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("\n❌ Setup script failed:", err.message);
  process.exit(1);
});
