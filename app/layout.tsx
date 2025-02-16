import { AuthStatus } from '@/components/auth-status'
import Footer from '@/components/footer'
import Header from '@/components/header'
import { ClientProviders } from '@/components/providers/client-providers'
import { SessionProvider } from '@/components/providers/session-provider'
import { Sidebar } from '@/components/sidebar'
import { cn } from '@/lib/utils'
import type { Metadata, Viewport } from 'next'
import { Inter as FontSans, Playfair_Display, Poppins } from 'next/font/google'
import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-poppins'
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair'
})

const title = 'AtherAgent'
const description =
  'A fully open-source AI-powered answer engine with a generative UI.'

export const metadata: Metadata = {
  metadataBase: new URL('https://atherlabs.com'),
  title,
  description,
  openGraph: {
    title,
    description
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    creator: '@miiura'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const enableSaveChatHistory =
    process.env.NEXT_PUBLIC_ENABLE_SAVE_CHAT_HISTORY === 'true'
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'font-sans antialiased',
        fontSans.variable,
        poppins.variable,
        playfair.variable
      )}>
        <SessionProvider>
          <ClientProviders>
            <Header />
            {children}
            {enableSaveChatHistory && <Sidebar />}
            <AuthStatus />
            <Footer />
          </ClientProviders>
        </SessionProvider>
      </body>
    </html>
  )
}
