import type { Metadata } from 'next'
import '../styles/globals.css'

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
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
