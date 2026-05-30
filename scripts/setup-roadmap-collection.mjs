/**
 * Appwrite Collection Setup Script — roadmapHistory
 *
 * Run this script with Node.js to create the "roadmapHistory" collection
 * in your Appwrite database.
 *
 * Usage:
 *   node scripts/setup-roadmap-collection.mjs
 */

import { Client, Databases, Permission, Role } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID || "69d4644900361e0d0c92")
  .setKey(process.env.APPWRITE_API_KEY || "");

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || "studyplan";
const COLLECTION_ID = "roadmapHistory";

async function main() {
  console.log("Setting up roadmapHistory collection...\n");

  try {
    // 1. Create the collection
    console.log("Creating collection:", COLLECTION_ID);
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      "Roadmap History",
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false,
      true
    );
    console.log("  ✅ Collection created\n");

    // 2. Create attributes
    console.log("Creating attributes...");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "userId", 255, true);
    console.log("  ✅ userId (string, required)");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "goal", 500, true);
    console.log("  ✅ goal (string, required)");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "subject", 255, false);
    console.log("  ✅ subject (string, optional)");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "duration", 255, false);
    console.log("  ✅ duration (string, optional)");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "level", 255, false);
    console.log("  ✅ level (string, optional)");

    await databases.createEnumAttribute(DATABASE_ID, COLLECTION_ID, "roadmapType", ["quick", "detailed"], true);
    console.log("  ✅ roadmapType (enum: quick/detailed, required)");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "roadmapContent", 100000, true);
    console.log("  ✅ roadmapContent (string, required, max 100k chars)");

    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, "createdAt", true);
    console.log("  ✅ createdAt (datetime, required)");

    // Wait for attributes to be available
    console.log("\n  ⏳ Waiting 3s for attributes to become available...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Create indexes
    console.log("\nCreating indexes...");

    await databases.createIndex(DATABASE_ID, COLLECTION_ID, "idx_userId", "key", ["userId"]);
    console.log("  ✅ Index on userId");

    await databases.createIndex(DATABASE_ID, COLLECTION_ID, "idx_createdAt", "key", ["createdAt"], ["desc"]);
    console.log("  ✅ Index on createdAt (desc)");

    console.log("\n🎉 roadmapHistory collection setup complete!");
    console.log("   Database:", DATABASE_ID);
    console.log("   Collection:", COLLECTION_ID);

  } catch (error) {
    if (error.code === 409) {
      console.log("  ⚠️  Collection or attribute already exists, skipping...");
    } else {
      console.error("❌ Error setting up collection:", error.message || error);
      process.exit(1);
    }
  }
}

main();
