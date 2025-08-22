'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, Download, FileCode, Database, TestTube, Settings } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CodeFile {
  id: string
  filename: string
  content: string
  language: string
  type: string
}

interface CodeViewerProps {
  files: CodeFile[]
}

export function CodeViewer({ files }: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState(files[0]?.id || '')
  const { toast } = useToast()

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'api': return <FileCode className="h-4 w-4" />
      case 'db': return <Database className="h-4 w-4" />
      case 'test': return <TestTube className="h-4 w-4" />
      case 'config': return <Settings className="h-4 w-4" />
      default: return <FileCode className="h-4 w-4" />
    }
  }

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'api': return 'text-blue-600'
      case 'db': return 'text-green-600'
      case 'test': return 'text-purple-600'
      case 'config': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const copyToClipboard = async (content: string, filename: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Copied to clipboard",
        description: `${filename} has been copied to your clipboard.`,
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive"
      })
    }
  }

  if (files.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4">
          <TabsList className="grid w-full grid-cols-auto gap-1 h-auto p-1">
            {files.map((file) => (
              <TabsTrigger
                key={file.id}
                value={file.id}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <span className={getFileTypeColor(file.type)}>
                  {getFileIcon(file.type)}
                </span>
                <span className="truncate max-w-32" title={file.filename}>
                  {file.filename.split('/').pop()}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {files.map((file) => (
          <TabsContent key={file.id} value={file.id} className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className={getFileTypeColor(file.type)}>
                  {getFileIcon(file.type)}
                </span>
                <span className="font-mono text-sm text-gray-900 dark:text-white">
                  {file.filename}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {file.language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(file.content, file.filename)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <pre className="overflow-x-auto p-4 bg-gray-50 dark:bg-gray-800 text-sm">
                <code className="language-javascript text-gray-900 dark:text-gray-100">
                  {file.content}
                </code>
              </pre>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}