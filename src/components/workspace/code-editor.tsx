"use client"

import { File as DbFile } from "@prisma/client";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  file: DbFile;
}

export function CodeEditor({ file }: CodeEditorProps) {
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
      language={file.language}
      value={file.content}
      theme="vs-dark"
      options={{
        readOnly: false,
        minimap: { enabled: false },
      }}
    />
  );
}
