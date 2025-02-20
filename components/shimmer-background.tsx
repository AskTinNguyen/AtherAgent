'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface ShimmerBackgroundProps {
  children: React.ReactNode
  className?: string
}

export function ShimmerBackground({ children, className = '' }: ShimmerBackgroundProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-gray-800/40 via-gray-700/30 to-gray-800/40 ${className}`}
    >
      <motion.div
        // Style for the shimmering effect
        className="absolute inset-0"
        style={{
          // Creates a linear gradient for the shimmer effect
          background: `linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.05) 25%, // Adjust these values to fine-tune the shimmer effect
            rgba(255, 255, 255, 0.15) 50%, // Adjust these values to fine-tune the shimmer effect
            rgba(255, 255, 255, 0.25) 70%, // Adjust these values to fine-tune the shimmer effect
            rgba(255, 255, 255, 0.4) 100%
          )`,
        }}
        animate={{
          x: ['-100%', '100%'], // Animates the x position from -100% to 100% to create the shimmer effect
        }}
        transition={{
          repeat: Infinity,
          duration: 0.5, // Adjust the duration to change the speed of the animation
          ease: 'easeInOut', // Consider using 'easeInOut' for a smoother transition
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}