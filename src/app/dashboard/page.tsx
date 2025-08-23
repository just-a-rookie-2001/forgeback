import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProjectCard } from '@/components/dashboard/project-card'
import { NewProjectDialog } from '@/components/dashboard/new-project-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      files: {
        select: { id: true }
      }
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your AI-generated backend projects
          </p>
        </div>
        <NewProjectDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </NewProjectDialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-sm mx-auto">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create your first AI-generated backend project to get started.
            </p>
            <NewProjectDialog>
              <Button>Create Your First Project</Button>
            </NewProjectDialog>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={{
                ...project,
                fileCount: project.files.length
              }} 
            />
          ))}
        </div>
      )}
    </div>
  )
}