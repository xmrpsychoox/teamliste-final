import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: null,
    username: "tvsyndikat",
    passwordHash: null,
    email: null,
    name: "SYNDIKAT Admin",
    loginMethod: "custom",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("team.list", () => {
  it("returns team members list for authenticated users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const members = await caller.team.list();

    expect(Array.isArray(members)).toBe(true);
  });
  
  it("rejects unauthenticated access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.team.list()).rejects.toThrow();
  });
});

describe("team.ranks", () => {
  it("returns available ranks for authenticated users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const ranks = await caller.team.ranks();

    expect(Array.isArray(ranks)).toBe(true);
    expect(ranks).toContain("Projektleitung");
    expect(ranks).toContain("Admin");
    expect(ranks).toContain("Developer");
  });
});

describe("team.verwaltungen", () => {
  it("returns available verwaltungen for authenticated users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const verwaltungen = await caller.team.verwaltungen();

    expect(Array.isArray(verwaltungen)).toBe(true);
    expect(verwaltungen).toContain("Frakverwaltung");
    expect(verwaltungen).toContain("Eventmanagement");
  });
});

describe("team.create", () => {
  it("allows admin to create team member", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const newMember = await caller.team.create({
      name: "Test Member",
      ranks: ["Developer"],
      activityStatus: "aktiv",
    });

    expect(newMember).toMatchObject({
      name: "Test Member",
      ranks: ["Developer"],
      activityStatus: "aktiv",
    });
    expect(newMember.id).toBeTruthy();
  });

  it("rejects non-admin user from creating team member", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.team.create({
        name: "Test Member",
        ranks: ["Developer"],
      })
    ).rejects.toThrow();
  });
});
