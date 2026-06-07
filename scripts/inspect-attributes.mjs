import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const PROJECT_ID = "69d4644900361e0d0c92";
const DATABASE_ID = "studyplan";

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

  const collections = ["studyRooms", "studyRoomMessages", "studyRoomMembers"];

  for (const collectionId of collections) {
    try {
      console.log(`\n=== Collection: ${collectionId} ===`);
      const col = await databases.getCollection(DATABASE_ID, collectionId);
      console.log(`Document Security: ${col.documentSecurity}`);
      console.log(`Permissions: ${JSON.stringify(col.$permissions)}`);
      
      console.log("\nAttributes:");
      for (const attr of col.attributes) {
        console.log(`  - ${attr.key}: type=${attr.type}, status=${attr.status}, required=${attr.required}`);
      }

      console.log("\nIndexes:");
      for (const idx of col.indexes) {
        console.log(`  - ${idx.key}: type=${idx.type}, status=${idx.status}, attributes=${JSON.stringify(idx.attributes)}`);
      }
    } catch (err) {
      console.error(`Error inspecting ${collectionId}:`, err.message);
    }
  }
}

main();
