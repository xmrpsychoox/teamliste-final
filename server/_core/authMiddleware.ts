import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";
import { getUserById } from "../auth";

/**
 * Middleware to validate that the user's session is still valid
 * (i.e., password hasn't been changed since the JWT was issued)
 */
export async function validateSessionMiddleware(ctx: TrpcContext) {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  // Get the latest user data from the database
  const currentUser = await getUserById(ctx.user.id);

  if (!currentUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found",
    });
  }

  // Check if password was changed after the JWT was issued
  if (currentUser.passwordChangedAt && ctx.user.iat) {
    const passwordChangedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
    
    // If password was changed after the token was issued, invalidate the session
    if (passwordChangedTimestamp > ctx.user.iat) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Session expired due to password change. Please log in again.",
      });
    }
  }

  return ctx;
}

/**
 * Create a protected procedure that requires authentication and validates session
 */
export function createProtectedProcedure(t: any) {
  return t.procedure.use(async ({ ctx, next }: { ctx: TrpcContext; next: any }) => {
    await validateSessionMiddleware(ctx);
    return next({ ctx });
  });
}
