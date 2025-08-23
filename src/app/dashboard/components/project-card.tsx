"use client";

import Link from "next/link";
import { Calendar, FileCode, Clock, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: Date;
  fileCount: number;
}

interface ProjectCardProps {
  project: Project;
  onDelete?: () => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (
      !confirm(
        `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast({
        title: "Project deleted",
        description: `Successfully deleted "${project.name}"`,
      });

      // Call onDelete callback to refresh the parent component
      onDelete?.();
    } catch {
      toast({
        title: "Delete failed",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow relative group">
      {/* Action Dropdown */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content - Clickable Link */}
      <Link href={`/projects/${project.id}`} className="block">
        <div className="flex items-start justify-between mb-4 pr-8">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate pr-2">
            {project.name}
          </h3>
        </div>

        {project.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            <span>{project.fileCount} files generated</span>
          </div>
        </div>

        {project.status === "generating" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Generating code...</span>
          </div>
        )}
      </Link>
    </div>
  );
}
