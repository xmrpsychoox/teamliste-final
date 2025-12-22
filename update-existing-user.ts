import { getDb } from "./server/_core/db";
import { users } from "./server/drizzle/schema";
import { hashPassword } from "./server/auth";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🔄 Updating existing user with username and password...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  try {
    // Hash the password
    const passwordHash = await hashPassword("syndikat1337");
    console.log("✅ Password hashed successfully");

    // Check if user already exists
    const existingUsers = await db.select().from(users).limit(10);
    console.log(`📊 Found ${existingUsers.length} existing user(s)`);

    if (existingUsers.length > 0) {
      // Update the first user
      const firstUser = existingUsers[0];
      console.log(`🔧 Updating user ID ${firstUser.id}...`);
      
      await db.update(users)
        .set({ 
          username: "tvsyndikat",
          passwordHash: passwordHash,
          role: "admin", // Ensure admin role
        })
        .where(eq(users.id, firstUser.id));
      
      console.log("✅ User updated successfully!");
      console.log("📝 Login credentials:");
      console.log("   Username: tvsyndikat");
      console.log("   Password: syndikat1337");
    } else {
      // No existing user, create new one
      console.log("👤 No existing user found. Creating new admin user...");
      
      await db.insert(users).values({
        username: "tvsyndikat",
        passwordHash: passwordHash,
        name: "Admin",
        email: "admin@syndikat.local",
        loginMethod: "custom",
        role: "admin",
        lastSignedIn: new Date(),
      });
      
      console.log("✅ New admin user created successfully!");
      console.log("📝 Login credentials:");
      console.log("   Username: tvsyndikat");
      console.log("   Password: syndikat1337");
    }
    
    console.log("\n🎉 Done! You can now log in with the credentials above.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
