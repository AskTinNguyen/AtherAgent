'use client'

import { BlurReveal } from '@/components/blur-reveal'
import { Chat } from '@/components/chat'
import { useSupabase } from '@/components/providers/supabase-provider'
import { SparklingGrid } from '@/components/sparkling-grid'
import { ResearchProvider } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
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
  const [hasFirstMessage, setHasFirstMessage] = useState(false)
  
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
      {/* Sparkling Grid Effect */}
      {!hasFirstMessage && !isInChatSession && (
      <m.div
        initial={{ opacity: 1 }}
        animate={{ opacity: (hasFirstMessage || isInChatSession) ? 0 : 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="fixed inset-0" // Make it cover the entire page
      >
        <SparklingGrid 
          gridSize={30}
          sparkleFrequency={0.03}
          sparkleColor={{ light: "darkgray", dark: "silver" }}
          dotColor={{ light: "bg-black/20", dark: "bg-white/20" }}
        />
      </m.div>
      )}
      
      {/* Background Layer */}
      <m.div 
        // initial animation properties: opacity starts at 0, scale starts at 1.1
        initial={{ opacity: 0, scale: 1.1 }}
        // animation properties: opacity animates to 1, scale animates to 1
        animate={{ opacity: 1, scale: 1 }}
        // transition properties: animation duration is 1.5 seconds, easing function is easeOut
        transition={{ duration: 1.5, ease: "easeOut" }}
        // className: sets the position to absolute and covers the entire viewport
        // conditionally sets the background color based on whether the app is in a chat session
        className={cn(
          "absolute inset-0 transition-colors duration-5000",
          isInChatSession
            ? "bg-background/80 backdrop-blur-sm"
            : "bg-black/40"
        )}
      >
        {/* If not in a chat session, render the Image component */}
        {!isInChatSession && (
        <m.div
          animate={{ opacity: hasFirstMessage ? 0 : 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <Image
            // Source of the image
            src="/wallpaper-bw.png"
            // Alt text for accessibility
            alt="Background"
            // Image should fill the container
            fill
            // Class names for styling: object-cover ensures the image covers the area, mix-blend-overlay applies a blending effect, opacity is set to 90, and a transition is applied for smooth changes
            className="object-cover mix-blend-overlay opacity-90 transition-all duration-300"
            // Image should be preloaded
            priority
            // Image quality
            quality={100}
          />
        </m.div>
        )}
      </m.div>
      
      {/* Main Content Area - Contains the primary chat interface */}
      <div className="relative z-10 flex flex-col min-h-screen bg-transparent">
        {/* BlurReveal Section */}
        <div className="flex-none pt-44 pb-10">
          <BlurReveal />
        </div>
        
        {/* Chat Interface */}
        <div className="flex-1 bg-transparent">
          <ResearchProvider>
            <Chat id={id} onFirstMessage={() => setHasFirstMessage(true)} />
          </ResearchProvider>
        </div>
      </div>
    </div>
  )
}
