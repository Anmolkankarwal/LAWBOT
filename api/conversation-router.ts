import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { conversations, messages } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const conversationRouter = createRouter({
  // Create a new conversation
  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1).max(255).optional(),
        userId: z.number().optional(),
        guestId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.userId && !input.guestId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either userId or guestId is required",
        });
      }

      const db = getDb();
      const result = await db.insert(conversations).values({
        title: input.title || "New Conversation",
        userId: input.userId || null,
        guestId: input.guestId || null,
      });

      const insertedId = Number(result[0].insertId);
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, insertedId),
      });

      return conversation;
    }),

  // List conversations for a user or guest
  list: publicQuery
    .input(
      z.object({
        userId: z.number().optional(),
        guestId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.userId && !input.guestId) {
        return [];
      }

      const db = getDb();
      const conditions = [];
      if (input.userId) {
        conditions.push(eq(conversations.userId, input.userId));
      }
      if (input.guestId) {
        conditions.push(eq(conversations.guestId, input.guestId));
      }

      const result = await db
        .select()
        .from(conversations)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])
        .orderBy(desc(conversations.updatedAt));

      return result;
    }),

  // Get a single conversation with messages
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, input.id),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.createdAt)],
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      return conversation;
    }),

  // Update conversation title
  updateTitle: publicQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(conversations)
        .set({ title: input.title })
        .where(eq(conversations.id, input.id));

      return { success: true };
    }),

  // Delete a conversation
  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Delete messages first due to foreign key
      await db.delete(messages).where(eq(messages.conversationId, input.id));
      await db.delete(conversations).where(eq(conversations.id, input.id));
      return { success: true };
    }),
});
