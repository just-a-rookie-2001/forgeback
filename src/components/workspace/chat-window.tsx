"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ChatWindowProps {
  projectId: string;
  onToggleCode?: () => void;
  codeVisible: boolean;
}

export function ChatWindow({
  projectId,
  onToggleCode,
  codeVisible,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } catch {
      /* ignore */
    }
  }, [projectId]);

  useEffect(() => {
    loadHistory();
  }, [projectId]);
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

    if (looksLikeCodeRequest) {
      setGeneratingCode(true);
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/smart-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
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
      setGeneratingCode(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[75vh] flex-col overflow-scroll border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Smart Assistant {generatingCode && "(Generating Code...)"}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCode}
          title={codeVisible ? "Hide code panel" : "Show code panel"}
        >
          {codeVisible ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}
            >
              {m.role === "assistant"
                ? m.content // Don't filter assistant content anymore since we control it in the backend
                : m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me to generate code or discuss architecture..."
            className="min-h-[60px] flex-1 resize-y"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="self-stretch"
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
  );
}
