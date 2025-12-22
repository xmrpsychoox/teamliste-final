import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

describe("auth.login", () => {
  it("authenticates user with correct credentials and sets session cookie", async () => {
    const setCookies: CookieCall[] = [];

    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        cookie: (name: string, value: string, options: Record<string, unknown>) => {
          setCookies.push({ name, value, options });
        },
        clearCookie: () => {},
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      username: "tvsyndikat",
      password: "syndikat1337",
    });

    expect(result.success).toBe(true);
    expect(result.user).toMatchObject({
      username: "tvsyndikat",
      name: "SYNDIKAT Admin",
      role: "admin",
    });

    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
    expect(setCookies[0]?.value).toBeTruthy();
    expect(setCookies[0]?.options).toMatchObject({
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });

  it("rejects login with invalid credentials", async () => {
    const ctx: TrpcContext = {
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

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        username: "tvsyndikat",
        password: "wrongpassword",
      })
    ).rejects.toThrow("Invalid username or password");
  });
});
