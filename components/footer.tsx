import React from 'react'
import { SiDiscord, SiGithub, SiX } from 'react-icons/si'
import { AuthStatus } from './auth-status'
import { Button } from './ui/button'

const Footer: React.FC = () => {
  return (
    <footer className="w-fit p-1 md:p-2 fixed bottom-0 right-0 hidden lg:block">
      <div className="flex justify-end items-center gap-0">
        <Button
          variant={'ghost'}
          size={'icon'}
          className="text-muted-foreground/50"
        >
          <SiDiscord size={18} />
        </Button>
        <Button
          variant={'ghost'}
          size={'icon'}
          className="text-muted-foreground/50"
        >
          <SiX size={18} />
        </Button>
        <Button
          variant={'ghost'}
          size={'icon'}
          className="text-muted-foreground/50"
        >
          <SiGithub size={18} />
        </Button>
        <AuthStatus />
      </div>
    </footer>
  )
}

export default Footer
