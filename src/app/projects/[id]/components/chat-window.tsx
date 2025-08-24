"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, MessageCircle, User, Bot } from "lucide-react";
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
  onStreamingFileStart?: (fileId: string, fileName: string, language: string) => void;
  onStreamingFileChunk?: (fileId: string, content: string) => void;
  onStreamingFileComplete?: (fileId: string) => void;
}

interface StreamMessage {
  type: 'user_message' | 'status' | 'chunk' | 'complete' | 'error' | 'file_start' | 'file_chunk' | 'file_complete';
  message?: ChatMessage;
  content?: string;
  codeGenerated?: boolean;
  filesCount?: number;
  error?: string;
  details?: string;
  fileName?: string;
  fileType?: string;
  language?: string;
  artifactId?: string;
}

const stageConfig = {
  [StageType.PLANNING]: { name: "Planning", icon: "📋" },
  [StageType.DESIGN]: { name: "Design", icon: "🎨" },
  [StageType.DEVELOPMENT]: { name: "Development", icon: "💻" },
  [StageType.TESTING]: { name: "Testing", icon: "🧪" },
  [StageType.DEPLOYMENT]: { name: "Deployment", icon: "🚀" },
};

export function ChatWindow({ projectId, stageType, onStreamingFileStart, onStreamingFileChunk, onStreamingFileComplete }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingFiles, setStreamingFiles] = useState<{[key: string]: {fileName: string, content: string, language: string}}>({});
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

    // Add user message immediately
    setMessages((m) => [...m, userMsg]);
    
    const content = input.trim();
    setInput("");
    setLoading(true);

    // Add a streaming assistant message placeholder
    const streamingId = `streaming-${Date.now()}`;
    const streamingMsg: ChatMessage = {
      id: streamingId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    
    setMessages((m) => [...m, streamingMsg]);

    // Check if browser supports streaming
    const supportsStreaming = typeof EventSource !== 'undefined' && typeof ReadableStream !== 'undefined';
    
    if (supportsStreaming) {
      try {
        // Use dedicated streaming endpoint
        const response = await fetch(`/api/projects/${projectId}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, stageType }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: StreamMessage = JSON.parse(line.slice(6));
                
                switch (data.type) {
                  case 'user_message':
                    // User message already added, might update with server version
                    if (data.message) {
                      setMessages((m) => 
                        m.map(msg => msg.id === tempId ? data.message! : msg)
                      );
                    }
                    break;
                    
                  case 'status':
                    // Update the streaming message with status
                    if (data.content) {
                      setMessages((m) => 
                        m.map(msg => 
                          msg.id === streamingId 
                            ? { ...msg, content: `*${data.content}*` }
                            : msg
                        )
                      );
                    }
                    break;
                    
                  case 'file_start':
                    // Start tracking a new streaming file
                    if (data.fileName && data.language) {
                      const fileId = `file_${Date.now()}`;
                      console.log('ChatWindow: file_start', { fileId, fileName: data.fileName, language: data.language });
                      
                      setStreamingFiles(prev => ({
                        ...prev,
                        [fileId]: {
                          fileName: data.fileName!,
                          content: '',
                          language: data.language!
                        }
                      }));
                      
                      // Notify parent component about streaming file start
                      console.log('ChatWindow: Calling onStreamingFileStart');
                      onStreamingFileStart?.(fileId, data.fileName, data.language);
                      
                      // Update message to show file is starting
                      setMessages((m) => 
                        m.map(msg => 
                          msg.id === streamingId 
                            ? { 
                                ...msg, 
                                content: `📝 **Creating ${data.fileName}...**\n\n\`\`\`${data.language}\n\n\`\`\`` 
                              }
                            : msg
                        )
                      );
                    }
                    break;
                    
                  case 'file_chunk':
                    // Add content to the streaming file
                    if (data.content) {
                      // Find the current streaming file (assume latest one)
                      const fileIds = Object.keys(streamingFiles);
                      if (fileIds.length > 0) {
                        const latestFileId = fileIds[fileIds.length - 1];
                        const currentFile = streamingFiles[latestFileId];
                        
                        if (currentFile) {
                          const updatedContent = currentFile.content + data.content;
                          
                          setStreamingFiles(prev => ({
                            ...prev,
                            [latestFileId]: {
                              ...currentFile,
                              content: updatedContent
                            }
                          }));
                          
                          // Notify parent component about content chunk
                          console.log('ChatWindow: Calling onStreamingFileChunk', { fileId: latestFileId, contentLength: data.content.length });
                          onStreamingFileChunk?.(latestFileId, data.content);
                          
                          // Update the message with real-time content
                          setMessages((m) => 
                            m.map(msg => 
                              msg.id === streamingId 
                                ? { 
                                    ...msg, 
                                    content: `📝 **Creating ${currentFile.fileName}...**\n\n\`\`\`${currentFile.language}\n${updatedContent}\n\`\`\`` 
                                  }
                                : msg
                            )
                          );
                        }
                      }
                    }
                    break;
                    
                  case 'file_complete':
                    // File generation completed
                    if (data.artifactId && data.message) {
                      // Get the current streaming file ID to notify parent
                      const fileIds = Object.keys(streamingFiles);
                      const latestFileId = fileIds[fileIds.length - 1];
                      
                      // Notify parent component about completion
                      if (latestFileId) {
                        onStreamingFileComplete?.(latestFileId);
                      }
                      
                      // Clear streaming files
                      setStreamingFiles({});
                      
                      // Update message to show completion
                      setMessages((m) => 
                        m.map(msg => 
                          msg.id === streamingId 
                            ? { 
                                ...msg, 
                                content: `✅ **${data.message}**\n\nFile has been generated and saved to the project. You can view it in the file explorer on the right.` 
                              }
                            : msg
                        )
                      );
                    }
                    break;
                    
                  case 'chunk':
                    // Append content to streaming message
                    if (data.content) {
                      streamedContent += data.content;
                      setMessages((m) => 
                        m.map(msg => 
                          msg.id === streamingId 
                            ? { ...msg, content: streamedContent }
                            : msg
                        )
                      );
                    }
                    break;
                    
                  case 'complete':
                    // Replace streaming message with final server message
                    if (data.message) {
                      setMessages((m) => 
                        m.filter(msg => msg.id !== streamingId).concat([data.message!])
                      );
                      
                      // Handle code generation completion
                      if (data.codeGenerated) {
                        toast({
                          title: "Code Generated!",
                          description: `Generated ${data.filesCount} files. File viewer updated.`,
                        });
                        router.refresh();
                      }
                    }
                    break;
                    
                  case 'error':
                    throw new Error(data.error || 'Stream error');
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }

      } catch (error) {
        console.error('Streaming error:', error);
        toast({
          title: "Chat failed",
          description: error instanceof Error ? error.message : "Error",
          variant: "destructive",
        });
        
        // Clean up streaming state
        setStreamingFiles({});
        // Remove the failed streaming message
        setMessages((m) => m.filter(msg => msg.id !== streamingId));
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to non-streaming POST for older browsers
      try {
        // Show loading message
        setMessages((m) => 
          m.map(msg => 
            msg.id === streamingId 
              ? { ...msg, content: "Processing your request..." }
              : msg
          )
        );

        const res = await fetch(`/api/projects/${projectId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, stageType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");

        setMessages((m) =>
          m.filter((x) => x.id !== tempId && x.id !== streamingId).concat(data.messages)
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
        setMessages((m) => m.filter((x) => x.id !== tempId && x.id !== streamingId));
      } finally {
        setLoading(false);
      }
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
