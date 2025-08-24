"use client";

import { useState } from "react";
import { Copy, FileCode2, WrapText, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Artifact, StageType } from "@prisma/client";
import { CodeEditor } from "./code-editor";

interface FileContentViewerProps {
  activeFile: (Artifact & { stageType?: StageType }) | undefined;
}

export function FileContentViewer({ activeFile }: FileContentViewerProps) {
  const [wrap, setWrap] = useState(false);
  const { toast } = useToast();

  const copyFile = async () => {
    if (activeFile) {
      await navigator.clipboard.writeText(activeFile.content);
      toast({ title: "Copied", description: "File content copied." });
    }
  };

  if (!activeFile) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs gap-3">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 min-w-0">
          <FileCode2 className="h-4 w-4 shrink-0" />
          <span
            className="font-mono truncate max-w-[400px]"
            title={activeFile.name}
          >
            {activeFile.name}
          </span>
          {activeFile.language && (
            <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-[10px] tracking-wide shrink-0">
              {activeFile.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWrap((w) => !w)}
            title={wrap ? "Disable wrapping" : "Enable wrapping"}
          >
            {wrap ? (
              <ScanText className="h-4 w-4" />
            ) : (
              <WrapText className="h-4 w-4" />
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={copyFile}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeEditor file={activeFile} wrap={wrap}/>
      </div>
    </div>
  );
}
