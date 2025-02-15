import { Background } from '@/components/background'
import Footer from '@/components/footer'
import { CommandProviderWrapper } from '@/components/providers/command-provider-wrapper'
import { Sidebar } from '@/components/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChatSessionProvider } from '@/lib/contexts/chat-session-context'
import { ResearchProvider } from '@/lib/contexts/research-context'
import { SidebarProvider } from '@/lib/contexts/sidebar-context'
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

  console.debug('[RootLayout] Rendering with enableSaveChatHistory:', enableSaveChatHistory)

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message.includes('ethereum') || e.message.includes('web3')) {
                  e.preventDefault();
                  console.debug('Prevented Web3 wallet injection error');
                }
                console.debug('[RootLayout] Error:', e.message);
              });
            `
          }}
        />
      </head>
      <body className={cn(
        'font-sans antialiased',
        fontSans.variable,
        poppins.variable,
        playfair.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ResearchProvider>
            <ChatSessionProvider>
              <SidebarProvider>
                <CommandProviderWrapper>
                  <Background />
                  {children}
                  {enableSaveChatHistory && <Sidebar />}
                  <Footer />
                  <Toaster />
                </CommandProviderWrapper>
              </SidebarProvider>
            </ChatSessionProvider>
          </ResearchProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
