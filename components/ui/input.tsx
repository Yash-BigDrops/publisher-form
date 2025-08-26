import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-color-muted-foreground selection:bg-color-primary selection:text-color-primary-foreground border-color-border flex h-12 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-blue-400 focus-visible:ring-blue-400/50 focus-visible:ring-[2px] focus-visible:ring-offset-0",
        "aria-invalid:ring-color-destructive/20 aria-invalid:border-color-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
