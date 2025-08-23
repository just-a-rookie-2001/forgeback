'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { X, Loader2 } from 'lucide-react'

interface NewProjectDialogProps {
  children: React.ReactNode
  onProjectCreated?: () => void
}

export function NewProjectDialog({ children, onProjectCreated }: NewProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: ''
  })
  
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.prompt.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide a project name and description.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          prompt: formData.prompt,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project')
      }

      toast({
        title: 'Project creation started!',
        description: 'Your project is being set up. Starting with the planning phase.',
      })

      setIsOpen(false)
      setFormData({ name: '', description: '', prompt: '' })
      
      // Call the callback to refresh the parent component
      onProjectCreated?.()
      
      router.push(`/projects/${result.projectId}`)

    } catch (error) {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Project
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Todo API Service"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of your project"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Project Requirements *
            </label>
            <Textarea
              value={formData.prompt}
              onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
              placeholder="I need a REST API to manage todo tasks with CRUD operations, SQLite database, input validation, and comprehensive tests..."
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Be specific about your requirements, database needs, and any special features.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}