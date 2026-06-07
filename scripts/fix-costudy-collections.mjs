import { Client, Databases, Permission, Role } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const PROJECT_ID = "69d4644900361e0d0c92";
const DATABASE_ID = "studyplan";

const COLLECTIONS = ["studyRooms", "studyRoomMessages", "studyRoomMembers"];

async function main() {
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!apiKey) {
    console.error("APPWRITE_API_KEY not found in env!");
    return;
  }

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(apiKey);

  const databases = new Databases(client);

  const permissions = [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  console.log("\n=== DIAGNOSTIC & FIX ===\n");

  for (const collectionId of COLLECTIONS) {
    try {
      // 1. Get collection info
      const col = await databases.getCollection(DATABASE_ID, collectionId);
      console.log(`📦 ${collectionId}:`);
      console.log(`   enabled: ${col.enabled}`);
      console.log(`   documentSecurity: ${col.documentSecurity}`);
      console.log(`   permissions: ${JSON.stringify(col.$permissions)}`);

      // 2. Force: documentSecurity OFF, correct permissions, enabled ON
      await databases.updateCollection(
        DATABASE_ID,
        collectionId,
        col.name,
        permissions,
        false,  // documentSecurity = false
        true    // enabled = true
      );
      console.log(`   ✅ Fixed: documentSecurity=false, permissions updated\n`);
    } catch (err) {
      console.error(`   ❌ Error for ${collectionId}:`, err.message, "\n");
    }
  }

  // 3. Seed default rooms
  console.log("=== SEEDING DEFAULT ROOMS ===\n");
  const defaultRooms = [
    { id: "lofi-cafe", name: "☕ Lofi Study Cafe", description: "Grab a warm coffee and focus with background beats.", maxMembers: 20 },
    { id: "silent-lib", name: "📚 Silent University Library", description: "Absolute quiet study environment. Cam optional.", maxMembers: 10 },
    { id: "exam-cram", name: "⚡ Midterm Exam Cram Zone", description: "Intense studying for upcoming finals.", maxMembers: 15 }
  ];

  for (const room of defaultRooms) {
    try {
      await databases.getDocument(DATABASE_ID, "studyRooms", room.id);
      console.log(`   ⏭  Room '${room.id}' already exists.`);
    } catch (err) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          "studyRooms",
          room.id,
          {
            name: room.name,
            description: room.description,
            membersCount: 0,
            maxMembers: room.maxMembers,
            timerMode: "work",
            isPrivate: false,
            creatorId: "system",
            createdAt: new Date().toISOString()
          },
          permissions  // Document-level permissions
        );
        console.log(`   ✅ Seeded room: ${room.id}`);
      } catch (createErr) {
        console.error(`   ❌ Failed to seed '${room.id}':`, createErr.message);
      }
    }
  }

  // 4. List all rooms to verify
  console.log("\n=== VERIFICATION ===\n");
  try {
    const docs = await databases.listDocuments(DATABASE_ID, "studyRooms");
    console.log(`Total rooms in database: ${docs.total}`);
    for (const doc of docs.documents) {
      console.log(`   - ${doc.$id}: "${doc.name}" (private=${doc.isPrivate}, creator=${doc.creatorId})`);
    }
  } catch (err) {
    console.error("   ❌ Cannot list rooms:", err.message);
  }

  console.log("\n✅ Done!\n");
}

main();
