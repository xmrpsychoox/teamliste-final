import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { teamMembers, InsertTeamMember, TeamMember, availableRanks, AvailableRank, availableVerwaltungen, AvailableVerwaltung } from "../drizzle/schema";

// Re-export for use in routers
export { availableRanks, availableVerwaltungen };
export type { AvailableRank, AvailableVerwaltung };

// Rank hierarchy order for sorting (first rank in the array determines position)
const rankOrder = availableRanks;

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get team members: database not available");
    return [];
  }

  const members = await db.select().from(teamMembers);
  
  // Sort by the highest rank in their ranks array
  return members.sort((a, b) => {
    const aRanks = a.ranks || [];
    const bRanks = b.ranks || [];
    
    // Get the highest rank (lowest index) for each member
    const aHighestIndex = Math.min(...aRanks.map(r => rankOrder.indexOf(r as AvailableRank)).filter(i => i >= 0), 999);
    const bHighestIndex = Math.min(...bRanks.map(r => rankOrder.indexOf(r as AvailableRank)).filter(i => i >= 0), 999);
    
    return aHighestIndex - bHighestIndex;
  });


export async function getTeamMemberById(id: number): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get team member: database not available");
    return undefined;
  }

  const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(teamMembers).values(member);
  const insertId = result[0].insertId;
  
  const created = await getTeamMemberById(insertId);
  if (!created) {
    throw new Error("Failed to retrieve created team member");
  }
  return created;
}

export async function updateTeamMember(id: number, updates: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(teamMembers).set(updates).where(eq(teamMembers.id, id));
  return getTeamMemberById(id);
}

export async function deleteTeamMember(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.delete(teamMembers).where(eq(teamMembers.id, id));
  return result[0].affectedRows > 0;
}
