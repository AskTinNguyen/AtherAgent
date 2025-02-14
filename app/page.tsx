'use client'

import { BlurReveal } from '@/components/blur-reveal'
import { Chat } from '@/components/chat'
import { useChatSession } from '@/lib/contexts/chat-session-context'

export default function Page() {
  const { chatId } = useChatSession()
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0">
        {/* <Image
          src="/wallpaper-bw.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        /> */}
      </div>
      
      {/* Main Content Area - Contains the primary chat interface */}
      <main className="relative mt-32 h-[calc(100vh-12rem)] flex flex-col overflow-y-auto">
        {/* mt-32: Top margin of 8rem (128px) */}
        {/* h-[calc(100vh-12rem)]: Height is viewport height minus 12rem (192px) for header/footer space */}
        {/* overflow-y-auto: Enables vertical scrolling when content overflows */}
        
        <div className="flex-1 flex flex-col items-center">
          {/* flex-1: Takes up remaining vertical space */}
          {/* items-center: Centers content horizontally */}

          {/* Chat Container with Blur Reveal - Wraps the chat interface */}
          <div className="w-full max-w-2xl mx-auto px-4 mt-auto ">
            {/* w-full: Full width of parent */}
            {/* max-w-2xl: Maximum width of 42rem (672px) */}
            {/* mx-auto: Centers horizontally with auto margins */}
            {/* px-4: Horizontal padding of 1rem (16px) */}
            {/* mt-auto: Pushes content to bottom */}

            {/* Blur Reveal Title Section - Shows the animated title */}
            <div className="mb-8 flex justify-center">
              {/* mb-8: Bottom margin of 2rem (32px) */}
              <BlurReveal />
            </div>

            {/* Chat Section - Main chat interface */}
            {chatId && <Chat id={chatId} />}
          </div>
        </div>
      </main>
    </div>
  )
}
