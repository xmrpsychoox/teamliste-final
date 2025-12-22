import "dotenv/config";
import { getDb } from "./server/db.js";
import { roles, verwaltungen } from "./drizzle/schema.js";

async function test() {
  console.log("Testing database connection...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 50) + "...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    process.exit(1);
  }
  
  console.log("✅ Database connected");
  
  try {
    const rolesResult = await db.select().from(roles);
    console.log(`✅ roles table exists, found ${rolesResult.length} rows`);
  } catch (error: any) {
    console.error(`❌ roles table error:`, error.message);
  }
  
  try {
    const verwaltungenResult = await db.select().from(verwaltungen);
    console.log(`✅ verwaltungen table exists, found ${verwaltungenResult.length} rows`);
  } catch (error: any) {
    console.error(`❌ verwaltungen table error:`, error.message);
  }
  
  process.exit(0);
}

test();
