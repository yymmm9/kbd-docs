"use client"

import { useState, useCallback, useRef } from "react"
import { useQueryState } from "nuqs"
import { Kbd } from "@/components/ui/kbd"
import { cn, type Shortcut, createShortcutId, exportShortcutsAsText, parseImportText } from "@/lib/utils"

export function ShortcutManager() {
  const [rawData, setRawData] = useQueryState("s")
  const shortcuts: Shortcut[] = rawData ? (() => { try { return JSON.parse(rawData) } catch { return [] } })() : []
  const setShortcuts = useCallback(
    (next: Shortcut[]) => {
      setRawData(next.length > 0 ? JSON.stringify(next) : null)
    },
    [setRawData]
  )
  const [keysInput, setKeysInput] = useState("")
  const [actionInput, setActionInput] = useState("")
  const [descriptionInput, setDescriptionInput] = useState("")
  const [copied, setCopied] = useState(false)
  const [importText, setImportText] = useState("")
  const [showImport, setShowImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addShortcut = useCallback(() => {
    const raw = keysInput.trim().toLowerCase()
    if (!raw || !actionInput.trim()) return
    const keys = raw.split("+").map((s) => s.trim()).filter(Boolean)
    if (keys.length === 0) return

    setShortcuts([
      ...shortcuts,
      {
        id: createShortcutId(),
        keys,
        action: actionInput.trim(),
        description: descriptionInput.trim(),
      },
    ])
    setKeysInput("")
    setActionInput("")
    setDescriptionInput("")
  }, [keysInput, actionInput, descriptionInput, shortcuts, setShortcuts])

  const removeShortcut = useCallback(
    (id: string) => {
      setShortcuts(shortcuts.filter((s) => s.id !== id))
    },
    [shortcuts, setShortcuts]
  )

  const copyShareUrl = useCallback(async () => {
    const url = new URL(window.location.href)
    url.searchParams.set("s", JSON.stringify(shortcuts))
    await navigator.clipboard.writeText(url.toString())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shortcuts])

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(shortcuts, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "shortcuts.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [shortcuts])

  const handleExportText = useCallback(() => {
    const blob = new Blob([exportShortcutsAsText(shortcuts)], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "shortcuts.txt"
    a.click()
    URL.revokeObjectURL(url)
  }, [shortcuts])

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            const imported = parsed.map((s: Partial<Shortcut>) => ({
              id: createShortcutId(),
              keys: s.keys || [],
              action: s.action || "",
              description: s.description || "",
            })).filter((s) => s.keys.length > 0 && s.action)
            setShortcuts([...shortcuts, ...imported])
          }
        } catch {
          const parsed = parseImportText(text)
          if (parsed.length > 0) {
            const imported = parsed.map((s) => ({
              id: createShortcutId(),
              ...s,
            }))
            setShortcuts([...shortcuts, ...imported])
          }
        }
      }
      reader.readAsText(file)
      e.target.value = ""
    },
    [shortcuts, setShortcuts]
  )

  const handleImportText = useCallback(() => {
    try {
      const parsed = JSON.parse(importText)
      if (Array.isArray(parsed)) {
        const imported = parsed.map((s: Partial<Shortcut>) => ({
          id: createShortcutId(),
          keys: s.keys || [],
          action: s.action || "",
          description: s.description || "",
        })).filter((s) => s.keys.length > 0 && s.action)
        setShortcuts([...shortcuts, ...imported])
        setImportText("")
        setShowImport(false)
        return
      }
    } catch { /* not JSON */ }

    const parsed = parseImportText(importText)
    if (parsed.length > 0) {
      const imported = parsed.map((s) => ({
        id: createShortcutId(),
        ...s,
      }))
      setShortcuts([...shortcuts, ...imported])
      setImportText("")
      setShowImport(false)
    }
  }, [importText, shortcuts, setShortcuts])

  const clearAll = useCallback(() => {
    setShortcuts([])
  }, [setShortcuts])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addShortcut()
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm text-primary mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            Shortcuts
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Shortcut Cheatsheet
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Define your keyboard shortcuts with names and descriptions.
            Share them with anyone via URL, JSON, or plain text.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        {/* ── Add Form ── */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Add Shortcut</h2>
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-ring">
            <div className="grid gap-4 sm:grid-cols-[1fr_1.5fr]">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Key Combination</label>
                <input
                  type="text"
                  value={keysInput}
                  onChange={(e) => setKeysInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='cmd+K'
                  className={cn(
                    "w-full h-10 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm font-mono",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
                {keysInput.trim() && (() => {
                  const keys = keysInput.trim().toLowerCase().split("+").filter(Boolean)
                  if (keys.length === 0) return null
                  return (
                    <div className="mt-2">
                      <Kbd keys={keys} />
                    </div>
                  )
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Action</label>
                <input
                  type="text"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Toggle Command Palette"
                  className={cn(
                    "w-full h-10 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <input
                type="text"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Open the command palette to search and run commands"
                className={cn(
                  "w-full h-10 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm",
                  "placeholder:text-muted-foreground/40",
                  "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                  "transition-all duration-150"
                )}
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={addShortcut}
                disabled={!keysInput.trim() || !actionInput.trim()}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold",
                  "bg-primary text-primary-foreground",
                  "hover:brightness-110",
                  "disabled:opacity-30 disabled:pointer-events-none",
                  "transition-all duration-150 active:scale-[0.97]"
                )}
              >
                Add Shortcut
              </button>
              {keysInput.trim() && actionInput.trim() && (
                <span className="text-xs text-muted-foreground/50">Press Enter ↵</span>
              )}
            </div>
          </div>
        </section>

        {/* ── Shortcut List ── */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Shortcuts
              {shortcuts.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal">
                  ({shortcuts.length})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowImport(!showImport)}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                  "border border-border/60 bg-muted/50 text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  "transition-all duration-150"
                )}
              >
                Import
              </button>
              <button
                type="button"
                onClick={copyShareUrl}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                  "border border-border/60 bg-muted/50 text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  "transition-all duration-150",
                  copied && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                )}
              >
                {copied ? "Copied!" : "Copy URL"}
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                disabled={shortcuts.length === 0}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                  "border border-border/60 bg-muted/50 text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  "disabled:opacity-30 disabled:pointer-events-none",
                  "transition-all duration-150"
                )}
              >
                JSON
              </button>
              <button
                type="button"
                onClick={handleExportText}
                disabled={shortcuts.length === 0}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                  "border border-border/60 bg-muted/50 text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  "disabled:opacity-30 disabled:pointer-events-none",
                  "transition-all duration-150"
                )}
              >
                TXT
              </button>
              {shortcuts.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className={cn(
                    "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                    "text-destructive hover:bg-destructive/10",
                    "transition-all duration-150"
                  )}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Import Panel */}
          {showImport && (
            <div className="mb-6 rounded-xl border border-border/60 bg-card p-4 shadow-ring">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Import Shortcuts</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-medium",
                      "border border-border/60 bg-muted/50 text-muted-foreground",
                      "hover:bg-muted hover:text-foreground",
                      "transition-all duration-150"
                    )}
                  >
                    From File
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt"
                onChange={handleImportFile}
                className="hidden"
              />
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste JSON or text format:&#10;cmd+K | Toggle Command Palette | Open the palette&#10;ctrl+S | Save | Save current file"
                rows={4}
                className={cn(
                  "w-full rounded-lg border border-border/60 bg-muted/30 p-3 text-sm font-mono",
                  "placeholder:text-muted-foreground/40",
                  "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                  "transition-all duration-150 resize-none"
                )}
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportText}
                  disabled={!importText.trim()}
                  className={cn(
                    "inline-flex h-8 items-center justify-center rounded-lg px-4 text-xs font-semibold",
                    "bg-primary text-primary-foreground",
                    "hover:brightness-110",
                    "disabled:opacity-30 disabled:pointer-events-none",
                    "transition-all duration-150"
                  )}
                >
                  Import
                </button>
                <span className="text-xs text-muted-foreground/50">
                  Supports JSON Array or <code className="text-foreground/70">keys | action | description</code> format
                </span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {shortcuts.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/40 bg-muted/20 p-12 text-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-3 text-muted-foreground/30"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              <p className="text-sm text-muted-foreground/50">
                No shortcuts yet. Add one above or import from URL / file.
              </p>
            </div>
          )}

          {/* Shortcut Cards */}
          {shortcuts.length > 0 && (
            <div className="space-y-3">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  className={cn(
                    "group flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4",
                    "shadow-ring hover:shadow-ring-lg",
                    "transition-all duration-200"
                  )}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <Kbd keys={shortcut.keys} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      {shortcut.action}
                    </h3>
                    {shortcut.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                        {shortcut.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeShortcut(shortcut.id)}
                    className={cn(
                      "flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-md",
                      "text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10",
                      "opacity-0 group-hover:opacity-100",
                      "transition-all duration-150 text-sm"
                    )}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border/60 mt-24">
        <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8 text-center text-sm text-muted-foreground">
          Shortcut Cheatsheet &mdash; Built with shadcn/ui &amp; Tailwind CSS
        </div>
      </footer>
    </div>
  )
}
