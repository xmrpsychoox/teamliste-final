import { COOKIE_NAME } from "@shared/const";
import { authenticateUser, updatePasswordWithMaster } from "./customAuth";
import { SignJWT } from "jose";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  getAllTeamMembers, 
  getTeamMemberById, 
  createTeamMember, 
  updateTeamMember, 
  deleteTeamMember,
} from "./teamDb";
import { getDb } from "./db";
import { roles, verwaltungen } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Zod schema for rank validation
const rankSchema = z.enum([
// Simplified validation - ranks and verwaltungen are now dynamic
const rankSchema = z.string().min(1).max(100);
const verwaltungSchema = z.string().min(1).max(100);

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});
// Roles Router
const rolesRouter = router({
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(roles).orderBy(roles.sortOrder);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      displayName: z.string().min(1).max(100),
      isListed: z.boolean().default(true),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.insert(roles).values(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.delete(roles).where(eq(roles.id, input.id));
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      displayName: z.string().min(1).max(100).optional(),
      isListed: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...data } = input;
      return await db.update(roles).set(data).where(eq(roles.id, id));
    }),
});

// Verwaltungen Router
const verwaltungenRouter = router({
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(verwaltungen).orderBy(verwaltungen.sortOrder);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      displayName: z.string().min(1).max(100),
      isListed: z.boolean().default(true),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.insert(verwaltungen).values(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.delete(verwaltungen).where(eq(verwaltungen.id, input.id));
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      displayName: z.string().min(1).max(100).optional(),
      isListed: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...data } = input;
      return await db.update(verwaltungen).set(data).where(eq(verwaltungen.id, id));
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // Custom login with username/password
    login: publicProcedure
      .input(z.object({
        username: z.string().min(3),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await authenticateUser(input.username, input.password);
        
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        // Create JWT token with userId
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
        const token = await new SignJWT({ userId: user.id })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("7d")
          .sign(secret);

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        });

        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
          },
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      // Clear both Custom Auth and Manus OAuth cookies
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie('manus_session', { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    // Password reset with master password
    resetPassword: publicProcedure
      .input(z.object({
        username: z.string().min(3),
        newPassword: z.string().min(6),
        masterPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          await updatePasswordWithMaster(input.username, input.newPassword, input.masterPassword);
          return {
            success: true,
            message: "Password updated successfully",
          };
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Password reset failed",
          });
        }
      }),
  }),

  // Team member routes - PROTECTED: only authenticated users can access
  team: router({
    // Protected: Get all team members (requires login)
    list: protectedProcedure.query(async () => {
      return getAllTeamMembers();
    }),

    // Protected: Get single team member (requires login)
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const member = await getTeamMemberById(input.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
        }
        return member;
      }),

    // Protected: Get available ranks (requires login)
    ranks: protectedProcedure.query(async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(roles).where(eq(roles.isListed, true)).orderBy(roles.sortOrder);
}),

    // Protected: Get available Verwaltungen (requires login)
    verwaltungen: protectedProcedure.query(async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(verwaltungen).where(eq(verwaltungen.isListed, true)).orderBy(verwaltungen.sortOrder);
}),

    // Admin: Create team member
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        ranks: z.array(rankSchema).min(1),
        verwaltungen: z.array(verwaltungSchema).optional(),
        discordId: z.string().max(64).optional(),
        avatarUrl: z.string().url().optional(),
        activityStatus: activityStatusSchema.optional(),
        notes: z.string().optional(),
        joinDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return createTeamMember({
          name: input.name,
          ranks: input.ranks,
          verwaltungen: input.verwaltungen ?? null,
          discordId: input.discordId ?? null,
          avatarUrl: input.avatarUrl ?? null,
          activityStatus: input.activityStatus ?? "aktiv",
          notes: input.notes ?? null,
          joinDate: input.joinDate ?? new Date(),
        });
      }),

    // Admin: Update team member
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        ranks: z.array(rankSchema).min(1).optional(),
        verwaltungen: z.array(verwaltungSchema).optional().nullable(),
        discordId: z.string().max(64).optional().nullable(),
        avatarUrl: z.string().url().optional().nullable(),
        activityStatus: activityStatusSchema.optional(),
        notes: z.string().optional().nullable(),
        joinDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const updated = await updateTeamMember(id, updates);
        if (!updated) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
        }
        return updated;
      }),

    // Admin: Delete team member
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await deleteTeamMember(input.id);
        if (!success) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
        }
        return { success: true };
      }),

    // Update activity status (can be done from overview by admin)
    updateActivityStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        activityStatus: activityStatusSchema,
      }))
      .mutation(async ({ input }) => {
        const updated = await updateTeamMember(input.id, { activityStatus: input.activityStatus });
        if (!updated) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
        }
        return updated;
      }),

    // Update notes (can be done from overview by admin)
    updateNotes: adminProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().nullable(),
      }))
      .mutation(async ({ input }) => {
        const updated = await updateTeamMember(input.id, { notes: input.notes });
        if (!updated) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
        }
        return updated;
      }),

    // Update Verwaltungen (can be done from overview by admin)
    updateVerwaltungen: adminProcedure
      .input(z.object({
        id: z.number(),
        verwaltungen: z.array(verwaltungSchema).nullable(),
      }))
      .mutation(async ({ input }) => {
        const updated = await updateTeamMember(input.id, { verwaltungen: input.verwaltungen });
        if (!updated) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
        }
        return updated;
      }),
  }),
    roles: rolesRouter,
  verwaltungen: verwaltungenRouter,

});

export type AppRouter = typeof appRouter;
