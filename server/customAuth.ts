import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";


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
    passwordChangedAt: new Date(), // Set initial password change timestamp
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
 * This will invalidate all existing sessions by updating passwordChangedAt
 */
export async function updatePasswordWithMaster(
  username: string, 
  newPassword: string, 
  masterPassword: string
): Promise<boolean> {
  // Verify master password
  if (masterPassword !== ENV.masterPassword) {
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

  // Update password AND passwordChangedAt to invalidate all existing sessions
  await db.update(users).set({ 
    passwordHash,
    passwordChangedAt: new Date() // This will invalidate all existing JWT tokens
  }).where(eq(users.username, username));

  console.log(`[Auth] Password changed for user '${username}'. All existing sessions invalidated.`);

  return true;
}

/**
 * Reset user password with master password validation
 * This will invalidate all existing sessions by updating passwordChangedAt
 */
export async function resetUserPassword(
  username: string,
  newPassword: string,
  masterPassword: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  console.error("[DEBUG] Master password from ENV:", ENV.masterPassword);
  console.error("[DEBUG] Master password from input:", masterPassword);
  console.error("[DEBUG] process.env.MASTER_PASSWORD:", process.env.MASTER_PASSWORD);

  if (masterPassword !== ENV.masterPassword) {
    throw new Error(`Invalid master password. Expected: '${ENV.masterPassword}', Got: '${masterPassword}', ENV var: '${process.env.MASTER_PASSWORD}'`);
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (result.length === 0) {
    throw new Error("User not found");
  }

  const user = result[0];
  const newPasswordHash = await hashPassword(newPassword);

  // Update password AND passwordChangedAt to invalidate all existing sessions
  await db.update(users).set({ 
    passwordHash: newPasswordHash,
    passwordChangedAt: new Date() // This will invalidate all existing JWT tokens
  }).where(eq(users.id, user.id));

  console.log(`[Auth] Password reset for user '${username}'. All existing sessions invalidated.`);

  return { success: true, message: "Password updated successfully. All users have been logged out." };
}
