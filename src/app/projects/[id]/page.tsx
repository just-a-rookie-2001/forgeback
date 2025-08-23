import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { WorkspaceGrid } from "@/components/workspace/workspace-grid";
import { ProjectActions } from "@/components/workspace/project-actions";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileCode } from "lucide-react";

interface ProjectPageProps {
  params: { id: string };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const project = await db.project.findFirst({
    where: {
      id: id,
      userId: session.user.id ?? "",
    },
    include: {
      files: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "generating":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
          <ProjectActions project={project} />
        </div>

        {project.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {project.description}
          </p>
        )}

        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Created {new Date(project.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            {project.files.length} files generated
          </div>
        </div>
      </div>

      <WorkspaceGrid project={project} />
    </div>
  );
}
