'use client'

import { BlurReveal } from '@/components/blur-reveal'
import { Chat } from '@/components/chat'
import { useSupabase } from '@/components/providers/supabase-provider'
import { ResearchProvider } from '@/lib/contexts/research-context'
import { motion as m } from "framer-motion"
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export default function Page() {
  const id = uuidv4()
  const pathname = usePathname()
  const isInChatSession = pathname.startsWith('/search/')
  const supabase = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking auth status:', error)
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background Layer */}
      <m.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={`absolute inset-0 ${isInChatSession ? 'bg-black' : 'bg-black/40'}`}
      >
        {!isInChatSession && (
        <Image
          src="/wallpaper-bw.png"
          alt="Background"
          fill
          className="object-cover mix-blend-overlay opacity-90 transition-all duration-300"
          priority
          quality={100}
        />
        )}
      </m.div>
      
      {/* Main Content Area - Contains the primary chat interface */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* BlurReveal Section */}
        <div className="flex-none pt-44 pb-10">
          <BlurReveal />
        </div>
        
        {/* Chat Interface */}
        <div className="flex-1">
          <ResearchProvider>
            <Chat id={id} />
          </ResearchProvider>
        </div>
      </div>
    </div>
  )
}
