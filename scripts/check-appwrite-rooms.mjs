import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const PROJECT_ID = "69d4644900361e0d0c92";
const DATABASE_ID = "studyplan";
const COLLECTION_ID = "studyRooms";

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

  try {
    console.log("Fetching documents from studyRooms collection...");
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
    console.log(`Successfully fetched. Total rooms found: ${response.total}`);
    console.log("Rooms details:");
    console.log(JSON.stringify(response.documents, null, 2));
  } catch (err) {
    console.error("Error fetching studyRooms:", err);
  }
}

main();
