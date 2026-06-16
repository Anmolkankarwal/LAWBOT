import { authRouter } from "./auth-router";
import { conversationRouter } from "./conversation-router";
import { chatRouter } from "./chat-router";
import { guestRouter } from "./guest-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  guest: guestRouter,
  conversation: conversationRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
