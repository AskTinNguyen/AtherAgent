'use client'

import { useChatSession } from '@/lib/contexts/chat-session-context'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  scale: number
  rotation: number
}

export function Background() {
  const { isSessionActive } = useChatSession()
  const [particles, setParticles] = useState<Particle[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const shouldShowWallpaper = !isSessionActive && isHomePage
  
  useEffect(() => {
    if (isSessionActive && containerRef.current && isHomePage) {
      const rect = containerRef.current.getBoundingClientRect()
      const newParticles = Array.from({ length: 200 }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: Math.random() * 8 + 2,
        opacity: Math.random() * 0.8 + 0.2,
        scale: Math.random() * 0.5 + 0.5,
        rotation: Math.random() * 360
      }))
      setParticles(newParticles)
    } else {
      setParticles([])
    }
  }, [isSessionActive, isHomePage])

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
      {/* Wallpaper - only shown on home page when session is not active */}
      <motion.div 
        animate={{ opacity: shouldShowWallpaper ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0"
      >
        <Image
          src="/wallpaper-bw.png"
          alt="Background"
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover"
        />
      </motion.div>

      {/* Black background - shown during active sessions and non-home pages */}
      <motion.div
        initial={true}
        animate={{ opacity: !shouldShowWallpaper ? 1 : 0 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-black pointer-events-none"
      />

      {/* Particles - only shown during transition on home page */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {particles.map((particle, index) => (
            <motion.div
              key={index}
              initial={{
                x: particle.x,
                y: particle.y,
                opacity: particle.opacity,
                scale: particle.scale,
                rotate: particle.rotation,
                filter: 'blur(0px)'
              }}
              animate={{
                x: [particle.x, particle.x + (Math.random() - 0.5) * 800],
                y: [particle.y, particle.y + (Math.random() - 0.5) * 800],
                opacity: [particle.opacity, 0],
                scale: [particle.scale, particle.scale * 2],
                rotate: [particle.rotation, particle.rotation + (Math.random() - 0.5) * 360],
                filter: ['blur(0px)', 'blur(4px)', 'blur(0px)']
              }}
              exit={{ 
                opacity: 0,
                scale: 0,
                filter: 'blur(8px)'
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                ease: [0.4, 0, 0.2, 1],
                filter: {
                  times: [0, 0.5, 1],
                  duration: Math.random() * 3 + 2
                }
              }}
              className="absolute"
              style={{
                width: particle.size,
                height: particle.size,
                maskImage: 'radial-gradient(circle, white 100%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(circle, white 100%, transparent 100%)',
                backgroundImage: 'url(/wallpaper-bw.png)',
                backgroundSize: '100vw auto',
                backgroundPosition: `${-particle.x}px ${-particle.y}px`,
                pointerEvents: 'none',
                willChange: 'transform, opacity, filter'
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
} 