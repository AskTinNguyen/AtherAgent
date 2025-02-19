'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { SupabaseAuthDialog } from './auth/supabase-auth-dialog'
import { ModeToggle } from './mode-toggle'

export function ClientHeaderActions() {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { user, signOut } = useSupabase()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast.error('Error signing out', {
          description: error.message
        })
        return
      }
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    }
  }

  return (
    <div className="flex items-center gap-4">
      <ModeToggle />
      {user ? (
        <Button
          variant="ghost"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setShowAuthDialog(true)}
        >
          Sign In
        </Button>
      )}
      <SupabaseAuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </div>
  )
} 