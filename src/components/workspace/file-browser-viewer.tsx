"use client";

import { useState } from "react";
import { 
  Folder, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Check, 
  X 
} from "lucide-react";
import { Artifact, StageType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ArtifactWithLanguage extends Artifact {
  language?: string;
}

interface FileBrowserViewerProps {
  files: (ArtifactWithLanguage & { stageType?: StageType })[];
  activeFileId: string;
  onFileSelect: (fileId: string) => void;
  projectId: string;
  onFileDeleted?: (fileId: string) => void;
  onFileRenamed?: (fileId: string, newName: string) => void;
}

export function FileBrowserViewer({
  files,
  activeFileId,
  onFileSelect,
  projectId,
  onFileDeleted,
  onFileRenamed,
}: FileBrowserViewerProps) {
  const [query, setQuery] = useState("");
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = query.trim()
    ? files.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase())
      )
    : files;

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleDeleteFile = async (fileId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    setIsDeleting(fileId);
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      toast({
        title: "File deleted",
        description: `"${filename}" has been deleted successfully.`,
      });

      onFileDeleted?.(fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const startRename = (fileId: string, currentName: string) => {
    setEditingFileId(fileId);
    setEditingName(currentName);
  };

  const cancelRename = () => {
    setEditingFileId(null);
    setEditingName("");
  };

  const handleRename = async (fileId: string) => {
    if (!editingName.trim()) {
      cancelRename();
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: editingName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename file');
      }

      toast({
        title: "File renamed",
        description: `File has been renamed to "${editingName.trim()}".`,
      });

      onFileRenamed?.(fileId, editingName.trim());
    } catch (error) {
      console.error('Error renaming file:', error);
      toast({
        title: "Error",
        description: "Failed to rename file. Please try again.",
        variant: "destructive",
      });
    } finally {
      cancelRename();
    }
  };

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
    <div className="flex h-full overflow-hidden">
      {/* File Browser */}
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm min-w-0">
        <div className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          <Folder className="h-4 w-4" />
          <span className="truncate">Files</span>
          <span className="ml-auto text-[10px] font-normal text-gray-500 dark:text-gray-400">
            {files.length}
          </span>
        </div>
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded px-2 py-1 border border-gray-200 dark:border-gray-700">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <input
              className="bg-transparent outline-none text-xs flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400"
              placeholder="Search files"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((f) => (
            <li key={f.id}>
              <div
                className={`flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 group ${
                  f.id === activeFile?.id
                    ? "bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-200 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {editingFileId === f.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(f.id);
                        if (e.key === 'Escape') cancelRename();
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRename(f.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelRename}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onFileSelect(f.id)}
                      className="flex-1 text-left truncate"
                      title={f.name}
                    >
                      <span className="block truncate">{f.name}</span>
                    </button>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => startRename(f.id, f.name)}
                          >
                            <Edit className="h-3 w-3 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFile(f.id, f.name)}
                            disabled={isDeleting === f.id}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            {isDeleting === f.id ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-gray-400 text-xs">No matches</li>
          )}
        </ul>
      </div>
    </div>
  );
}
