"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useQueryState } from "nuqs"
import { Kbd } from "@/components/ui/kbd"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  cn,
  type Shortcut,
  createShortcutId,
  exportShortcutsAsText,
  parseImportText,
  normalizeKeys,
} from "@/lib/utils"

// ── Hook: track pressed keys globally ─────────────────────────

function useGlobalKeyTrap(active: boolean, onTrigger?: () => void) {
  const pressedRef = useRef(new Set<string>())
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (!active) {
      pressedRef.current.clear()
      forceRender((n) => n + 1)
      return
    }

    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      e.stopPropagation()
      const key = e.key.toLowerCase()
      if (!pressedRef.current.has(key)) {
        pressedRef.current = new Set(pressedRef.current).add(key)
        forceRender((n) => n + 1)
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      if (pressedRef.current.has(key)) {
        const next = new Set(pressedRef.current)
        next.delete(key)
        pressedRef.current = next
        forceRender((n) => n + 1)
      }
    }

    function onBlur() {
      pressedRef.current.clear()
      forceRender((n) => n + 1)
    }

    window.addEventListener("keydown", onKeyDown, { capture: true })
    window.addEventListener("keyup", onKeyUp, { capture: true })
    window.addEventListener("blur", onBlur)
    // Also prevent browser context menu / default on keypress
    window.addEventListener("keypress", (e) => e.preventDefault(), { capture: true })

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true })
      window.removeEventListener("keyup", onKeyUp, { capture: true })
      window.removeEventListener("blur", onBlur)
    }
  }, [active])

  return pressedRef.current
}

// ── Hook: multi-combo match detection ─────────────────────────

function useAnyComboMatch(
  combos: { listenKey: string }[][],
  pressedKeys: Set<string>
): boolean {
  return combos.some(
    (combo) => combo.length > 0 && combo.every((k) => pressedKeys.has(k.listenKey))
  )
}

// ── Component ─────────────────────────────────────────────────

