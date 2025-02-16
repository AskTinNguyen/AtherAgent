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
      
      {/* Main Content Area - Contains the primary chat interface */}
      <div className="relative z-10">
        <Chat id={id} />
      </div>
    </div>
  )
}
