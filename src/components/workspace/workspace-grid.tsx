"use client";
import { useState } from "react";
import { FileBrowserViewer } from "@/components/workspace/file-browser-viewer";
import { ChatWindow } from "@/components/workspace/chat-window";
import { cn } from "@/lib/utils";

// Client wrapper for two-column workspace
interface WorkspaceProject {
  id: string;
  files: Array<{
    id: string;
    filename: string;
    content: string;
    language: string;
    type: string;
  }>;
}

export function WorkspaceGrid({ project }: { project: WorkspaceProject }) {
  const [showCode, setShowCode] = useState(true);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[60vh]">
      <div className="flex flex-col col-span-1">
        <ChatWindow
          projectId={project.id}
          codeVisible={showCode}
          onToggleCode={() => setShowCode((v) => !v)}
        />
      </div>
      <div className={cn('col-span-2', showCode ? "block" : "hidden lg:block")}>
        <FileBrowserViewer files={project.files} hidden={!showCode} />
      </div>
    </div>
  );
}
