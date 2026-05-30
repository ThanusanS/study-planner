/**
 * Appwrite Collection Setup Script — notesHistory
 *
 * Run this script with Node.js to create the "notesHistory" collection
 * in your Appwrite database. It creates the collection with the correct
 * schema attributes and permissions.
 *
 * Usage:
 *   node scripts/setup-notes-collection.mjs
 *
 * Prerequisites:
 *   - Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, DATABASE_ID
 *     in your .env file (already present in this project)
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
const COLLECTION_ID = "notesHistory";

async function main() {
  console.log("Setting up notesHistory collection...\n");

  try {
    // 1. Create the collection
    console.log("Creating collection:", COLLECTION_ID);
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      "Notes History",
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false, // documentSecurity
      true   // enabled
    );
    console.log("  ✅ Collection created\n");

    // 2. Create attributes
    console.log("Creating attributes...");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "userId", 255, true);
    console.log("  ✅ userId (string, required)");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "topic", 500, true);
    console.log("  ✅ topic (string, required)");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "subject", 255, false);
    console.log("  ✅ subject (string, optional)");

    await databases.createEnumAttribute(DATABASE_ID, COLLECTION_ID, "noteType", ["short", "full"], true);
    console.log("  ✅ noteType (enum: short/full, required)");

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "notesContent", 100000, true);
    console.log("  ✅ notesContent (string, required, max 100k chars)");

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

    console.log("\n🎉 notesHistory collection setup complete!");
    console.log("   Database:", DATABASE_ID);
    console.log("   Collection:", COLLECTION_ID);

  } catch (error) {
    if (error.code === 409) {
      console.log("  ⚠️  Collection or attribute already exists, skipping...");
      console.log("  The notesHistory collection may already be set up.");
    } else {
      console.error("❌ Error setting up collection:", error.message || error);
      process.exit(1);
    }
  }
}

main();
