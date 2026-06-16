import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { TRPCError } from "@trpc/server";

// In-memory store for guest sessions (use Redis in production)
const guestSessions = new Map<string, { createdAt: number; lastActive: number }>();

// Clean up old guest sessions periodically (older than 7 days)
setInterval(() => {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  for (const [guestId, session] of guestSessions.entries()) {
    if (now - session.lastActive > sevenDays) {
      guestSessions.delete(guestId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

export const guestRouter = createRouter({
  // Create a new guest session
  create: publicQuery.mutation(() => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    guestSessions.set(guestId, {
      createdAt: Date.now(),
      lastActive: Date.now(),
    });
    return { guestId };
  }),

  // Validate a guest session
  validate: publicQuery
    .input(z.object({ guestId: z.string() }))
    .query(({ input }) => {
      const session = guestSessions.get(input.guestId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Guest session not found or expired",
        });
      }
      session.lastActive = Date.now();
      return { valid: true, guestId: input.guestId };
    }),

  // Refresh a guest session
  refresh: publicQuery
    .input(z.object({ guestId: z.string() }))
    .mutation(({ input }) => {
      const session = guestSessions.get(input.guestId);
      if (session) {
        session.lastActive = Date.now();
      }
      return { success: true };
    }),
});