export function ShortcutManager() {
  const [rawData] = useQueryState("s")

  // Local state for shortcuts — decoupled from URL so editing doesn't pollute it
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    try {
      return rawData ? JSON.parse(rawData) : []
    } catch {
      return []
    }
  })

  // Sync from URL on page load / external URL change
  useEffect(() => {
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData)
        if (Array.isArray(parsed)) {
          setShortcuts(parsed)
        }
      } catch {}
    }
  }, [rawData])

  const [keysInput, setKeysInput] = useState("")
  const [actionInput, setActionInput] = useState("")
  const [descriptionInput, setDescriptionInput] = useState("")
  const [groupInput, setGroupInput] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [copiedTxt, setCopiedTxt] = useState(false)
  const [importText, setImportText] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [testMode, setTestMode] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pressedKeys = useGlobalKeyTrap(testMode)

  // ── helpers ──

  const parseKeys = useCallback((raw: string) => {
    const rawCombos = raw.split(" ").filter(Boolean)
    const combos = rawCombos.map((combo) =>
      combo
        .toLowerCase()
        .split("+")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    return combos
  }, [])

  const resetForm = useCallback(() => {
    setKeysInput("")
    setActionInput("")
    setDescriptionInput("")
    setGroupInput("")
    setEditingId(null)
  }, [])

  const startEdit = useCallback(
    (shortcut: Shortcut) => {
      const combos = [shortcut.keys, ...(shortcut.alts || [])]
        .map((c) => c.join("+"))
        .join(" ")
      setKeysInput(combos)
      setActionInput(shortcut.action)
      setDescriptionInput(shortcut.description)
      setGroupInput(shortcut.group || "")
      setEditingId(shortcut.id)
    },
    []
  )

  const saveShortcut = useCallback(() => {
    const combos = parseKeys(keysInput)
    const keys = combos[0] || []
    const alts = combos.length > 1 ? combos.slice(1) : undefined
    const group = groupInput.trim() || undefined
    if (keys.length === 0 || !actionInput.trim()) return

    if (editingId) {
      setShortcuts(
        shortcuts.map((s) =>
          s.id === editingId
            ? {
                ...s,
                keys,
                alts,
                group,
                action: actionInput.trim(),
                description: descriptionInput.trim(),
              }
            : s
        )
      )
    } else {
      setShortcuts([
        ...shortcuts,
        {
          id: createShortcutId(),
          keys,
          alts,
          group,
          action: actionInput.trim(),
          description: descriptionInput.trim(),
        },
      ])
    }
    resetForm()
  }, [keysInput, actionInput, descriptionInput, groupInput, editingId, shortcuts, setShortcuts, parseKeys, resetForm])

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
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }, [shortcuts])

  const handleExportJson = useCallback(async () => {
    const text = JSON.stringify(shortcuts, null, 2)
    await navigator.clipboard.writeText(text)
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }, [shortcuts])

  const handleExportText = useCallback(async () => {
    const text = exportShortcutsAsText(shortcuts)
    await navigator.clipboard.writeText(text)
    setCopiedTxt(true)
    setTimeout(() => setCopiedTxt(false), 2000)
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
            const imported = parsed
              .map((s: Partial<Shortcut>) => ({
                id: createShortcutId(),
                keys: s.keys || [],
                action: s.action || "",
                description: s.description || "",
                alts: s.alts,
                group: s.group,
              }))
              .filter((s) => s.keys.length > 0 && s.action)
            setShortcuts([...shortcuts, ...imported])
          }
        } catch {
          const parsed = parseImportText(text)
          if (parsed.length > 0) {
            const imported = parsed.map((s) => ({ id: createShortcutId(), ...s }))
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
        const imported = parsed
          .map((s: Partial<Shortcut>) => ({
            id: createShortcutId(),
            keys: s.keys || [],
            action: s.action || "",
            description: s.description || "",
            alts: s.alts,
            group: s.group,
          }))
          .filter((s) => s.keys.length > 0 && s.action)
        setShortcuts([...shortcuts, ...imported])
        setImportText("")
        setShowImport(false)
        return
      }
    } catch {
      /* not JSON */
    }

    const parsed = parseImportText(importText)
    if (parsed.length > 0) {
      const imported = parsed.map((s) => ({ id: createShortcutId(), ...s }))
      setShortcuts([...shortcuts, ...imported])
      setImportText("")
      setShowImport(false)
    }
  }, [importText, shortcuts, setShortcuts])

  const clearAll = useCallback(() => {
    setShortcuts([])
  }, [setShortcuts])

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveShortcut()
    // Don't prevent default here — only in test mode globally
  }

  const parsedCombos = keysInput.trim() ? parseKeys(keysInput) : []
  const previewKeys = parsedCombos[0] || []

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm text-primary mb-6">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            Shortcuts
          </div>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Shortcut Cheatsheet
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl">
                Define your keyboard shortcuts with descriptions, then test them
                live. Share via URL, JSON, or plain text.
              </p>
            </div>
            <div className="flex-shrink-0 pt-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        {/* ── Test Mode Banner (always in DOM, no layout shift) ── */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out will-change-[max-height,opacity,margin]"
          style={{
            maxHeight: testMode ? '200px' : '0',
            opacity: testMode ? 1 : 0,
            marginBottom: testMode ? '2rem' : '0',
          }}
        >
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 text-sm font-bold">
                  !
                </span>
                <p className="text-sm text-amber-600 dark:text-amber-300/90 font-medium leading-snug">
                  Test Mode active — all keyboard input is intercepted.
                  Press any shortcut combination to see it light up.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTestMode(false)}
                className={cn(
                  "inline-flex shrink-0 h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                  "border border-amber-500/30 text-amber-600 dark:text-amber-300/80 hover:bg-amber-500/10",
                  "transition-all duration-150"
                )}
              >
                Stop
              </button>
            </div>
          </div>
        </div>

        {/* ── Add / Edit Form ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Edit Shortcut" : "Add Shortcut"}
            </h2>
            <button
              type="button"
              onClick={() => setTestMode((v) => !v)}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold",
                "transition-all duration-150 active:scale-[0.97]",
                testMode
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-muted/50 text-muted-foreground border border-border/60 hover:bg-muted hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "mr-2 inline-block h-2 w-2 rounded-full",
                  testMode ? "bg-amber-400 animate-pulse" : "bg-muted-foreground/40"
                )}
              />
              {testMode ? "Testing..." : "Test Mode"}
            </button>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-ring">
            <div className="grid gap-4 sm:grid-cols-[1fr_1.5fr]">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Key Combination
                </label>
                <input
                  type="text"
                  value={keysInput}
                  onChange={(e) => setKeysInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="win+shift+arrowLeft win+shift+arrowRight"
                  className={cn(
                    "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base font-mono",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
                {previewKeys.length > 0 && (
                  <div className="mt-2">
                    <Kbd keys={previewKeys} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Action
                </label>
                <input
                  type="text"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Move window to next monitor"
                  className={cn(
                    "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
              </div>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Move the active window to the adjacent monitor"
                  className={cn(
                    "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Group
                </label>
                <input
                  type="text"
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Window Management"
                  className={cn(
                    "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={saveShortcut}
                disabled={!keysInput.trim() || !actionInput.trim()}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold",
                  "bg-primary text-primary-foreground",
                  "hover:brightness-110",
                  "disabled:opacity-30 disabled:pointer-events-none",
                  "transition-all duration-150 active:scale-[0.97]"
                )}
              >
                {editingId ? "Save" : "Add Shortcut"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium",
                    "border border-border/60 bg-muted/50 text-muted-foreground",
                    "hover:bg-muted hover:text-foreground",
                    "transition-all duration-150"
                  )}
                >
                  Cancel
                </button>
              )}
              {!editingId && keysInput.trim() && actionInput.trim() && (
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
            <div className="flex items-center gap-2 flex-wrap">
              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-border/60 bg-muted/50 p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all duration-150",
                    viewMode === "list"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all duration-150",
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>
              </div>
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
                  "border border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  "transition-all duration-150 active:scale-[0.97]",
                  copiedUrl &&
                    "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                )}
              >
                {copiedUrl ? "Copied!" : "Copy URL"}
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                disabled={shortcuts.length === 0}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                  "border transition-all duration-150 active:scale-[0.97]",
                  copiedJson
                    ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  "disabled:opacity-30 disabled:pointer-events-none"
                )}
              >
                {copiedJson ? "Copied!" : "JSON"}
              </button>
              <button
                type="button"
                onClick={handleExportText}
                disabled={shortcuts.length === 0}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                  "border transition-all duration-150 active:scale-[0.97]",
                  copiedTxt
                    ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  "disabled:opacity-30 disabled:pointer-events-none"
                )}
              >
                {copiedTxt ? "Copied!" : "TXT"}
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
                <span className="text-sm font-medium text-foreground">
                  Import Shortcuts
                </span>
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
                placeholder={
                  "Paste JSON or text format:\ncmd+K | Toggle Command Palette | Open the palette\nctrl+S | Save | Save current file"
                }
                rows={4}
                className={cn(
                  "w-full rounded-xl border border-border/60 bg-muted/30 p-4 text-base font-mono",
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
                  Supports JSON Array or{" "}
                  <code className="text-foreground/70">keys | action | description</code>{" "}
                  format
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

          {/* Shortcut Cards — grouped */}
          {shortcuts.length > 0 && (
            <>
              {(() => {
                const grouped: Record<string, Shortcut[]> = {}
                shortcuts.forEach((s) => {
                  const g = s.group || "Ungrouped"
                  if (!grouped[g]) grouped[g] = []
                  grouped[g].push(s)
                })
                const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
                  if (a === "Ungrouped") return 1
                  if (b === "Ungrouped") return -1
                  return a.localeCompare(b)
                })
                return sortedGroups.map(([groupName, groupShortcuts]) => (
                  <div key={groupName} className="mb-8 last:mb-0">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-base font-semibold text-foreground/80">
                        {groupName}
                      </h3>
                      <span className="text-xs text-muted-foreground/50 font-medium px-2 py-0.5 rounded-full bg-muted/50 border border-border/40">
                        {groupShortcuts.length}
                      </span>
                    </div>
                    <div
                      className={cn(
                        viewMode === "list"
                          ? "space-y-4"
                          : "grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5"
                      )}
                    >
                      {groupShortcuts.map((shortcut) => (
                        <ShortcutCard
                          key={shortcut.id}
                          shortcut={shortcut}
                          pressedKeys={pressedKeys}
                          testMode={testMode}
                          viewMode={viewMode}
                          onEdit={startEdit}
                          onRemove={removeShortcut}
                        />
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </>
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

// ── Shortcut Card ─────────────────────────────────────────────

function ShortcutCard({
  shortcut,
  pressedKeys,
  testMode,
  viewMode,
  onEdit,
  onRemove,
}: {
  shortcut: Shortcut
  pressedKeys: Set<string>
  testMode: boolean
  viewMode: "list" | "grid"
  onEdit: (shortcut: Shortcut) => void
  onRemove: (id: string) => void
}) {
  // Memoize all combos (primary + alts)
  const combosRef = useRef<string[][] | null>(null)
  if (combosRef.current === null) {
    combosRef.current = [shortcut.keys, ...(shortcut.alts || [])]
  }
  const normalizedCombos = useMemo(
    () => combosRef.current!.map((c) => normalizeKeys(c)),
    []
  )
  const matched = useAnyComboMatch(normalizedCombos, pressedKeys)

  // Build rendered combo chunks: each is either a Kbd or an "or" span
  const comboElements = useMemo(() => {
    const elements: React.ReactNode[] = []
    combosRef.current!.forEach((combo, i) => {
      if (i > 0) {
        elements.push(
          <span key={`or-${i}`} className="text-muted-foreground/40 text-sm font-medium mx-1 select-none">
            or
          </span>
        )
      }
      elements.push(
        <Kbd key={`combo-${i}`} keys={combo} pressedKeys={testMode ? pressedKeys : undefined} />
      )
    })
    return elements
  }, [testMode, pressedKeys])

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card transition-all duration-150",
        testMode && matched
          ? "border-primary/40 bg-primary/[0.04] shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_4px_20px_rgba(124,92,252,0.08)]"
          : "border-border/60 shadow-ring hover:shadow-ring-lg",
        viewMode === "list" ? "flex items-start gap-6 p-6" : "flex flex-col gap-4 p-6"
      )}
    >
      {/* Top-right actions — always visible on touch, hover on desktop */}
      <div
        className={cn(
          "flex items-center gap-1",
          viewMode === "list"
            ? "absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-all duration-150"
            : "absolute right-3 top-3"
        )}
      >
        <button
          type="button"
          onClick={() => onEdit(shortcut)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            "text-muted-foreground/40 hover:text-foreground hover:bg-muted/60",
            "transition-all duration-150"
          )}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onRemove(shortcut.id)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            "text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10",
            "transition-all duration-150 text-base"
          )}
        >
          ×
        </button>
      </div>

      {/* Keys */}
      <div className={cn("flex flex-wrap items-center gap-1", viewMode === "grid" ? "" : "flex-shrink-0 pt-0.5")}>
        {comboElements}
      </div>

      {/* Text */}
      <div className={cn("flex-1 min-w-0", viewMode === "grid" && "pr-8")}>
        <h3 className="text-lg font-semibold text-foreground leading-snug">
          {shortcut.action}
        </h3>
        {shortcut.description && (
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {shortcut.description}
          </p>
        )}
      </div>
    </div>
  )
}
