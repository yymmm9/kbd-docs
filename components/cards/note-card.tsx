"use client"

import { cn, type NoteVariant } from "@/lib/utils"

interface NoteCardProps {
  variant: NoteVariant
  content: string
}

const variantConfig: Record<NoteVariant, { icon: string; label: string; border: string; bg: string; iconBg: string; text: string }> = {
  info: {
    icon: "i",
    label: "Info",
    border: "border-sky-500/30",
    bg: "bg-sky-500/[0.04]",
    iconBg: "bg-sky-500/15 text-sky-500 dark:text-sky-400",
    text: "text-sky-600 dark:text-sky-300/90",
  },
  warning: {
    icon: "!",
    label: "Warning",
    border: "border-amber-500/30",
    bg: "bg-amber-500/[0.04]",
    iconBg: "bg-amber-500/15 text-amber-500 dark:text-amber-400",
    text: "text-amber-600 dark:text-amber-300/90",
  },
  tip: {
    icon: "★",
    label: "Tip",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/[0.04]",
    iconBg: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
    text: "text-emerald-600 dark:text-emerald-300/90",
  },
  danger: {
    icon: "✕",
    label: "Danger",
    border: "border-red-500/30",
    bg: "bg-red-500/[0.04]",
    iconBg: "bg-red-500/15 text-red-500 dark:text-red-400",
    text: "text-red-600 dark:text-red-300/90",
  },
}

export function NoteCard({ variant, content }: NoteCardProps) {
  const cfg = variantConfig[variant]

  return (
    <div className={cn("rounded-xl border-l-[3px] p-4", cfg.border, cfg.bg)}>
      <div className="flex items-start gap-3">
        <span className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          cfg.iconBg
        )}>
          {cfg.icon}
        </span>
        <div className="min-w-0">
          <span className={cn("text-sm font-semibold", cfg.text)}>{cfg.label}</span>
          <p className="mt-1 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </div>
    </div>
  )
}
