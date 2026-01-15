import type { Metadata } from 'next'
import { ReactNode } from 'react'
import '../styles/globals.css'
import { ThemeToggle } from '@/components/ThemeToggle'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'The Chatroom',
  description: 'Real-time chat application with multi-language support',
}

/**
 * Root Layout Component
 * 
 * Styled with new burgundy color palette (#700303 background)
 * Features responsive design, theme support, and accessibility
 */
export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-burgundy text-foreground antialiased">
        <Toaster richColors position="top-center" />
        <ErrorBoundary>
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
