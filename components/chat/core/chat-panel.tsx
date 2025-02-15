'use client'

import { useChatSession } from '@/lib/contexts/chat-session-context'
import { useResearch } from '@/lib/contexts/research-context'
import { type SearchSource } from '@/lib/types'
import { type AttachmentFile } from '@/lib/types/index'
import { type ResearchState } from '@/lib/types/types.research'
import { uploadFile, validateFile } from '@/lib/utils/upload'
import { type Message } from 'ai'
import { ArrowUp } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Textarea from 'react-textarea-autosize'
import { ImagePreview } from '../../chat/input/chat-image-preview'
import { ChatSourceManager } from '../../chat/input/chat-source-manager'
import { EmptyScreen } from '../../empty-screen'
import { ModelSelector } from '../../model-selector'
import { SearchDepthToggle } from '../../search-depth-toggle'
import { SearchModeToggle } from '../../search-mode-toggle'
import { Button } from '../../ui/button'

interface UploadResponse {
  url: string
}

export interface ChatPanelProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stop: () => void
  append: (message: Message) => void
  onSearchModeChange?: (enabled: boolean) => void
  currentDepth?: number
  maxDepth?: number
  onDepthChange?: (depth: number) => void
}

export function ChatPanel({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  setMessages,
  query,
  stop,
  append,
  onSearchModeChange,
  currentDepth = 1,
  maxDepth = 3,
  onDepthChange
}: ChatPanelProps) {
  const { setIsSessionActive } = useChatSession()
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const [isFullSize, setIsFullSize] = useState(false)
  const [isMarkdownView, setIsMarkdownView] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false)
  const [enterDisabled, setEnterDisabled] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [isSourcePickerVisible, setIsSourcePickerVisible] = useState(false)
  const [sourcePickerPosition, setSourcePickerPosition] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const { state, toggleSearch } = useResearch()

  // Add keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Command + . (Mac) or Control + . (Windows/Linux) for search mode
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        toggleSearch()
        onSearchModeChange?.((state as ResearchState).isActive)
      }
      
      // Check for Command + Up Arrow (Mac) or Control + Up Arrow (Windows/Linux) for model selector
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp') {
        e.preventDefault()
        setModelSelectorOpen(!modelSelectorOpen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSearch, modelSelectorOpen, state, onSearchModeChange])

  const handleCompositionStart = () => setIsComposing(true)
  const handleCompositionEnd = () => setIsComposing(false)

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const handleSourceSelect = (source: SearchSource) => {
    // Handle source selection
    setIsSourcePickerVisible(false)
  }

  const handleFileAccepted = async (files: File[]) => {
    const newAttachments: AttachmentFile[] = []

    for (const file of files) {
      try {
        validateFile(file)
        const id = nanoid()
        const type = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'document' : 'other'
        
        // Create preview URL for images
        const previewUrl = type === 'image' ? URL.createObjectURL(file) : undefined

        const attachment: AttachmentFile = {
          id,
          file,
          type,
          previewUrl,
          status: 'uploading',
          progress: 0
        }

        newAttachments.push(attachment)
        setAttachments(prev => [...prev, attachment])

        // Start upload
        try {
          const url = await uploadFile(file, (progress) => {
            setAttachments(prev =>
              prev.map(a =>
                a.id === id ? { ...a, progress } : a
              )
            )
          })

          // Update attachment with upload result
          setAttachments(prev =>
            prev.map(a =>
              a.id === id
                ? {
                    ...a,
                    status: 'ready',
                    progress: 100,
                    url
                  }
                : a
            )
          )
        } catch (error) {
          setAttachments(prev =>
            prev.map(a =>
              a.id === id
                ? {
                    ...a,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Upload failed'
                  }
                : a
            )
          )
        }
      } catch (error) {
        // Handle validation error
        console.error('File validation error:', error)
      }
    }
  }

  const dropzoneConfig = {
    onDrop: handleFileAccepted,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': ['.png', '.gif', '.jpeg', '.jpg', '.webp'],
      'application/pdf': ['.pdf']
    },
    preventDropOnDocument: true,
  }

  const { getRootProps, getInputProps } = useDropzone(dropzoneConfig)

  return (
    <div className="relative flex-1 overflow-hidden bg-background px-4 sm:rounded-md sm:border sm:px-6">
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background to-background/0" aria-hidden="true">
          <div className="max-w-2xl text-center"></div>
        </div>
      </div>

      {showEmptyScreen && <EmptyScreen submitMessage={() => {}} />}

      <form onSubmit={handleSubmit}>
        <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
          <div className="absolute left-0 top-4 sm:left-4">
            <ModelSelector open={modelSelectorOpen} onOpenChange={setModelSelectorOpen} />
          </div>

          {/* Left side buttons group - Currently contains Search Mode and Search Depth */}
          <div className="absolute right-0 top-4 flex items-center space-x-4 sm:right-4">
            <SearchModeToggle />
            <SearchDepthToggle />
          </div>

          <Textarea
            ref={textareaRef}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            rows={1}
            value={input}
            onChange={handleInputChange}
            placeholder="Send a message..."
            spellCheck={false}
            className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          />

          <div className="absolute right-0 top-4 sm:right-4">
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || input.trim().length === 0}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </form>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {attachments.map(attachment => (
            <ImagePreview
              key={attachment.id}
              attachment={attachment}
              onRemove={handleRemoveAttachment}
            />
          ))}
        </div>
      )}

      {/* Source picker */}
      {isSourcePickerVisible && (
        <div
          className="absolute z-50"
          style={{
            top: sourcePickerPosition.top,
            left: sourcePickerPosition.left
          }}
        >
          <ChatSourceManager 
            messages={messages}
            onSourceSelect={handleSourceSelect}
            inputValue={input}
            position={sourcePickerPosition}
            isVisible={isSourcePickerVisible}
            onClose={() => setIsSourcePickerVisible(false)}
          />
        </div>
      )}
    </div>
  )
} 