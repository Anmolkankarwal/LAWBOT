import { useState, useCallback } from "react";
import { trpc } from "@/providers/trpc";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  structuredContent?: string;
  createdAt: Date;
}

export interface Conversation {
  id: number;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export function useChatStore() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const utils = trpc.useUtils();
  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: () => {
      utils.conversation.list.invalidate();
    },
  });
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  const startNewConversation = useCallback(
    async (userId?: number, guestId?: string) => {
      const result = await createConversation.mutateAsync({
        title: "New Conversation",
        userId,
        guestId,
      });
      if (result) {
        setActiveConversationId(result.id);
        setMessages([]);
        return result.id;
      }
      return null;
    },
    [createConversation]
  );

  const loadConversation = useCallback((conversation: {
    id: number;
    messages: ChatMessage[];
  }) => {
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
  }, []);

  const sendMessage = useCallback(
    async (content: string, conversationId: number) => {
      setIsLoading(true);

      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: Date.now(),
        role: "user",
        content,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const aiMessage = await sendMessageMutation.mutateAsync({
          conversationId,
          content,
        });

        if (aiMessage) {
          const assistantMessage: ChatMessage = {
            id: aiMessage.id,
            role: "assistant",
            content: aiMessage.content,
            structuredContent: aiMessage.structuredContent || undefined,
            createdAt: aiMessage.createdAt,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Add error message
        const errorMessage: ChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [sendMessageMutation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
  }, []);

  return {
    activeConversationId,
    messages,
    isLoading,
    startNewConversation,
    loadConversation,
    sendMessage,
    clearMessages,
    setActiveConversationId,
  };
}
