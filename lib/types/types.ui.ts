// File Attachment Types
export interface AttachmentFile {
  id: string
  file: File
  type: 'image' | 'document' | 'other'
  previewUrl?: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  progress?: number
  error?: string
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  progress?: number
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
}

// UI Component Props
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export interface TooltipProps {
  content: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
  children: React.ReactNode
}

// UI Theme Types
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

// UI Animation Types
export interface TransitionProps {
  duration?: number
  delay?: number
  easing?: string
} 