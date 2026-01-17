import type { Metadata } from 'next'
import Block from '@/components/chat/Block'

export const metadata: Metadata = {
  title: 'The Chatroom',
  description: 'Real-time chat with language-specific lounges',
}

export default function Home() {
  return (
    <main>
      <Block />
    </main>
  )
}
