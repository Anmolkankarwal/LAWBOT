import { useState, useRef, useEffect, useCallback } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useChatStore } from "@/hooks/useChatStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import {
  Menu,
  User,
  Mic,
  ArrowUp,
  X,
  Plus,
  MessageSquare,
  Settings,
  Trash2,
  Volume2,
  VolumeX,
  LogOut,
  HelpCircle,
  Shield,
  Globe,
} from "lucide-react";

interface StructuredResponse {
  understanding: string;
  explanation: string;
  actionableSteps: string[];
  legalReferences: { name: string; section: string; description: string }[];
  disclaimer: string;
}

export default function ChatDashboard() {
  const auth = useUnifiedAuth();
  const chat = useChatStore();
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const voiceInput = useVoiceInput({
    onResult: (text) => {
      setInputValue(text);
    },
  });

  const voiceOutput = useVoiceOutput({
    language: "en-IN",
    rate: 0.9,
  });

  // Fetch conversation list
  const { data: conversationList } = trpc.conversation.list.useQuery({
    userId: auth.user?.id,
    guestId: auth.guestId || undefined,
  });

  const deleteConversation = trpc.conversation.delete.useMutation({
    onSuccess: () => {
      utils.conversation.list.invalidate();
    },
  });

  const utils = trpc.useUtils();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages, chat.isLoading]);

  // Handle send message
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || chat.isLoading) return;

    setInputValue("");

    let conversationId = chat.activeConversationId;

    // Start new conversation if none active
    if (!conversationId) {
      const newId = await chat.startNewConversation(
        auth.user?.id,
        auth.guestId || undefined
      );
      if (!newId) return;
      conversationId = newId;
    }

    await chat.sendMessage(text, conversationId);
    utils.conversation.list.invalidate();
  }, [inputValue, chat, auth, utils]);

  // Handle key press (Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle voice input
  const toggleVoiceInput = () => {
    if (voiceInput.isListening) {
      const text = voiceInput.stopListening();
      if (text) {
        setInputValue(text);
      }
    } else {
      voiceInput.startListening();
    }
  };

  // Handle text-to-speech
  const speakMessage = (content: string, messageId: number) => {
    if (voiceOutput.isSpeaking && speakingMessageId === messageId) {
      voiceOutput.stop();
      setSpeakingMessageId(null);
    } else {
      // Strip markdown-like formatting for speech
      const cleanText = content.replace(/[#*_`]/g, "");
      voiceOutput.speak(cleanText);
      setSpeakingMessageId(messageId);
    }
  };

  // Load conversation from sidebar
  const loadConversation = async (id: number) => {
    const conv = await utils.conversation.getById.fetch({ id });
    if (conv) {
      chat.loadConversation({
        id: conv.id,
        messages: conv.messages.map((m) => ({
          ...m,
          structuredContent: m.structuredContent || undefined,
        })),
      });
      setSidebarOpen(false);
    }
  };

  // Start new chat
  const handleNewChat = async () => {
    chat.clearMessages();
    setSidebarOpen(false);
  };

  // Parse structured content
  const parseStructured = (json: string): StructuredResponse | null => {
    try {
      return JSON.parse(json) as StructuredResponse;
    } catch {
      return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col max-w-[430px] mx-auto border-x border-[#E5E5E5]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 bg-white border-b border-[#E5E5E5] shrink-0 z-20">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#F2F4F7] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-[#202123]" />
        </button>

        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="LawBot" className="w-7 h-7" />
          <h1 className="text-base font-semibold text-[#202123]">LawBot</h1>
        </div>

        <button
          onClick={() => setProfileOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#F2F4F7] transition-colors"
          aria-label="Profile"
        >
          {auth.user?.avatar ? (
            <img src={auth.user.avatar} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <User className="w-5 h-5 text-[#202123]" />
          )}
        </button>
      </header>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-y-contain">
        {chat.messages.length === 0 ? (
          /* Onboarding State */
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-16 h-16 mb-5">
              <img src="/logo.png" alt="LawBot" className="w-full h-full" />
            </div>
            <h2 className="text-xl font-semibold text-[#202123] mb-2 text-center">
              How can I help you today?
            </h2>
            <p className="text-sm text-[#6E6E80] text-center mb-8 max-w-[300px]">
              Ask me anything about Indian law in Hindi, Hinglish, or English.
            </p>

            {/* Quick suggestions */}
            <div className="w-full space-y-2">
              {[
                { text: "Police ne meri bike le li kya karu?", icon: "🚓" },
                { text: "Salary 3 mahine se nahi mili", icon: "💰" },
                { text: "Mere landlord mujhe ghar se nikal rahe hain", icon: "🏠" },
                { text: "I received a legal notice. What should I do?", icon: "📄" },
              ].map((suggestion) => (
                <button
                  key={suggestion.text}
                  onClick={() => {
                    setInputValue(suggestion.text);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left p-3.5 bg-[#F2F4F7] hover:bg-[#E8EAED] rounded-xl text-sm text-[#202123] transition-colors flex items-center gap-3"
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  <span className="line-clamp-1">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="px-4 py-4 space-y-5">
            {chat.messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  /* User Message */
                  <div className="flex justify-end">
                    <div className="bg-[#F2F4F7] rounded-[18px] rounded-tr-[4px] px-4 py-3 max-w-[85%]">
                      <p className="text-[15px] text-[#202123] leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* AI Message */
                  <div className="flex gap-3">
                    {/* AI Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[#10A37F] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-sm font-semibold">L</span>
                    </div>

                    {/* AI Content */}
                    <div className="flex-1 min-w-0">
                      {message.structuredContent ? (
                        <StructuredMessage
                          data={parseStructured(message.structuredContent)}
                          rawContent={message.content}
                        />
                      ) : (
                        <div className="text-[15px] text-[#202123] leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}

                      {/* Listen Button */}
                      <button
                        onClick={() => speakMessage(message.content, message.id)}
                        className="mt-2 flex items-center gap-1.5 text-xs text-[#6E6E80] hover:text-[#10A37F] transition-colors"
                      >
                        {voiceOutput.isSpeaking && speakingMessageId === message.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Skeleton */}
            {chat.isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#10A37F] flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-semibold">L</span>
                </div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-[#F2F4F7] rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-[#F2F4F7] rounded animate-pulse w-full" />
                  <div className="h-4 bg-[#F2F4F7] rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-[#F2F4F7] rounded animate-pulse w-2/3" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="shrink-0 px-4 py-3 bg-white border-t border-[#E5E5E5]">
        <div className="flex items-center gap-2 bg-[#F2F4F7] rounded-full px-4 py-1 border border-[#D9D9E3] focus-within:border-[#10A37F] transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a legal question..."
            className="flex-1 bg-transparent border-none outline-none text-[16px] text-[#202123] placeholder:text-[#6E6E80] py-2.5 min-w-0"
          />

          {inputValue.trim() ? (
            <button
              onClick={handleSend}
              disabled={chat.isLoading}
              className="w-9 h-9 bg-[#10A37F] hover:bg-[#1AAD85] rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0"
            >
              <ArrowUp className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={toggleVoiceInput}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                voiceInput.isListening
                  ? "bg-red-500 animate-pulse"
                  : "hover:bg-[#E8EAED]"
              }`}
            >
              {voiceInput.isListening ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-[#6E6E80]" />
              )}
            </button>
          )}
        </div>

        {/* Voice recording indicator */}
        {voiceInput.isListening && (
          <p className="text-xs text-center text-[#10A37F] mt-2 animate-pulse">
            Listening... Tap mic to stop
          </p>
        )}
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[80%] max-w-[340px] bg-white z-50 shadow-xl transform transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRadius: "0 16px 16px 0" }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#E5E5E5]">
          <button
            onClick={handleNewChat}
            className="w-full h-12 bg-[#10A37F] hover:bg-[#1AAD85] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3">
          {conversationList && conversationList.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#6E6E80] uppercase tracking-wide px-2 mb-2">
                Recent
              </p>
              {conversationList.map((conv) => (
                <div
                  key={conv.id}
                  className="group flex items-center gap-2 p-2.5 rounded-lg hover:bg-[#F2F4F7] transition-colors cursor-pointer"
                  onClick={() => loadConversation(conv.id)}
                >
                  <MessageSquare className="w-4 h-4 text-[#6E6E80] shrink-0" />
                  <span className="text-sm text-[#202123] line-clamp-1 flex-1">
                    {conv.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation.mutate({ id: conv.id });
                      if (chat.activeConversationId === conv.id) {
                        chat.clearMessages();
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-[#D9D9E3] mx-auto mb-2" />
              <p className="text-sm text-[#6E6E80]">No conversations yet</p>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E5E5E5] space-y-1">
          <button
            onClick={() => {
              setSidebarOpen(false);
              setSettingsOpen(true);
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F2F4F7] transition-colors text-left"
          >
            <Settings className="w-4 h-4 text-[#202123]" />
            <span className="text-sm text-[#202123]">Settings</span>
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              setProfileOpen(true);
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F2F4F7] transition-colors text-left"
          >
            <HelpCircle className="w-4 h-4 text-[#202123]" />
            <span className="text-sm text-[#202123]">Help & About</span>
          </button>
        </div>
      </div>

      {/* Profile / Help Modal */}
      {profileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-in fade-in"
            onClick={() => setProfileOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-w-[430px] mx-auto animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="w-10 h-1 bg-[#E5E5E5] rounded-full mx-auto mt-3 mb-4" />

            <div className="px-5 pb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-[#202123]">Profile</h2>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F2F4F7]"
                >
                  <X className="w-5 h-5 text-[#202123]" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-[#F2F4F7] rounded-xl">
                <div className="w-14 h-14 rounded-full bg-[#10A37F] flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    {auth.user?.name?.charAt(0).toUpperCase() ||
                      auth.user?.email?.charAt(0).toUpperCase() ||
                      "G"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-[#202123]">
                    {auth.user?.name || "Guest User"}
                  </p>
                  <p className="text-sm text-[#6E6E80]">
                    {auth.user?.email || "Using as guest"}
                  </p>
                </div>
              </div>

              {/* About */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 bg-[#F2F4F7] rounded-xl">
                  <Shield className="w-5 h-5 text-[#10A37F] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#202123]">About LawBot</p>
                    <p className="text-xs text-[#6E6E80] mt-1">
                      LawBot is an AI-powered legal assistant designed to help Indian citizens
                      understand their legal rights. It provides information based on the
                      Constitution of India, BNS, BNSS, and BSA.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#F2F4F7] rounded-xl">
                  <Globe className="w-5 h-5 text-[#10A37F] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#202123]">Languages</p>
                    <p className="text-xs text-[#6E6E80] mt-1">
                      LawBot supports Hindi, Hinglish, and English. Just type in your preferred
                      language.
                    </p>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              {auth.isAuthenticated && (
                <Button
                  variant="outline"
                  className="w-full h-11 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl"
                  onClick={auth.logout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              )}

              {!auth.isAuthenticated && (
                <p className="text-xs text-[#6E6E80] text-center">
                  Guest sessions are temporary. Sign in to save your chat history permanently.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-in fade-in"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-w-[430px] mx-auto animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="w-10 h-1 bg-[#E5E5E5] rounded-full mx-auto mt-3 mb-4" />

            <div className="px-5 pb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-[#202123]">Settings</h2>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F2F4F7]"
                >
                  <X className="w-5 h-5 text-[#202123]" />
                </button>
              </div>

              {/* Settings Groups */}
              <div className="space-y-4">
                {/* Voice Settings */}
                <div>
                  <p className="text-xs font-medium text-[#6E6E80] uppercase tracking-wide mb-2">
                    Voice
                  </p>
                  <div className="bg-[#F2F4F7] rounded-xl divide-y divide-[#E5E5E5]">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-[#202123]" />
                        <span className="text-sm text-[#202123]">Text-to-Speech</span>
                      </div>
                      <span className="text-xs text-[#10A37F]">
                        {voiceOutput.isSupported ? "Available" : "Not supported"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Mic className="w-4 h-4 text-[#202123]" />
                        <span className="text-sm text-[#202123]">Voice Input</span>
                      </div>
                      <span className="text-xs text-[#10A37F]">
                        {voiceInput.isSupported ? "Available" : "Not supported"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legal Sources */}
                <div>
                  <p className="text-xs font-medium text-[#6E6E80] uppercase tracking-wide mb-2">
                    Legal Sources
                  </p>
                  <div className="bg-[#F2F4F7] rounded-xl p-4 space-y-2">
                    {[
                      "Constitution of India",
                      "Bharatiya Nyaya Sanhita (BNS) 2023",
                      "Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023",
                      "Bharatiya Sakshya Adhiniyam (BSA) 2023",
                    ].map((source) => (
                      <div key={source} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10A37F] shrink-0" />
                        <span className="text-sm text-[#202123]">{source}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="p-4 bg-[#FFF8E1] rounded-xl">
                  <p className="text-xs text-[#8B6914] leading-relaxed">
                    <strong>Disclaimer:</strong> LawBot provides educational information only and
                    should not be considered professional legal advice. Always consult a qualified
                    lawyer for specific legal matters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Structured Message Component
function StructuredMessage({
  data,
  rawContent,
}: {
  data: StructuredResponse | null;
  rawContent: string;
}) {
  if (!data) {
    return (
      <div className="text-[15px] text-[#202123] leading-relaxed whitespace-pre-wrap">
        {rawContent}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Understanding */}
      {data.understanding && (
        <div>
          <h3 className="text-sm font-semibold text-[#10A37F] mb-1">
            Understanding Your Situation
          </h3>
          <p className="text-[15px] text-[#202123] leading-relaxed">
            {data.understanding}
          </p>
        </div>
      )}

      {/* Explanation */}
      {data.explanation && (
        <div>
          <h3 className="text-sm font-semibold text-[#10A37F] mb-1">Explanation</h3>
          <p className="text-[15px] text-[#202123] leading-relaxed">
            {data.explanation}
          </p>
        </div>
      )}

      {/* Actionable Steps */}
      {data.actionableSteps && data.actionableSteps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#10A37F] mb-2">
            What You Can Do
          </h3>
          <ol className="space-y-1.5">
            {data.actionableSteps.map((step, i) => (
              <li key={i} className="flex gap-2 text-[15px] text-[#202123] leading-relaxed">
                <span className="text-[#10A37F] font-medium shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Legal References */}
      {data.legalReferences && data.legalReferences.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#10A37F] mb-2">
            Relevant Legal References
          </h3>
          <div className="space-y-1.5">
            {data.legalReferences.map((ref, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 mr-2 mb-1.5 px-2.5 py-1 bg-[#E6F9F4] rounded-lg"
              >
                <span className="text-xs font-medium text-[#10A37F]">
                  {ref.name} {ref.section}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6E6E80] mt-1">
            {data.legalReferences.map((r) => r.description).join(" | ")}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      {data.disclaimer && (
        <div className="pt-2 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#6E6E80] italic">{data.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
