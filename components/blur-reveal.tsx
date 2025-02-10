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
      whileInView="visible"
      transition={{ staggerChildren: 0.04 }}
      className="text-center"
    >
      <h1 className="mb-6 text-5xl font-semibold md:text-6xl text-white font-playfair">
        {words.map((word, index) => (
          <React.Fragment key={index}>
            <motion.span className="inline-block" transition={transition} variants={variants}>
              {word}
            </motion.span>
            {index < words.length - 1 && ' '}
          </React.Fragment>
        ))}
      </h1>
      <motion.p className="text-zinc-400 text-lg font-bold font-poppins" transition={transition} variants={variants}>
        {subtext}
      </motion.p>
    </motion.div>
  )
} 