"use client"

import { cn } from "@/lib/utils"

interface CodeCardProps {
  language: string
  code: string
}

export function CodeCard({ language, code }: CodeCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-ring overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(code)}
          className="flex h-6 items-center justify-center rounded-md px-2 text-xs text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-all duration-150"
        >
          Copy
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="text-foreground/80">{code}</code>
      </pre>
    </div>
  )
}
