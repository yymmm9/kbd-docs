"use client"

import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  description?: string
}

export function SectionCard({ title, description }: SectionCardProps) {
  return (
    <div className="py-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border/40" />
        <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
        <div className="h-px flex-1 bg-border/40" />
      </div>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground/70 text-center max-w-lg mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}
