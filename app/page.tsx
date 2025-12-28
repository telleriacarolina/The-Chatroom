'use client'

import { useEffect } from 'react'
import Block from "@/components/chat/Block"
import { PwaPrompt } from "@/components/PwaPrompt"
import { registerServiceWorker } from "@/lib/pwa"

<<<<<<< HEAD
export default function Page() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <>
      <Block />
      <PwaPrompt />
    </>
  )
}
=======
export default function Home() {
  return (
    <main>
      <Block />
    </main>
  );
}
>>>>>>> origin/main
