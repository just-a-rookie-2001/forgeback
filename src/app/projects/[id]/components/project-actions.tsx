'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Play, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  status: string
  stages: Array<{
    id: string
    name: string
    type: string
    artifacts: Array<{
      id: string
      name: string
      content: string
      language?: string
      type: string
    }>
  }>
}

interface ProjectActionsProps {
  project: Project
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const deleteProject = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone and will delete all related data including files, stages, artifacts, and chat history.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      toast({
        title: 'Project deleted',
        description: `Successfully deleted "${project.name}"`
      })

      // Redirect to dashboard
      router.push('/dashboard')
    } catch {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the project. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const downloadProject = async () => {
    // Get all artifacts from all stages that have the type 'file'
    const allArtifacts = project.stages.flatMap(stage => 
      stage.artifacts.filter(artifact => artifact.type === 'file' || !artifact.type)
    )
    
    if (allArtifacts.length === 0) {
      toast({
        title: "No files to download",
        description: "This project doesn't have any generated files yet.",
        variant: "destructive"
      })
      return
    }

    setIsDownloading(true)
    
    try {
      // Create a simple ZIP-like structure as a text file for MVP
      // In production, you'd use JSZip or similar
      const projectContent = allArtifacts.map(artifact => 
        `// File: ${artifact.name}\n// Language: ${artifact.language || 'unknown'}\n// Type: ${artifact.type}\n\n${artifact.content}\n\n${'='.repeat(80)}\n\n`
      ).join('')

      const blob = new Blob([projectContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-code.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: "Your project code is being downloaded.",
      })
  } catch {
      toast({
        title: "Download failed",
        description: "Failed to download project files.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const runProject = async () => {
    toast({
      title: "Feature coming soon",
      description: "Ephemeral environment deployment will be available soon.",
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={runProject}
        disabled={project.status !== 'completed'}
      >
        <Play className="h-4 w-4 mr-2" />
        Run
      </Button>

      <Button
        onClick={downloadProject}
        disabled={isDownloading || project.stages.flatMap(s => s.artifacts.filter(a => a.type === 'file' || !a.type)).length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        {isDownloading ? 'Downloading...' : 'Download'}
      </Button>

      <Button
        variant="destructive"
        onClick={deleteProject}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  )
}