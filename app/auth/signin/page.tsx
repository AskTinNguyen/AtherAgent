'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function SignIn() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn('credentials', {
      username,
      password,
      callbackUrl: '/'
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground">Use demo/demo to sign in</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
} 