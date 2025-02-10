'use client'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('text-lg', className)} {...props}>
      {'👩‍🦳'}
    </div>
  )
}

export { IconLogo }
