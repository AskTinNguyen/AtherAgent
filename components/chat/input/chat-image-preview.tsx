'use client'

import { AttachmentFile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FileText, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '../../ui/button'
import { Progress } from '../../ui/progress'

interface ImagePreviewProps {
  attachment: AttachmentFile
  onRemove: (id: string) => void
  className?: string
}

export function ImagePreview({
  attachment,
  onRemove,
  className
}: ImagePreviewProps) {
  if (!attachment) return null

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-input bg-background',
        className
      )}
    >
      {/* Preview area */}
      <div className="relative size-20 overflow-hidden rounded-lg">
        {attachment.type === 'image' && attachment.previewUrl ? (
          <Image
            src={attachment.previewUrl}
            alt="Preview"
            className="object-cover rounded-lg"
            fill
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/50 rounded-lg">
            <FileText className="size-8 text-muted-foreground" />
          </div>
        )}

        {/* Upload progress overlay */}
        {attachment.status === 'uploading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
            <Progress
              value={attachment.progress}
              className="w-12 h-1.5 rounded-full"
            />
          </div>
        )}

        {/* Error overlay */}
        {attachment.status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-lg">
            <span className="text-xs text-destructive font-medium px-2.5 text-center">
              {attachment.error}
            </span>
          </div>
        )}
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-2 -top-2 size-6 rounded-full opacity-0 shadow-sm transition-opacity group-hover:opacity-100 bg-background border"
        onClick={() => onRemove(attachment.id)}
      >
        <X className="size-3" />
      </Button>
    </div>
  )
} 