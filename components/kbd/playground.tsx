"use client"

import { useState, useCallback } from "react"
import { useQueryState } from "nuqs"
import { Kbd } from "@/components/ui/kbd"
import { DemoCanvas } from "@/docs/demo-canvas"
import { DemoPreview } from "@/docs/demo-preview"
import { cn, parseCombosParam, serializeCombos } from "@/lib/utils"

export function Playground() {
  const [rawCombos, setRawCombos] = useQueryState("combos")
  const combos = parseCombosParam(rawCombos)

  const setCombos = useCallback(
    (next: string[][]) => {
      setRawCombos(next.length > 0 ? serializeCombos(next) : null)
    },
    [setRawCombos]
  )
  const [input, setInput] = useState("")
  const [copied, setCopied] = useState(false)

  const addCombo = useCallback(() => {
    const raw = input.trim().toLowerCase()
    if (!raw) return
    const keys = raw
      .split("+")
      .map((s) => s.trim())
      .filter(Boolean)
    if (keys.length === 0) return
    setCombos([...combos, keys])
    setInput("")
  }, [input, combos, setCombos])

  const removeCombo = useCallback(
    (index: number) => {
      setCombos(combos.filter((_, i) => i !== index))
    },
    [combos, setCombos]
  )

  const copyShareUrl = useCallback(async () => {
    const url = new URL(window.location.href)
    url.searchParams.set("combos", serializeCombos(combos))
    await navigator.clipboard.writeText(url.toString())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [combos])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addCombo()
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Playground
      </h2>
      <p className="text-muted-foreground mb-6">
        Add, remove, and share keyboard shortcut combinations via URL. Try
        adding <Code>cmd+K</Code> or <Code>ctrl+shift+P</Code>.
      </p>

      <DemoCanvas>
        <DemoPreview>
          {combos.length === 0 ? (
            <p className="text-sm text-muted-foreground/50">
              No shortcuts yet. Add one below.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              {combos.map((keys, i) => (
                <div key={i} className="group relative">
                  <Kbd keys={keys} />
                  <button
                    type="button"
                    onClick={() => removeCombo(i)}
                    className={cn(
                      "absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center",
                      "rounded-full bg-muted-foreground/20 text-muted-foreground/50",
                      "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                      "hover:bg-destructive/80 hover:text-destructive-foreground text-[10px] font-bold leading-none"
                    )}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </DemoPreview>
        <div className="border-t border-border/60 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. cmd+K'
              className={cn(
                "flex-1 h-9 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm",
                "placeholder:text-muted-foreground/40",
                "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                "transition-all duration-150"
              )}
            />
            <button
              type="button"
              onClick={addCombo}
              disabled={!input.trim()}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium",
                "border border-border/60 bg-muted/50 text-muted-foreground",
                "hover:bg-muted hover:text-foreground",
                "disabled:opacity-30 disabled:pointer-events-none",
                "transition-all duration-150 active:scale-[0.97]"
              )}
            >
              Add
            </button>
            <button
              type="button"
              onClick={copyShareUrl}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium",
                "bg-primary/10 text-primary border border-primary/20",
                "hover:bg-primary/20",
                "transition-all duration-150 active:scale-[0.97]",
                copied && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              )}
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/50">
            Separate keys with <Code>+</Code> and press Enter to add. The URL
            updates automatically — share it to export your shortcuts.
          </p>
        </div>
      </DemoCanvas>
    </section>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-muted/50 px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
  )
}
