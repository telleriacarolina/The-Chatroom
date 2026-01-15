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
 * Note: This is a simplified layout. Theme support and other features
 * can be added later without affecting the loading-state pattern.
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
      <body>
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
