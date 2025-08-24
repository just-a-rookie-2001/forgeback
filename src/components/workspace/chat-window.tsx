"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, MessageCircle, User, Bot, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { StageType } from "@prisma/client";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ChatWindowProps {
  projectId: string;
  stageType: StageType;
}

const stageConfig = {
  [StageType.PLANNING]: { name: "Planning", icon: "📋" },
  [StageType.DESIGN]: { name: "Design", icon: "🎨" },
  [StageType.DEVELOPMENT]: { name: "Development", icon: "💻" },
  [StageType.TESTING]: { name: "Testing", icon: "🧪" },
  [StageType.DEPLOYMENT]: { name: "Deployment", icon: "🚀" },
};

export function ChatWindow({ projectId, stageType }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/chat?stage=${stageType}`
      );
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } catch {
      /* ignore */
    }
  }, [projectId, stageType]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const tempId = `temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempId,
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    // Detect if this looks like a code generation request
    const looksLikeCodeRequest =
      /\b(generate|create|add|implement|build|write|code|function|endpoint|api|route|model|fix|update)\b/i.test(
        input
      );

    const pendingMessage = looksLikeCodeRequest
      ? "Analyzing your request and generating code..."
      : "…";

    setMessages((m) => [
      ...m,
      userMsg,
      {
        id: tempId + "-pending",
        role: "assistant",
        content: pendingMessage,
        createdAt: new Date().toISOString(),
      },
    ]);
    const content = input.trim();
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, stageType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setMessages((m) =>
        m.filter((x) => !x.id.startsWith(tempId)).concat(data.messages)
      );

      // If code was generated, refresh the page to update the file viewer
      if (data.codeGenerated) {
        toast({
          title: "Code Generated!",
          description: `Generated ${data.filesCount} files. File viewer updated.`,
        });
        router.refresh();
      }
    } catch (e) {
      toast({
        title: "Chat failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
      setMessages((m) => m.filter((x) => !x.id.startsWith(tempId)));
    } finally {
      setLoading(false);
    }
  };

  const currentStage = stageConfig[stageType];

  return (
    <div className="flex h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <div className="flex flex-col w-full min-w-0">
        {/* Header */}
        <div className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <MessageCircle className="h-4 w-4" />
          <span className="truncate">{currentStage.name} Chat</span>
          <span className="ml-auto text-[10px] font-normal text-gray-500 dark:text-gray-400">
            {messages.length}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-8">
              Start chatting in the {currentStage.name.toLowerCase()}{" "}
              environment...
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex gap-3 group">
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    m.role === "user"
                      ? "bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-200"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {m.role === "user" ? "You" : "Assistant"}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={`text-sm p-3 rounded-lg ${
                      m.role === "user"
                        ? "bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-600/30"
                        : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                      {m.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask for ${currentStage.name.toLowerCase()} help...`}
                className="min-h-[40px] max-h-32 field-sizing-content pr-10 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={loading}
                rows={1}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="sm"
                className="absolute right-1 bottom-1 h-8 w-8 p-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
