'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download, Play, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Project {
  id: string
  name: string
  status: string
  files: Array<{
    id: string
    filename: string
    content: string
    language: string
    type: string
  }>
}

interface ProjectActionsProps {
  project: Project
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const downloadProject = async () => {
    if (project.files.length === 0) {
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
      const projectContent = project.files.map(file => 
        `// File: ${file.filename}\n// Language: ${file.language}\n// Type: ${file.type}\n\n${file.content}\n\n${'='.repeat(80)}\n\n`
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

  const regenerateCode = async () => {
    setIsRegenerating(true)
    try {
      const resp = await fetch(`/api/projects/${project.id}/regenerate`, { method: 'POST' })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to regenerate')
      }
      toast({
        title: 'Regeneration complete',
        description: `Generated ${data.filesCount} files.`,
      })
      // Refresh the route to fetch updated project + files
      router.refresh()
    } catch (e) {
      toast({
        title: 'Regeneration failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setIsRegenerating(false)
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
        variant="outline"
        onClick={regenerateCode}
        disabled={isRegenerating || project.status === 'generating'}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
      </Button>

      <Button
        onClick={downloadProject}
        disabled={isDownloading || project.files.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        {isDownloading ? 'Downloading...' : 'Download'}
      </Button>
    </div>
  )
}