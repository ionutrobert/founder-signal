"use client"

import { ErrorDisplay } from "@/components/error-display"

type AppErrorProps = {
  error: Error
  reset: () => void
}

export default function GlobalError({ reset }: AppErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100 px-4 py-10">
      <ErrorDisplay
        message="We had trouble loading this page. Please try again."
        onRetry={reset}
      />
    </div>
  )
}
