import Link from 'next/link'
import { Calendar, FileCode, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  createdAt: Date
  fileCount: number
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'generating': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate pr-2">
            {project.name}
          </h3>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>

        {project.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            <span>{project.fileCount} files generated</span>
          </div>
        </div>

        {project.status === 'generating' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Generating code...</span>
          </div>
        )}
      </div>
    </Link>
  )
}