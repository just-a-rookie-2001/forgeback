"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "@/components/ui/resizable";
import { ChatWindow } from "./chat-window";
import { FileWindow } from "./file-window";
import {
  Project,
  Stage,
  Artifact,
  StageType,
} from "@prisma/client";

type ArtifactAsFile = {
  id: string;
  name: string;
  content: string;
  type: string;
  language?: string;
  stageType: StageType;
  createdAt: Date;
  updatedAt: Date;
  stageId: string;
};

type FullProject = Project & {
  stages: (Stage & {
    artifacts: Artifact[];
  })[];
};

interface WorkspaceGridProps {
  project: FullProject;
  activeStage: StageType;
}

export function WorkspaceGrid({ project, activeStage }: WorkspaceGridProps) {
  const [activeFileId, setActiveFileId] = useState<string>("");
  const [projectData, setProjectData] = useState(project);

  // Convert stages and artifacts to unified file items
  const allFiles: ArtifactAsFile[] = useMemo(
    () => [
      // Add artifacts as files
      ...projectData.stages.flatMap((stage) =>
        stage.artifacts.map((artifact) => ({
          id: artifact.id,
          name: artifact.name,
          content: artifact.content,
          type: artifact.type,
          language: (artifact as Artifact & {language?: string}).language || (artifact.type === "code" ? "typescript" : "markdown"),
          stageType: stage.type,
          createdAt: artifact.createdAt,
          updatedAt: artifact.updatedAt,
          stageId: artifact.stageId,
        }))
      ),
    ],
    [projectData.stages]
  );

  const stageFiles = allFiles.filter((f) => f.stageType === activeStage);

  // Sync active file when stage changes
  useEffect(() => {
    const stageFiles = allFiles.filter((f) => f.stageType === activeStage);
    if (!activeFileId || !stageFiles.find((f) => f.id === activeFileId)) {
      setActiveFileId(stageFiles[0]?.id || "");
    }
  }, [activeStage, allFiles, activeFileId]);

  // Update project data when props change
  useEffect(() => {
    setProjectData(project);
  }, [project]);

  const handleFileDeleted = (fileId: string) => {
    // Update local state
    setProjectData(prevProject => ({
      ...prevProject,
      stages: prevProject.stages.map(stage => ({
        ...stage,
        artifacts: stage.artifacts.filter(artifact => artifact.id !== fileId)
      }))
    }));

    // If the deleted file was active, select another file
    if (activeFileId === fileId) {
      const remainingFiles = stageFiles.filter(f => f.id !== fileId);
      setActiveFileId(remainingFiles[0]?.id || "");
    }
  };

  const handleFileRenamed = (fileId: string, newName: string) => {
    // Update local state
    setProjectData(prevProject => ({
      ...prevProject,
      stages: prevProject.stages.map(stage => ({
        ...stage,
        artifacts: stage.artifacts.map(artifact => 
          artifact.id === fileId 
            ? { ...artifact, name: newName }
            : artifact
        )
      }))
    }));
  };

  return (
    <PanelGroup direction="horizontal" className="flex-grow gap-1 min-h-[60vh] max-h-[80vh]">
      <Panel defaultSize={30} minSize={20}>
        <ChatWindow projectId={project.id} stageType={activeStage} />
      </Panel>
      <PanelResizeHandle />
      <Panel defaultSize={70} minSize={30}>
        <FileWindow
          files={stageFiles}
          activeFileId={activeFileId}
          onFileSelect={setActiveFileId}
          projectId={projectData.id}
          onFileDeleted={handleFileDeleted}
          onFileRenamed={handleFileRenamed}
        />
      </Panel>
    </PanelGroup>
  );
}
