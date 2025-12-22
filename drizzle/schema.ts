import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with username/password fields for custom authentication.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  /** Username for custom login */
  username: varchar("username", { length: 64 }).unique(),
  /** Hashed password for custom login */
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Available ranks for team members
 */
export const availableRanks = [
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
] as const;

export type AvailableRank = typeof availableRanks[number];

/**
 * Available Verwaltungen (management roles) for team members
 */
export const availableVerwaltungen = [
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
] as const;

export type AvailableVerwaltung = typeof availableVerwaltungen[number];

/**
 * Activity status enum - for team member activity tracking
 */
export const activityStatusEnum = mysqlEnum("activityStatus", [
  "aktiv",
  "inaktiv",
  "abgemeldet",
  "gespraech_noetig"
]);

export type ActivityStatus = "aktiv" | "inaktiv" | "abgemeldet" | "gespraech_noetig";

/**
 * Team members table
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  // Store multiple ranks as JSON array
  ranks: json("ranks").$type<string[]>(),
  discordId: varchar("discordId", { length: 64 }),
  avatarUrl: text("avatarUrl"),
  // New activity status field
  activityStatus: activityStatusEnum.default("aktiv"),
  // Notes field for additional information
  notes: text("notes"),
  // Verwaltungen (management roles) as JSON array
  verwaltungen: json("verwaltungen").$type<string[]>(),
  joinDate: timestamp("joinDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
