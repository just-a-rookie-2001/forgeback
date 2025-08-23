"use client"
import { useEffect, useState } from 'react'
import { Copy, Folder, FileCode2, WrapText, ScanText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface FileItem {
  id: string
  filename: string
  content: string
  language: string
  type: string
}

interface FileBrowserViewerProps {
  files: FileItem[]
  hidden?: boolean
}

export function FileBrowserViewer({ files, hidden }: FileBrowserViewerProps) {
  const [activeId, setActiveId] = useState(files[0]?.id)
  const [wrap, setWrap] = useState(false)
  const [query, setQuery] = useState('')
  const { toast } = useToast()

  // Sync active file if list changes (e.g. regeneration)
  useEffect(() => {
    if (!activeId || !files.find(f => f.id === activeId)) {
      setActiveId(files[0]?.id)
    }
  }, [files, activeId])

  const filtered = query.trim()
    ? files.filter(f => f.filename.toLowerCase().includes(query.toLowerCase()))
    : files

  const active = files.find(f => f.id === activeId) || files[0]

  const copyFile = async () => {
    await navigator.clipboard.writeText(active.content)
    toast({ title: 'Copied', description: 'File content copied.' })
  }

  if (hidden) return null
  if (!files.length) return <div className="text-sm text-gray-500 p-4">No files yet.</div>

  return (
    <div className="flex h-[75vh] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* File list */}
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm min-w-0">
        <div className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          <Folder className="h-4 w-4" />
          <span className="truncate">Files</span>
          <span className="ml-auto text-[10px] font-normal text-gray-500 dark:text-gray-400">{files.length}</span>
        </div>
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded px-2 py-1 border border-gray-200 dark:border-gray-700">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <input
              className="bg-transparent outline-none text-xs flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400"
              placeholder="Search files"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map(f => (
            <li key={f.id}>
              <button
                onClick={() => setActiveId(f.id)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 truncate group ${f.id === active.id ? 'bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-200 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                title={f.filename}
              >
                <span className="block truncate">{f.filename}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-gray-400 text-xs">No matches</li>
          )}
        </ul>
      </div>
      {/* Code viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs gap-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 min-w-0">
            <FileCode2 className="h-4 w-4 shrink-0" />
            <span className="font-mono truncate max-w-[400px]" title={active.filename}>{active.filename}</span>
            <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-[10px] tracking-wide shrink-0">{active.language}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setWrap(w => !w)} title={wrap ? 'Disable wrapping' : 'Enable wrapping'}>
              {wrap ? <ScanText className="h-4 w-4" /> : <WrapText className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={copyFile}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <pre className={`min-h-full p-4 text-sm ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'} bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100`}>
            <code>{active.content}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}