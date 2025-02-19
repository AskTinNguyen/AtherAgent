'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SupabaseAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupabaseAuthDialog({ open, onOpenChange }: SupabaseAuthDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.session) {
        toast.success('Signed in successfully')
        // Force a router refresh to update auth state
        router.refresh()
        // Close the dialog
        onOpenChange(false)
        // Reset form
        setEmail('')
        setPassword('')
      }
    } catch (error) {
      toast.error('Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setEmail('')
      setPassword('')
      setIsLoading(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in to Ather</DialogTitle>
          <DialogDescription>
            Enter your credentials to access all features
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSignIn} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 