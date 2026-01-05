'use client'

import React from 'react'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
          <h2 className="text-xl font-semibold">A fatal error occurred</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-white hover:opacity-90"
            >
              Reload app
            </button>
            <a
              href="/"
              className="inline-flex items-center rounded-md border px-3 py-2 hover:bg-muted"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
