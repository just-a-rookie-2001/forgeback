"use client";

import { Artifact } from "@prisma/client";
import Editor from "@monaco-editor/react";
import { detectOptimalLanguage, cleanCodeContent } from "@/lib/language-utils";

interface CodeEditorProps {
  file: Artifact;
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

  // Detect the optimal language for Monaco editor
  const detectedLanguage = detectOptimalLanguage(file.name, file.language);
  
  // Clean the content to remove any markdown code blocks or artifacts
  const cleanedContent = cleanCodeContent(file.content, detectedLanguage);

  return (
    <Editor
      height="100%"
      language={detectedLanguage}
      value={cleanedContent}
      theme="vs-dark"
      options={{
        readOnly: false,
        minimap: { enabled: false },
        wordWrap: wrap ? "on" : "off",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: "on",
        renderWhitespace: "boundary",
        tabSize: 2,
        insertSpaces: true,
      }}
    />
  );
}
