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
    console.log("🔥 Deleting 'membersCount' attribute...");
    try {
      await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, "membersCount");
      console.log("✅ Delete request submitted. Waiting 10 seconds...");
    } catch (err) {
      console.warn("⚠️ Error deleting attribute (might not exist):", err.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("🔨 Recreating 'membersCount' attribute...");
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      "membersCount",
      false, // required = false
      undefined, // min
      undefined, // max
      0 // default = 0
    );
    console.log("✅ Create request submitted. Waiting 10 seconds...");

    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Inspect final status
    const col = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    const attr = col.attributes.find((a) => a.key === "membersCount");
    if (attr) {
      console.log(`🎉 Final status for 'membersCount': status=${attr.status}, type=${attr.type}`);
    } else {
      console.error("❌ 'membersCount' attribute not found after recreation!");
    }
  } catch (err) {
    console.error("❌ Operation failed:", err.message);
  }
}

main();
