"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ErrorVariant = "default" | "network" | "timeout" | "rate-limit"

const variantMessages: Record<Exclude<ErrorVariant, "default">, string> = {
  network: "Unable to connect. Please check your internet connection.",
  timeout: "The analysis is taking longer than expected. Please try again.",
  "rate-limit": "Too many requests. Please wait a moment and try again.",
}

type ErrorDisplayProps = {
  message: string
  onRetry?: () => void
  variant?: ErrorVariant
}

export function ErrorDisplay({ message, onRetry, variant = "default" }: ErrorDisplayProps) {
  const description = variant === "default" ? message : variantMessages[variant]

  return (
    <div className="flex items-center justify-center px-4 py-6">
      <Card className="w-full max-w-md rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
        <CardContent className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Something went wrong</p>
          <p className="text-lg font-semibold leading-snug text-red-600">{description}</p>
          {onRetry && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={onRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
