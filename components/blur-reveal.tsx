"use client"

import { motion } from "framer-motion"
import React from "react"

const transition = { duration: 1, ease: [.25,.1,.25,1] }
const variants = {
  hidden: { filter: "blur(10px)", transform: "translateY(20%)", opacity: 0 },
  visible: { filter: "blur(0)", transform: "translateY(0)", opacity: 1 },
}

const text = "I'm Ather"
const subtext = "Your AI assistant serving you in the vast sea of curiosity."

export function BlurReveal() {
  const words = text.split(" ")  

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.04, delayChildren: 0.2 }}
      className="flex flex-col items-center justify-center w-full"
    >
      <h1 className="mb-6 text-5xl font-semibold md:text-6xl text-white font-playfair text-center">
        {words.map((word, index) => (
          <React.Fragment key={index}>
            <motion.span 
              className="inline-block" 
              transition={{ ...transition, delay: index * 0.1 }}
              variants={variants}
            >
              {word}
            </motion.span>
            {index < words.length - 1 && ' '}
          </React.Fragment>
        ))}
      </h1>
      <motion.p 
        className="text-zinc-400 text-lg font-bold font-poppins text-center max-w-lg mx-auto" 
        transition={{ ...transition, delay: words.length * 0.1 + 0.2 }}
        variants={variants}
      >
        {subtext}
      </motion.p>
    </motion.div>
  )
} 