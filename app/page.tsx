import { BlurReveal } from '@/components/blur-reveal'
import { Chat } from '@/components/chat'
import { DeepResearchWrapper } from '@/components/deep-research-provider'
import { DeepResearchVisualization } from '@/components/deep-research-visualization'
import { generateId } from 'ai'
import Image from 'next/image'

export default function Page() {
  const id = generateId()
  
  return (
    <DeepResearchWrapper chatId={id}>
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
        
        {/* Research Visualization Panel - Hidden by default */}
        <DeepResearchVisualization location="sidebar" chatId={id} />
        
        {/* Main Content Area */}
        <main className="relative mt-32 h-[calc(100vh-12rem)] flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col items-center">
            {/* Chat Container with Blur Reveal */}
            <div className="w-full max-w-2xl mx-auto px-4 mt-auto ">
              {/* Blur Reveal Title Section */}
              <div className="mb-8 flex justify-center">
                <BlurReveal />
              </div>
              {/* Chat Section */}
              <Chat id={id} />
            </div>
          </div>
        </main>
      </div>
    </DeepResearchWrapper>
  )
}
