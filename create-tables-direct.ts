import "dotenv/config";
import mysql from "mysql2/promise";

async function createTables() {
  console.log("🔧 Creating tables directly in database...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }
  
  console.log("📍 Connecting to database...");
  
  const connection = await mysql.createConnection(connectionString);
  
  try {
    console.log("✅ Connected to database");
    
    // Create roles table
    console.log("📝 Creating roles table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`roles\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL UNIQUE,
        \`displayName\` VARCHAR(255) NOT NULL,
        \`isListed\` BOOLEAN NOT NULL DEFAULT true,
        \`sortOrder\` INT NOT NULL DEFAULT 0,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ roles table created");
    
    // Create verwaltungen table
    console.log("📝 Creating verwaltungen table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`verwaltungen\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL UNIQUE,
        \`displayName\` VARCHAR(255) NOT NULL,
        \`isListed\` BOOLEAN NOT NULL DEFAULT true,
        \`sortOrder\` INT NOT NULL DEFAULT 0,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ verwaltungen table created");
    
    console.log("🎉 All tables created successfully!");
    
  } catch (error) {
    console.error("❌ Error creating tables:", error);
  } finally {
    await connection.end();
  }
}

createTables();
