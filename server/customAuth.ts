import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new user with username/password
 */
export async function createUser(username: string, password: string, name: string, role: "user" | "admin" = "user") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if username already exists
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    throw new Error("Username already exists");
  }

  const passwordHash = await hashPassword(password);

  const result = await db.insert(users).values({
    username,
    passwordHash,
    name,
    role,
    loginMethod: "custom",
    lastSignedIn: new Date(),
  });

  return result;
}

/**
 * Authenticate a user with username/password
 */
export async function authenticateUser(username: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (result.length === 0) {
    return null;
  }

  const user = result[0];

  if (!user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  // Update last signed in
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  return user;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Update user password with master password validation
 */
export async function updatePasswordWithMaster(
  username: string, 
  newPassword: string, 
  masterPassword: string
): Promise<boolean> {
  const MASTER_PASSWORD = "SyndikatReset1337";
  
  // Verify master password
  if (masterPassword !== MASTER_PASSWORD) {
    throw new Error("Invalid master password");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if user exists
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await db.update(users).set({ passwordHash }).where(eq(users.username, username));

  return true;
}
