import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-36 w-full rounded-[calc(var(--radius)+0.5rem)] border border-input bg-card px-5 py-4 text-base shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,transform] duration-200 outline-none placeholder:text-muted-foreground/80 focus-visible:-translate-y-0.5 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
