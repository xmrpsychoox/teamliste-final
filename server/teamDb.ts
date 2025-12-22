import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { teamMembers, InsertTeamMember, TeamMember, roles } from "../drizzle/schema";

// Get rank order from database
async function getRankOrder(): Promise<Map<string, number>> {
  const db = await getDb();
  if (!db) {
    return new Map();
  }
  
  const allRoles = await db.select().from(roles).orderBy(roles.sortOrder);
  const rankMap = new Map<string, number>();
  
  allRoles.forEach((role) => {
    rankMap.set(role.name, role.sortOrder);
  });
  
  return rankMap;
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get team members: database not available");
    return [];
  }

  const members = await db.select({
    id: teamMembers.id,
    name: teamMembers.name,
    ranks: teamMembers.ranks,
    discordId: teamMembers.discordId,
    avatarUrl: teamMembers.avatarUrl,
    activityStatus: teamMembers.activityStatus,
    notes: teamMembers.notes,
    verwaltungen: teamMembers.verwaltungen,
    joinDate: teamMembers.joinDate,
    createdAt: teamMembers.createdAt,
    updatedAt: teamMembers.updatedAt,
  }).from(teamMembers);

  // Get rank order from database
  const rankOrder = await getRankOrder();
  
  // Sort by the highest rank (lowest sortOrder) in their ranks array
  return members.sort((a, b) => {
    const aRanks = a.ranks || [];
    const bRanks = b.ranks || [];
    
    // Get the highest rank (lowest sortOrder) for each member
    const aHighestOrder = Math.min(
      ...aRanks.map(r => rankOrder.get(r as string) ?? 999),
      999
    );
    const bHighestOrder = Math.min(
      ...bRanks.map(r => rankOrder.get(r as string) ?? 999),
      999
    );
    
    return aHighestOrder - bHighestOrder;
  });
}

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
