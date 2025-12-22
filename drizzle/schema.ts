import { mysqlTable, int, varchar, boolean, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  openId: varchar("openId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  lastSignedIn: timestamp("lastSignedIn").notNull().defaultNow(),
});

export const teamMembers = mysqlTable("team_members", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  discordId: varchar("discordId", { length: 255 }).notNull(),
  rang: varchar("rang", { length: 255 }).notNull(),
  verwaltung: varchar("verwaltung", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const roles = mysqlTable("roles", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  isListed: boolean("isListed").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const verwaltungen = mysqlTable("verwaltungen", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  isListed: boolean("isListed").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

// Available ranks for team members
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

// Available Verwaltungen for team members
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
