'use client'

import { AttachmentFile, SearchSource } from '@/lib/types'
import { cn } from '@/lib/utils'
import { uploadFile, validateFile } from '@/lib/utils/upload'
import { Message } from 'ai'
import { ArrowUp, Maximize2, MessageCirclePlus, Square, Type, Upload } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import ReactMarkdown from 'react-markdown'
import Textarea from 'react-textarea-autosize'
import remarkGfm from 'remark-gfm'
import { ImagePreview } from './chat/ImagePreview'
import { SearchSourceManager } from './chat/SearchSourceManager'
import { EmptyScreen } from './empty-screen'
import { ModelSelector } from './model-selector'
import { SearchDepthToggle } from './search-depth-toggle'
import { SearchModeToggle } from './search-mode-toggle'
import { Button } from './ui/button'

interface UploadResponse {
  url: string
}

interface ChatPanelProps {
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
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [isFullSize, setIsFullSize] = useState(false)
  const [isMarkdownView, setIsMarkdownView] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [isSourcePickerVisible, setIsSourcePickerVisible] = useState(false)
  const [sourcePickerPosition, setSourcePickerPosition] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)

  // Add keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Command + . (Mac) or Control + . (Windows/Linux) for search mode
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        const newSearchMode = !searchMode
        setSearchMode(newSearchMode)
        onSearchModeChange?.(newSearchMode)
      }
      
      // Check for Command + Up Arrow (Mac) or Control + Up Arrow (Windows/Linux) for model selector
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp') {
        e.preventDefault()
        setModelSelectorOpen(!modelSelectorOpen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchMode, onSearchModeChange, modelSelectorOpen])

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  const handleNewChat = () => {
    setMessages([])
    setShowEmptyScreen(false)
    setSearchMode(false)
    setIsFullSize(false)
    setIsMarkdownView(false)
    setAttachments([])
    setIsSourcePickerVisible(false)
    router.replace('/')
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
          const response = await uploadFile(file, (progress) => {
            setAttachments(prev =>
              prev.map(a =>
                a.id === id ? { ...a, progress } : a
              )
            )
          }) as UploadResponse

          // Update attachment with upload result
          setAttachments(prev =>
            prev.map(a =>
              a.id === id
                ? {
                    ...a,
                    status: 'ready',
                    progress: 100,
                    url: response.url
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileAccepted,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': ['.png', '.gif', '.jpeg', '.jpg', '.webp'],
      'application/pdf': ['.pdf']
    },
    preventDropOnDocument: true,
  })

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id)
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl)
      }
      return prev.filter(a => a.id !== id)
    })
  }

  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0 && messages.length === 0) {
      append({
        role: 'user',
        content: query,
        id: nanoid()
      })
      isFirstRender.current = false
    }
  }, [query, append, messages.length])

  // Reset input and state when query changes
  useEffect(() => {
    if (query) {
      handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>)
      setShowEmptyScreen(false)
      setSearchMode(false)
      setIsFullSize(false)
      setIsMarkdownView(false)
      setAttachments([])
      setIsSourcePickerVisible(false)
    }
  }, [query, handleInputChange])

  // Update the format text handler
  const handleFormatText = () => {
    if (!input) return
    setIsMarkdownView(!isMarkdownView)
  }

  const handleSourceSelect = (source: SearchSource) => {
    if (!textareaRef.current) return

    const cursorPosition = textareaRef.current.selectionStart
    const textBefore = input.slice(0, cursorPosition)
    const textAfter = input.slice(cursorPosition)
    
    // Format the source as a markdown link
    const sourceText = `[${source.title || source.url}](${source.url})`
    
    // Replace the @ symbol with the source
    const lastAtIndex = textBefore.lastIndexOf('@')
    if (lastAtIndex >= 0) {
      const newInput = textBefore.slice(0, lastAtIndex) + sourceText + textAfter
      handleInputChange({
        target: { value: newInput }
      } as React.ChangeEvent<HTMLTextAreaElement>)

      // Focus the textarea and set cursor position after the inserted source
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const newCursorPosition = lastAtIndex + sourceText.length
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        }
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '@' && !isSourcePickerVisible) {
      const textarea = e.currentTarget
      const { selectionStart } = textarea
      
      // Get cursor position
      const textBeforeCursor = textarea.value.slice(0, selectionStart)
      const lines = textBeforeCursor.split('\n')
      const currentLineIndex = lines.length - 1
      const currentLineLength = lines[currentLineIndex].length
      
      // Get textarea position info
      const { lineHeight, paddingTop, paddingLeft } = getComputedStyle(textarea)
      const lineHeightValue = parseInt(lineHeight)
      const paddingTopValue = parseInt(paddingTop)
      const paddingLeftValue = parseInt(paddingLeft)
      
      // Calculate position
      const caretCoords = getCaretCoordinates(textarea, selectionStart)
      const top = textarea.offsetTop + paddingTopValue + caretCoords.top + lineHeightValue
      const left = textarea.offsetLeft + paddingLeftValue + caretCoords.left
      
      setSourcePickerPosition({ 
        top: Math.min(top, textarea.offsetTop + textarea.offsetHeight - 200), // Ensure picker doesn't go below textarea
        left: Math.min(left, textarea.offsetLeft + textarea.offsetWidth - 384) // 384px is picker width
      })
      setIsSourcePickerVisible(true)
    }
  }

  // Add getCaretCoordinates helper
  function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
    const { offsetLeft: elementLeft, offsetTop: elementTop } = element
    const div = document.createElement('div')
    const styles = getComputedStyle(element)
    const properties = [
      'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
      'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
      'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'
    ]

    div.style.position = 'absolute'
    div.style.visibility = 'hidden'
    div.style.whiteSpace = 'pre-wrap'

    properties.forEach(prop => {
      div.style[prop as any] = styles.getPropertyValue(prop)
    })

    document.body.appendChild(div)
    
    const text = element.value.slice(0, position)
    const span = document.createElement('span')
    span.textContent = text
    div.appendChild(span)
    
    const coordinates = {
      top: span.offsetTop - element.scrollTop,
      left: span.offsetLeft - element.scrollLeft
    }
    
    document.body.removeChild(div)
    return coordinates
  }

  const handleCloseSourcePicker = () => {
    setIsSourcePickerVisible(false)
  }

  return (
    <div
      className={cn(
        'mx-auto w-full',
        messages.length > 0
          ? 'fixed bottom-0 left-0 right-0 bg-background z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]'
          : 'fixed bottom-8 left-0 right-0 top-6 flex flex-col items-center justify-center'
      )}
    >
      {/* revemoe THE ICONLOGO LOGO 👩‍🦳 */}
      {/* {messages.length === 0 && (
        <div className="mb-8">
          <IconLogo className="size-12 text-muted-foreground" />
        </div>
      )} */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          'w-full mx-auto',
          'lg:max-w-3xl',
          'transition-all duration-300 ease-in-out',
          messages.length > 0 ? 'p-4' : 'px-4 md:px-6'
        )}
      >
        <div className="relative flex flex-col w-full gap-4 bg-muted rounded-xl border border-input">
          <div className="relative w-full p-2">
            <div
              {...getRootProps()}
              className={cn(
                'relative w-full rounded-lg',
                isDragActive && 'after:absolute after:inset-0 after:rounded-lg after:border-2 after:border-dashed after:border-primary after:bg-primary/5 after:z-50'
              )}
            >
              <input {...getInputProps()} />
              {isMarkdownView ? (
                <div 
                  className={cn(
                    "w-full min-h-12 bg-transparent px-3 py-2 text-sm prose prose-sm max-w-none dark:prose-invert overflow-y-auto",
                    "prose-headings:mt-2 prose-headings:mb-1 prose-headings:text-foreground",
                    "prose-p:my-1 prose-p:leading-relaxed prose-p:text-muted-foreground",
                    "prose-pre:my-1 prose-pre:p-2 prose-pre:bg-muted prose-pre:text-foreground",
                    "prose-code:text-primary prose-code:bg-muted prose-code:p-1 prose-code:rounded",
                    "prose-strong:text-foreground prose-strong:font-semibold",
                    "prose-em:text-muted-foreground",
                    "prose-ul:my-1 prose-ol:my-1 prose-li:text-muted-foreground",
                    "prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary",
                    isFullSize ? "min-h-[120px] max-h-[820px]" : "min-h-12"
                  )}
                  onClick={() => setIsMarkdownView(false)}
                >
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold text-foreground" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-foreground" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-medium text-foreground" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline ? 
                          <code className="bg-muted text-primary rounded px-1" {...props} /> :
                          <pre className="bg-muted p-2 rounded"><code className="text-foreground" {...props} /></pre>,
                      a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                      p: ({node, ...props}) => <p className="text-muted-foreground" {...props} />,
                      ul: ({node, ...props}) => <ul className="text-muted-foreground" {...props} />,
                      ol: ({node, ...props}) => <ol className="text-muted-foreground" {...props} />,
                      li: ({node, ...props}) => <li className="text-muted-foreground" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground" {...props} />,
                    }}
                  >
                    {input}
                  </ReactMarkdown>
                </div>
              ) : (
                <Textarea
                  ref={textareaRef}
                  name="input"
                  rows={isFullSize ? undefined : 1}
                  maxRows={isFullSize ? undefined : 10}
                  tabIndex={0}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder="Ask a question..."
                  spellCheck={false}
                  value={input}
                  className={cn(
                    "resize-none w-full bg-transparent border-0 px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground focus-visible:outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    isDragActive && "opacity-50",
                    isFullSize ? "min-h-[200px] max-h-[500px] overflow-y-auto" : "min-h-8"
                  )}
                  disabled={isDragActive}
                  onChange={e => {
                    handleInputChange(e)
                    setShowEmptyScreen(e.target.value.length === 0)
                  }}
                  onKeyDown={e => {
                    handleKeyDown(e)
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      !isComposing &&
                      !enterDisabled &&
                      !isSourcePickerVisible
                    ) {
                      if (input.trim().length === 0) {
                        e.preventDefault()
                        return
                      }
                      e.preventDefault()
                      const textarea = e.target as HTMLTextAreaElement
                      textarea.form?.requestSubmit()
                    }
                  }}
                  onFocus={() => setShowEmptyScreen(true)}
                  onBlur={() => setShowEmptyScreen(false)}
                />
              )}
              {isDragActive && (
                <div className="absolute inset-0 z-50 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium shadow-lg">
                    <Upload className="size-4" />
                    Drop files to upload
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Show image previews if there are attachments */}
          {attachments.length > 0 && (
            <div className="px-4 pb-2">
              <ImagePreview
                attachments={attachments}
                onRemove={handleRemoveAttachment}
              />
            </div>
          )}

          {/* Bottom menu area - This is the main container for all buttons */}
          <div className="flex items-center justify-between p-2 md:p-3">
            {/* Left side buttons group - Currently contains ModelSelector and SearchModeToggle */}
            <div className="flex items-center gap-2">
                <ModelSelector open={modelSelectorOpen} onOpenChange={setModelSelectorOpen} />
                <SearchModeToggle
                    enabled={searchMode}
                    onEnabledChange={(enabled: boolean) => {
                        setSearchMode(enabled)
                        onSearchModeChange?.(enabled)
                    }}
                />
                <SearchDepthToggle
                    enabled={searchMode}
                    currentDepth={currentDepth}
                    maxDepth={maxDepth}
                    onDepthChange={onDepthChange ?? (() => {})}
                />
            </div>

            {/* Right side buttons group - Currently contains New Chat, Full Size, and Submit */}
            <div className="flex items-center gap-2">
                {/* New Chat button - Can be moved anywhere within either group */}
                {messages.length > 0 && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNewChat}
                        className="shrink-0 rounded-full group"
                        type="button"
                        disabled={isLoading}
                    >
                        <MessageCirclePlus className="size-4 group-hover:rotate-12 transition-all" />
                    </Button>
                )}

                {/* Format Text button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFormatText}
                    className={cn(
                        "shrink-0 rounded-full group",
                        "hover:bg-primary/10"
                    )}
                    type="button"
                    disabled={!input || isLoading}
                >
                    <Type className="size-4 group-hover:text-primary transition-colors" />
                </Button>

                {/* Full Size toggle button - Can be moved anywhere within either group */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFullSize(!isFullSize)}
                    className={cn(
                        "shrink-0 rounded-full group",
                        isFullSize && "bg-primary/10"
                    )}
                    type="button"
                >
                    <Maximize2 className={cn(
                        "size-4 transition-transform",
                        isFullSize && "rotate-180"
                    )} />
                </Button>

                {/* Submit/Send button - Can be moved anywhere within either group */}
                <Button
                    type={isLoading ? 'button' : 'submit'}
                    size={'icon'}
                    variant={'outline'}
                    className={cn(isLoading && 'animate-pulse', 'rounded-full')}
                    disabled={input.length === 0 && !isLoading}
                    onClick={isLoading ? stop : undefined}
                >
                    {isLoading ? <Square size={20} /> : <ArrowUp size={20} />}
                </Button>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <EmptyScreen
            submitMessage={message => {
              handleInputChange({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)
            }}
            className={cn(showEmptyScreen ? 'visible' : 'invisible')}
          />
        )}

        {/* Add SearchSourceManager */}
        <SearchSourceManager
          messages={messages}
          onSourceSelect={handleSourceSelect}
          inputValue={input}
          position={sourcePickerPosition}
          isVisible={isSourcePickerVisible}
          onClose={handleCloseSourcePicker}
        />
      </form>
    </div>
  )
}
