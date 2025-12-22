import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const SALT_ROUNDS = 10;

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("🌱 Seeding database...");

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.username, "tvsyndikat")).limit(1);

  if (existing.length > 0) {
    console.log("✅ User 'tvsyndikat' already exists, skipping seed");
    process.exit(0);
  }

  // Hash password
  const passwordHash = await bcrypt.hash("syndikat1337", SALT_ROUNDS);

  // Create fixed user
  await db.insert(users).values({
    username: "tvsyndikat",
    passwordHash,
    name: "SYNDIKAT Admin",
    role: "admin",
    loginMethod: "custom",
    lastSignedIn: new Date(),
  });

  console.log("✅ Seeded user: tvsyndikat / syndikat1337 (admin)");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
