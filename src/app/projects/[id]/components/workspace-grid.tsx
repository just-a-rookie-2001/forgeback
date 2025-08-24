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
  language: string;
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
  const [streamingFiles, setStreamingFiles] = useState<{[key: string]: {
    id: string;
    name: string;
    content: string;
    language: string;
    stageType: StageType;
    isStreaming: boolean;
  }}>({});
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render trigger

  // Convert stages and artifacts to unified file items, including streaming files
  const allFiles: ArtifactAsFile[] = useMemo(
    () => {
      const artifactFiles = projectData.stages.flatMap((stage) =>
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
      );
      
      const streamingFilesList = Object.values(streamingFiles).map((streamingFile) => ({
        id: streamingFile.id,
        name: streamingFile.name + (streamingFile.isStreaming ? " (streaming...)" : ""),
        content: streamingFile.content,
        type: "streaming",
        language: streamingFile.language,
        stageType: streamingFile.stageType,
        createdAt: new Date(),
        updatedAt: new Date(),
        stageId: "streaming",
      }));
      
      console.log('WorkspaceGrid: artifactFiles', artifactFiles.length, 'streamingFiles', streamingFilesList.length);
      
      return [...artifactFiles, ...streamingFilesList];
    },
    [projectData.stages, streamingFiles, forceUpdate] // Add forceUpdate to dependency
  );

  const stageFiles = allFiles.filter((f) => f.stageType === activeStage);
  
  console.log('WorkspaceGrid: stageFiles for', activeStage, ':', stageFiles.length, stageFiles.map(f => f.name));

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

  const handleStreamingFileStart = (fileId: string, fileName: string, language: string) => {
    console.log('WorkspaceGrid: handleStreamingFileStart', { fileId, fileName, language, activeStage });
    setStreamingFiles(prev => {
      const updated = {
        ...prev,
        [fileId]: {
          id: fileId,
          name: fileName,
          content: '',
          language,
          stageType: activeStage,
          isStreaming: true
        }
      };
      console.log('WorkspaceGrid: Updated streamingFiles', updated);
      return updated;
    });
    
    // Force re-render
    setForceUpdate(prev => prev + 1);
    
    // Auto-select streaming file
    setActiveFileId(fileId);
    console.log('WorkspaceGrid: Set activeFileId to', fileId);
  };

  const handleStreamingFileChunk = (fileId: string, content: string) => {
    console.log('WorkspaceGrid: handleStreamingFileChunk', { fileId, contentLength: content.length });
    setStreamingFiles(prev => ({
      ...prev,
      [fileId]: prev[fileId] ? {
        ...prev[fileId],
        content: prev[fileId].content + content
      } : {
        id: fileId,
        name: 'Streaming File',
        content: content,
        language: 'markdown',
        stageType: activeStage,
        isStreaming: true
      }
    }));
    
    // Force re-render
    setForceUpdate(prev => prev + 1);
  };

  const handleStreamingFileComplete = (fileId: string) => {
    setStreamingFiles(prev => {
      const newFiles = { ...prev };
      if (newFiles[fileId]) {
        newFiles[fileId].isStreaming = false;
      }
      return newFiles;
    });
    
    // Clear streaming files after a short delay and refresh project data
    setTimeout(() => {
      setStreamingFiles({});
      // Trigger a refetch of project data
      window.location.reload();
    }, 2000);
  };

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
        <ChatWindow 
          projectId={project.id} 
          stageType={activeStage}
          onStreamingFileStart={handleStreamingFileStart}
          onStreamingFileChunk={handleStreamingFileChunk}
          onStreamingFileComplete={handleStreamingFileComplete}
        />
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
