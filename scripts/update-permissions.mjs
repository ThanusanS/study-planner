import { Client, Databases, Permission, Role } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const PROJECT_ID = "69d4644900361e0d0c92";
const DATABASE_ID = "studyplan";

const COLLECTIONS = {
  studyRooms: "studyRooms",
  studyRoomMessages: "studyRoomMessages",
  studyRoomMembers: "studyRoomMembers",
};

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

  for (const [key, collectionId] of Object.entries(COLLECTIONS)) {
    try {
      console.log(`Updating permissions for collection: ${collectionId}...`);
      
      // Fetch current collection details first to get the name
      const col = await databases.getCollection(DATABASE_ID, collectionId);
      
      // Update permissions
      await databases.updateCollection(
        DATABASE_ID,
        collectionId,
        col.name,
        permissions
      );
      
      console.log(`✅ Successfully updated permissions for ${collectionId}`);
    } catch (err) {
      console.error(`❌ Failed to update permissions for ${collectionId}:`, err.message);
    }
  }
}

main();
