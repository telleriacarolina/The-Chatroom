'use client'

import React from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {error?.message || 'An unexpected error occurred while rendering this page.'}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-white hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center rounded-md border px-3 py-2 hover:bg-muted"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
