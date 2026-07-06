"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface InstallationTabsProps {
  item?: string
  children: ReactNode
}

export function InstallationTabs({ item, children }: InstallationTabsProps) {
  const [activeTab, setActiveTab] = useState<"cli" | "manual">("cli")

  return (
    <div className="my-6">
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("cli")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-out",
            activeTab === "cli"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          CLI
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-out",
            activeTab === "manual"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Manual
        </button>
      </div>
      <div>
        {activeTab === "cli" && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 font-mono text-sm">
            <pre className="text-muted-foreground">
              <code>npx shadcn@latest add https://kbd.spell-ui.dev/r/kbd.json</code>
            </pre>
          </div>
        )}
        {activeTab === "manual" && (
          <div className="rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
