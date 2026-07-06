"use client"

import { useState } from "react"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

export function Demo() {
  const [isListening, setIsListening] = useState(false)

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Kbd keys={["cmd", "K"]} listenToKeyboard />
      </div>
      <button
        type="button"
        onClick={() => setIsListening(!isListening)}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-all duration-150 ease-out",
          "border border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
          "active:scale-[0.97]"
        )}
      >
        {isListening ? "Stop Listening" : "Listen for Keys"}
      </button>
    </div>
  )
}
