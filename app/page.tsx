'use client'

import { useEffect } from 'react'
import Block from "@/components/chat/Block"
import { PwaPrompt } from "@/components/PwaPrompt"
import { registerServiceWorker } from "@/lib/pwa"

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