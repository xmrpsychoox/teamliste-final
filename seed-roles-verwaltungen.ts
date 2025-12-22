import "dotenv/config";
import { getDb } from "./server/db.js";
import { roles, verwaltungen } from "./drizzle/schema.js";

const seedRoles = [
  "Projektleitung",
  "Stv.Projektleitung",
  "Leadership",
  "Head-Admin",
  "Admin",
  "T-Admin",
  "Head-Moderation",
  "Moderation",
  "T-Moderation",
  "Head-Support",
  "Support",
  "T-Support",
  "Head-Analyst",
  "Analyst",
  "Developer",
  "Development Cars",
  "Development Mapping",
  "Development Kleidung",
  "Medien Gestalter",
  "Highteam"
];

const seedVerwaltungen = [
  "Frakverwaltungs Leitung",
  "Frakverwaltung",
  "Eventmanagement",
  "Teamverwaltungs Leitung",
  "Teamverwaltung",
  "Regelwerkteam",
  "Teamüberwachung",
  "Support Leitung",
  "Mod Leitung",
  "Spendenverwaltung",
  "Streamingverwaltung"
];

async function seed() {
  console.log("🌱 Starting seed process...");
  console.log("📍 DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Not set");
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Database not available");
      console.error("Please check your .env file and DATABASE_URL");
      process.exit(1);
    }

    console.log("✅ Database connection established");

    // Check if roles already exist
    const existingRoles = await db.select().from(roles);
    
    if (existingRoles.length > 0) {
      console.log(`ℹ️  Found ${existingRoles.length} existing roles. Skipping role seeding.`);
    } else {
      console.log("📝 Inserting roles...");
      for (let i = 0; i < seedRoles.length; i++) {
        const roleName = seedRoles[i];
        const roleNameSlug = roleName.toLowerCase().replace(/\s+/g, '_').replace(/\./g, '');
        
        await db.insert(roles).values({
          name: roleNameSlug,
          displayName: roleName,
          isListed: true,
          sortOrder: i
        });
        
        console.log(`  ✓ Created role: ${roleName}`);
      }
      console.log(`✅ Successfully inserted ${seedRoles.length} roles`);
    }

    // Check if verwaltungen already exist
    const existingVerwaltungen = await db.select().from(verwaltungen);
    
    if (existingVerwaltungen.length > 0) {
      console.log(`ℹ️  Found ${existingVerwaltungen.length} existing verwaltungen. Skipping verwaltungen seeding.`);
    } else {
      console.log("📝 Inserting verwaltungen...");
      for (let i = 0; i < seedVerwaltungen.length; i++) {
        const verwaltungName = seedVerwaltungen[i];
        const verwaltungNameSlug = verwaltungName.toLowerCase().replace(/\s+/g, '_');
        
        await db.insert(verwaltungen).values({
          name: verwaltungNameSlug,
          displayName: verwaltungName,
          isListed: true,
          sortOrder: i
        });
        
        console.log(`  ✓ Created verwaltung: ${verwaltungName}`);
      }
      console.log(`✅ Successfully inserted ${seedVerwaltungen.length} verwaltungen`);
    }

    console.log("🎉 Seed process completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seed process:");
    console.error(error);
    process.exit(1);
  }
}

seed();
