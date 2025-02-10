import { BlurReveal } from '@/components/blur-reveal'
import { Chat } from '@/components/chat'
import { generateId } from 'ai'
import Image from 'next/image'

export default function Page() {
  const id = generateId()
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0">
        <Image
          src="/wallpaper-bw.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Main Content Area */}
      <main className="relative mt-32 h-[calc(100vh-12rem)] flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center">
          {/* Chat Container with Blur Reveal */}
          <div className="w-full max-w-2xl px-4 mt-auto">
            {/* Blur Reveal Title Section */}
            <div className="mb-8">
              <BlurReveal />
            </div>
            {/* Chat Section */}
            <Chat id={id} />
          </div>
        </div>
      </main>
    </div>
  )
}
