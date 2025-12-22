import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createUser } from "./customAuth";

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

describe("auth.resetPassword", () => {
  const testUsername = "testuser_reset_" + Date.now();
  const correctMasterPassword = "SyndikatReset1337";
  const wrongMasterPassword = "WrongPassword123";

  beforeAll(async () => {
    // Create a test user
    try {
      await createUser(testUsername, "oldpassword123", "Test User", "user");
    } catch (error) {
      // User might already exist, ignore
    }
  });

  it("successfully resets password with correct master password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.resetPassword({
      username: testUsername,
      newPassword: "newpassword123",
      masterPassword: correctMasterPassword,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Password updated successfully");
  });

  it("rejects password reset with incorrect master password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.resetPassword({
        username: testUsername,
        newPassword: "newpassword456",
        masterPassword: wrongMasterPassword,
      })
    ).rejects.toThrow("Invalid master password");
  });

  it("rejects password reset for non-existent user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.resetPassword({
        username: "nonexistentuser_" + Date.now(),
        newPassword: "newpassword789",
        masterPassword: correctMasterPassword,
      })
    ).rejects.toThrow("User not found");
  });

  it("rejects password reset with short password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.resetPassword({
        username: testUsername,
        newPassword: "short",
        masterPassword: correctMasterPassword,
      })
    ).rejects.toThrow();
  });
});
