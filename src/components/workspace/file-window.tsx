"use client";

import { Artifact, StageType } from "@prisma/client";
import { FileContentViewer } from "./file-content-viewer";
import { FileBrowserViewer } from "./file-browser-viewer";

interface ArtifactWithLanguage extends Artifact {
  language?: string;
}

interface FileWindowProps {
  files: (ArtifactWithLanguage & { stageType?: StageType })[];
  activeFileId: string;
  onFileSelect: (fileId: string) => void;
  projectId: string;
  onFileDeleted?: (fileId: string) => void;
  onFileRenamed?: (fileId: string, newName: string) => void;
}

export function FileWindow({
  files,
  activeFileId,
  onFileSelect,
  projectId,
  onFileDeleted,
  onFileRenamed,
}: FileWindowProps) {
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No files available yet.</p>
          <p className="text-sm">
            Start chatting to generate files and artifacts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* File Browser */}
      <FileBrowserViewer
        files={files}
        activeFileId={activeFileId}
        onFileSelect={onFileSelect}
        projectId={projectId}
        onFileDeleted={onFileDeleted}
        onFileRenamed={onFileRenamed}
      />

      {/* File Content Viewer */}
      <FileContentViewer activeFile={activeFile} />
    </div>
  );
}
