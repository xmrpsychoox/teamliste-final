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
export async function createUser(
  username: string,
  password: string,
  name: string,
  role: "user" | "admin" = "user"
): Promise<any> {
  const db = await getDb();

  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Username already exists");
  }

  const passwordHash = await hashPassword(password);

  const result = await db.insert(users).values([
    {
      username,
      passwordHash,
      name,
      role,
      loginMethod: "custom",
      lastSignIn: new Date(),
      sessionVersion: 1, // NEW: Session-Versionierung für Invalidierung
    },
  ]);

  return result;
}

/**
 * Authenticate a user with username/password
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const user = result[0];

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  return user;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * NEW: Invalidate all sessions for a user by incrementing sessionVersion
 * This will force all existing JWT tokens to become invalid
 */
export async function invalidateUserSessions(username: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (result.length === 0) {
    throw new Error("User not found");
  }

  const user = result[0];
  const newSessionVersion = (user.sessionVersion || 1) + 1;

  // Increment sessionVersion to invalidate all existing tokens
  await db
    .update(users)
    .set({ sessionVersion: newSessionVersion })
    .where(eq(users.username, username));

  return true;
}

/**
 * NEW: Invalidate all sessions for all users
 * This will force all existing JWT tokens to become invalid
 */
export async function invalidateAllUserSessions(): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all users
  const allUsers = await db.select().from(users);

  // Increment sessionVersion for all users
  for (const user of allUsers) {
    const newSessionVersion = (user.sessionVersion || 1) + 1;
    await db
      .update(users)
      .set({ sessionVersion: newSessionVersion })
      .where(eq(users.id, user.id));
  }

  return true;
}

/**
 * Update user password with master password validation
 * MODIFIED: Now invalidates all sessions when password is changed
 */
export async function updatePasswordWithMaster(
  username: string,
  newPassword: string,
  masterPassword: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify master password
  if (masterPassword !== ENV.masterPassword) {
    throw new Error("Invalid master password. Expected: '${ENV.masterPassword}', Got: '${masterPassword}', ENV var: ${process.env.MASTER_PASSWORD}");
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (result.length === 0) {
    throw new Error("User not found");
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.username, username));

  // NEW: Invalidate all sessions for this user
  await invalidateUserSessions(username);

  return true;
}

/**
 * Reset user password with master password validation
 * MODIFIED: Now invalidates all sessions when password is reset
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
    throw new Error(
      `Invalid master password. Expected: '${ENV.masterPassword}', Got: '${masterPassword}', ENV var: ${process.env.MASTER_PASSWORD}`
    );
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (result.length === 0) {
    throw new Error("User not found");
  }

  const user = result[0];
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await db
    .update(users)
    .set({ passwordHash: newPasswordHash })
    .where(eq(users.username, username));

  // NEW: Invalidate all sessions for this user
  await invalidateUserSessions(username);

  return {
    success: true,
    message: "Password updated successfully",
  };
}
