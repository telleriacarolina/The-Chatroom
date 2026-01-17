'use client'

import Block from "@/components/chat/Block"
<<<<<<< HEAD

export default function Home() {
  return (
    <main>
      <Block />
    </main>
  );
}

=======
import { PwaPrompt } from "@/components/PwaPrompt"
import { registerServiceWorker } from "@/lib/pwa"
import ErrorBoundary from "@/components/ui/error-boundary"

export default function Page() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <>
      <ErrorBoundary>
        <Block />
      </ErrorBoundary>
      <PwaPrompt />
    </>
  )
}
>>>>>>> origin/main
