"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "@/components/ui/resizable";
import { ChatWindow } from "./chat-window";
import { FileBrowserViewer } from "./file-browser-viewer";
import {
  Project,
  Stage,
  Artifact,
  File as DbFile,
  StageType,
} from "@prisma/client";

type FullProject = Project & {
  stages: (Stage & {
    artifacts: Artifact[];
  })[];
  files: (DbFile & { stageType?: StageType })[];
};

interface WorkspaceGridProps {
  project: FullProject;
  activeStage: StageType;
}

export function WorkspaceGrid({ project, activeStage }: WorkspaceGridProps) {
  const [activeFileId, setActiveFileId] = useState<string>("");

  // Convert stages and files to unified file items
  const allFiles: (DbFile & { stageType?: StageType })[] = useMemo(
    () => [
      // Add artifacts as files
      ...project.stages.flatMap((stage) =>
        stage.artifacts.map((artifact) => ({
          id: artifact.id,
          filename: artifact.name,
          content: artifact.content,
          type: artifact.type,
          language: artifact.type === "code" ? "typescript" : "markdown",
          stageType: stage.type,
          createdAt: artifact.createdAt,
          projectId: project.id,
        }))
      ),
    ],
    [project.id, project.stages]
  );

  const stageFiles = allFiles.filter((f) => f.stageType === activeStage);

  // Sync active file when stage changes
  useEffect(() => {
    const stageFiles = allFiles.filter((f) => f.stageType === activeStage);
    if (!activeFileId || !stageFiles.find((f) => f.id === activeFileId)) {
      setActiveFileId(stageFiles[0]?.id || "");
    }
  }, [activeStage, allFiles, activeFileId]);

  return (
    <PanelGroup direction="horizontal" className="flex-grow gap-1 max-h-[80vh]">
      <Panel defaultSize={40} minSize={20}>
        <ChatWindow projectId={project.id} stageType={activeStage} />
      </Panel>
      <PanelResizeHandle />
      <Panel defaultSize={60} minSize={30}>
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
          {stageFiles.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">
                  No files for{" "}
                  {activeStage.charAt(0) + activeStage.slice(1).toLowerCase()}{" "}
                  stage yet.
                </p>
                <p className="text-sm">
                  Start chatting to generate files and artifacts.
                </p>
              </div>
            </div>
          ) : (
            <FileBrowserViewer
              files={stageFiles}
              activeFileId={activeFileId}
              onFileSelect={setActiveFileId}
            />
          )}
        </div>
      </Panel>
    </PanelGroup>
  );
}
