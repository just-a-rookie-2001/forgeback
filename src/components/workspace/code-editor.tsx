"use client";

import { Artifact } from "@prisma/client";
import Editor from "@monaco-editor/react";

interface ArtifactWithLanguage extends Artifact {
  language?: string;
}

interface CodeEditorProps {
  file: ArtifactWithLanguage;
  wrap?: boolean;
}

export function CodeEditor({ file, wrap = false }: CodeEditorProps) {
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a file to view its content
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language={file.language || "javascript"}
      value={file.content}
      theme="vs-dark"
      options={{
        readOnly: false,
        minimap: { enabled: false },
        wordWrap: wrap ? "on" : "off",
      }}
    />
  );
}
