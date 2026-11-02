import { Client, Databases, Query } from "node-appwrite";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf-8");
const apiKey = envContent.match(/^APPWRITE_API_KEY=(.*)$/m)[1].trim();

const client = new Client();
client.setEndpoint("https://sgp.cloud.appwrite.io/v1").setProject("69d4644900361e0d0c92").setKey(apiKey);
const db = new Databases(client);

// Reset all room membersCount to 0
const rooms = await db.listDocuments("studyplan", "studyRooms", [Query.limit(100)]);
console.log("Found", rooms.total, "rooms");

for (const r of rooms.documents) {
  if (r.membersCount > 0) {
    await db.updateDocument("studyplan", "studyRooms", r.$id, { membersCount: 0 });
    console.log("  ✅ Reset:", r.name, "->", "0 online");
  } else {
    console.log("  ⏭ ", r.name, "already 0");
  }
}

// Also clear any stale userPlans (pro plans auto-created by old code)
try {
  const plans = await db.listDocuments("studyplan", "userPlans", [Query.limit(100)]);
  console.log("\nFound", plans.total, "user plans");
  for (const p of plans.documents) {
    if (p.plan === "pro" && p.aiCredits === 500 && p.maxCredits === 500) {
      await db.updateDocument("studyplan", "userPlans", p.$id, {
        plan: "free",
        aiCredits: 10,
        maxCredits: 10,
      });
      console.log("  ✅ Downgraded stale pro plan for userId:", p.userId);
    }
  }
} catch (e) {
  console.log("  No stale plans to fix");
}

console.log("\n✅ All done!");
