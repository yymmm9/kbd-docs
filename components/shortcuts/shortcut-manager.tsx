"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useQueryState } from "nuqs"
import { Kbd } from "@/components/ui/kbd"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SectionCard } from "@/components/cards/section-card"
import { NoteCard } from "@/components/cards/note-card"
import { CodeCard } from "@/components/cards/code-card"
import {
  cn,
  type Block,
  type BlockType,
  type NoteVariant,
  type Shortcut,
  type SectionBlock,
  type NoteBlock,
  type CodeBlock,
  normalizeBlocks,
  createBlockId,
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
      // Don't prevent default when typing in input/textarea
      const target = e.target as HTMLElement
      const isInput = target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      if (!isInput) {
        e.preventDefault()
        e.stopPropagation()
      }
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

    function onKeyPress(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      if (!isInput) e.preventDefault()
    }

    window.addEventListener("keydown", onKeyDown, { capture: true })
    window.addEventListener("keyup", onKeyUp, { capture: true })
    window.addEventListener("blur", onBlur)
    window.addEventListener("keypress", onKeyPress, { capture: true })

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true })
      window.removeEventListener("keyup", onKeyUp, { capture: true })
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("keypress", onKeyPress, { capture: true })
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

  // Local state for blocks — decoupled from URL so editing doesn't pollute it
  const [blocks, setBlocks] = useState<Block[]>(() => {
    try {
      return rawData ? normalizeBlocks(JSON.parse(rawData)) : []
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
          setBlocks(normalizeBlocks(parsed))
        }
      } catch {}
    }
  }, [rawData])

  // ── Form state ──

  const [blockType, setBlockType] = useState<BlockType>("shortcut")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Shortcut fields
  const [keysInput, setKeysInput] = useState("")
  const [actionInput, setActionInput] = useState("")

  // Shared fields
  const [descriptionInput, setDescriptionInput] = useState("")
  const [groupInput, setGroupInput] = useState("")
  const [groupFocused, setGroupFocused] = useState(false)

  // Section fields
  const [sectionTitleInput, setSectionTitleInput] = useState("")

  // Note fields
  const [noteVariant, setNoteVariant] = useState<NoteVariant>("info")
  const [noteContent, setNoteContent] = useState("")

  // Code fields
  const [codeLanguage, setCodeLanguage] = useState("")
  const [codeContent, setCodeContent] = useState("")
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [copiedTxt, setCopiedTxt] = useState(false)
  const [importText, setImportText] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [testMode, setTestMode] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const isMac = useMemo(() => {
    if (typeof navigator === "undefined") return true
    return /mac|darwin/i.test(navigator.platform)
  }, [])

  // ── Page metadata (custom title / description / editing mode) ──

  const [pageTitle, setPageTitleInner] = useState<string>("Shortcut Cheatsheet")
  const [pageDesc, setPageDescInner] = useState<string>("")
  const [editing, setEditing] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get("t")
    const d = params.get("d")
    if (t) setPageTitleInner(t)
    if (d) setPageDescInner(d)
    setEditing(params.has("edit") || !params.has("s"))
  }, [])

  const setPageTitle = useCallback((val: string) => {
    setPageTitleInner(val)
    const url = new URL(window.location.href)
    if (val && val !== "Shortcut Cheatsheet") url.searchParams.set("t", val)
    else url.searchParams.delete("t")
    window.history.replaceState({}, "", url)
  }, [])

  const setPageDesc = useCallback((val: string) => {
    setPageDescInner(val)
    const url = new URL(window.location.href)
    if (val) url.searchParams.set("d", val)
    else url.searchParams.delete("d")
    window.history.replaceState({}, "", url)
  }, [])

  const toggleEditing = useCallback(() => {
    setEditing((prev) => {
      const next = !prev
      const url = new URL(window.location.href)
      if (next) url.searchParams.set("edit", "1")
      else url.searchParams.delete("edit")
      window.history.replaceState({}, "", url)
      return next
    })
  }, [])

  const existingGroups = useMemo(() => {
    const groups = new Set<string>()
    blocks.forEach((b) => { if (b.group) groups.add(b.group) })
    return Array.from(groups).sort()
  }, [blocks])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const pressedKeys = useGlobalKeyTrap(testMode)

  // ── helpers ──

  const parseKeys = useCallback((raw: string) => {
    const tokens = raw.split(" ").filter(Boolean)
    if (tokens.length === 0) return []

    // First token is the base combo
    const combos: string[][] = []
    combos.push(
      tokens[0]
        .toLowerCase()
        .split("+")
        .map((s) => s.trim())
        .filter(Boolean)
    )

    // Remaining tokens: if they contain "+" use as full combo,
    // otherwise treat as alternative for the last key only
    for (let i = 1; i < tokens.length; i++) {
      if (tokens[i].includes("+")) {
        combos.push(
          tokens[i]
            .toLowerCase()
            .split("+")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      } else {
        // Suffix-only: take base prefix (all but last key) + this key
        const prefix = combos[0].slice(0, -1)
        combos.push([...prefix, tokens[i].toLowerCase()])
      }
    }

    return combos
  }, [])

  const resetForm = useCallback(() => {
    setBlockType("shortcut")
    setKeysInput("")
    setActionInput("")
    setDescriptionInput("")
    setGroupInput("")
    setSectionTitleInput("")
    setNoteVariant("info")
    setNoteContent("")
    setCodeLanguage("")
    setCodeContent("")
    setEditingId(null)
  }, [])

  const startEdit = useCallback(
    (block: Block) => {
      setBlockType(block.type)
      setGroupInput(block.group || "")
      setEditingId(block.id)

      switch (block.type) {
        case "shortcut": {
          const combos = [block.keys, ...(block.alts || [])]
            .map((c) => c.join("+"))
            .join(" ")
          setKeysInput(combos)
          setActionInput(block.action)
          setDescriptionInput(block.description)
          break
        }
        case "section": {
          setSectionTitleInput(block.title)
          setDescriptionInput(block.description || "")
          break
        }
        case "note": {
          setNoteVariant(block.variant)
          setNoteContent(block.content)
          break
        }
        case "code": {
          setCodeLanguage(block.language)
          setCodeContent(block.code)
          break
        }
      }
    },
    []
  )

  const saveBlock = useCallback(() => {
    const group = groupInput.trim() || undefined
    let newBlock: Block | null = null

    switch (blockType) {
      case "shortcut": {
        const combos = parseKeys(keysInput)
        const keys = combos[0] || []
        const alts = combos.length > 1 ? combos.slice(1) : undefined
        if (keys.length === 0 || !actionInput.trim()) return
        newBlock = {
          id: editingId || createBlockId(),
          type: "shortcut",
          keys, alts, group,
          action: actionInput.trim(),
          description: descriptionInput.trim(),
        }
        break
      }
      case "section": {
        const title = sectionTitleInput.trim()
        if (!title) return
        newBlock = {
          id: editingId || createBlockId(),
          type: "section",
          title,
          description: descriptionInput.trim() || undefined,
          group,
        }
        break
      }
      case "note": {
        const content = noteContent.trim()
        if (!content) return
        newBlock = {
          id: editingId || createBlockId(),
          type: "note",
          variant: noteVariant,
          content,
          group,
        }
        break
      }
      case "code": {
        const code = codeContent.trim()
        if (!code) return
        newBlock = {
          id: editingId || createBlockId(),
          type: "code",
          language: codeLanguage.trim() || "code",
          code,
          group,
        }
        break
      }
    }

    if (!newBlock) return

    setBlocks((prev) =>
      editingId
        ? prev.map((b) => (b.id === editingId ? newBlock! : b))
        : [...prev, newBlock!]
    )
    resetForm()
  }, [
    blockType, keysInput, actionInput, descriptionInput, groupInput,
    sectionTitleInput, noteVariant, noteContent, codeLanguage, codeContent,
    editingId, blocks, setBlocks, parseKeys, resetForm,
  ])

  const removeBlock = useCallback(
    (id: string) => {
      setBlocks(blocks.filter((b) => b.id !== id))
    },
    [blocks, setBlocks]
  )

  const copyShareUrl = useCallback(async () => {
    const url = new URL(window.location.href)
    url.searchParams.set("s", JSON.stringify(blocks))
    await navigator.clipboard.writeText(url.toString())
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }, [blocks])

  const handleExportJson = useCallback(async () => {
    const text = JSON.stringify(blocks, null, 2)
    await navigator.clipboard.writeText(text)
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }, [blocks])

  const handleExportText = useCallback(async () => {
    const onlyShortcuts = blocks.filter((b): b is Shortcut => b.type === "shortcut")
    const text = exportShortcutsAsText(onlyShortcuts)
    await navigator.clipboard.writeText(text)
    setCopiedTxt(true)
    setTimeout(() => setCopiedTxt(false), 2000)
  }, [blocks])

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
            const imported = normalizeBlocks(parsed).map((b) => ({
              ...b,
              id: createBlockId(),
            }))
            setBlocks([...blocks, ...imported])
          }
        } catch {
          const parsed = parseImportText(text)
          if (parsed.length > 0) {
            const imported = parsed.map((s) => ({ ...s, type: "shortcut" as const, id: createBlockId() }))
            setBlocks([...blocks, ...imported])
          }
        }
      }
      reader.readAsText(file)
      e.target.value = ""
    },
    [blocks, setBlocks]
  )

  const handleImportText = useCallback(() => {
    try {
      const parsed = JSON.parse(importText)
      if (Array.isArray(parsed)) {
        const imported = normalizeBlocks(parsed).map((b) => ({
          ...b,
          id: createBlockId(),
        }))
        setBlocks([...blocks, ...imported])
        setImportText("")
        setShowImport(false)
        return
      }
    } catch {
      /* not JSON */
    }

    const parsed = parseImportText(importText)
    if (parsed.length > 0) {
      const imported = parsed.map((s) => ({ ...s, type: "shortcut" as const, id: createBlockId() }))
      setBlocks([...blocks, ...imported])
      setImportText("")
      setShowImport(false)
    }
  }, [importText, blocks, setBlocks])

  const clearAll = useCallback(() => {
    setBlocks([])
  }, [setBlocks])

  const commitRename = useCallback(
    (oldName: string) => {
      const trimmed = renameValue.trim()
      if (!trimmed || trimmed === oldName) {
        setRenamingGroup(null)
        return
      }
      setBlocks((prev) =>
        prev.map((b) => {
          const isUngrouped = oldName === "Ungrouped"
          const match = isUngrouped ? !b.group : b.group === oldName
          return match ? { ...b, group: trimmed } : b
        })
      )
      setRenamingGroup(null)
    },
    [renameValue, setBlocks]
  )

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveBlock()
    // Don't prevent default here — only in test mode globally
  }

  const parsedCombos = keysInput.trim() ? parseKeys(keysInput) : []
  const previewKeys = parsedCombos[0] || []
  const previewElements = useMemo(() => {
    if (parsedCombos.length === 0) return null
    const elements: React.ReactNode[] = []
    const maxVisible = 2
    parsedCombos.forEach((combo, i) => {
      if (i > 0 && i <= maxVisible) {
        elements.push(
          <span key={`or-${i}`} className="text-muted-foreground/40 text-sm font-medium mx-1 select-none">
            or
          </span>
        )
      }
      if (i < maxVisible) {
        elements.push(<Kbd key={`combo-${i}`} keys={combo} isMac={isMac} />)
      }
    })
    if (parsedCombos.length > maxVisible) {
      elements.push(
        <span key="or-more" className="text-muted-foreground/40 text-sm font-medium mx-1 select-none">
          or
        </span>
      )
      elements.push(
        <span key="more-badge" className="inline-flex items-center h-10 px-3 rounded-xl text-xs font-semibold text-muted-foreground/60 bg-muted/40 border border-border/40 select-none">
          {parsedCombos.length - maxVisible} more
        </span>
      )
    }
    return elements
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysInput])

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Page Title"
                  className={cn(
                    "w-full bg-transparent border-none outline-none",
                    "text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl",
                    "placeholder:text-muted-foreground/30"
                  )}
                />
              ) : (
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                  {pageTitle}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {blocks.length > 0 && (
                <button
                  type="button"
                  onClick={toggleEditing}
                  className={cn(
                    "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                    "border transition-all duration-150",
                    editing
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {editing ? "Done" : "Edit"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setTestMode((v) => !v)}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium",
                  "border transition-all duration-150",
                  testMode
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 inline-block h-2 w-2 rounded-full",
                    testMode ? "bg-amber-400 animate-pulse" : "bg-muted-foreground/40"
                  )}
                />
                {testMode ? "Testing..." : "Test"}
              </button>
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

        {/* ── Add / Edit Form (editing mode only) ── */}
        {editing && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Edit Block" : "Add Block"}
            </h2>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-ring">
            {/* Type + Group row */}
            <div className="grid gap-4 sm:grid-cols-[1fr_1.5fr]">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Type
                </label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as BlockType)}
                  className={cn(
                    "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                >
                  <option value="shortcut">Shortcut</option>
                  <option value="section">Section</option>
                  <option value="note">Note</option>
                  <option value="code">Code</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Group
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={groupInput}
                    onChange={(e) => setGroupInput(e.target.value)}
                    onFocus={() => setGroupFocused(true)}
                    onBlur={() => setGroupFocused(false)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Select or type group..."
                    className={cn(
                      "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base",
                      "placeholder:text-muted-foreground/40",
                      "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                      "transition-all duration-150"
                    )}
                  />
                  {groupFocused && existingGroups.some((g) => !groupInput || g.toLowerCase().includes(groupInput.toLowerCase())) && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border/60 bg-card p-1.5 shadow-ring-lg"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {existingGroups
                        .filter((g) => !groupInput || g.toLowerCase().includes(groupInput.toLowerCase()))
                        .map((g) => (
                          <button
                            key={g}
                            type="button"
                            onMouseDown={() => { setGroupInput(g); setGroupFocused(false) }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors duration-100"
                          >
                            {g}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Shortcut fields */}
            {blockType === "shortcut" && (
              <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_1.5fr]">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Key Combination
                  </label>
                  <input
                    type="text"
                    value={keysInput}
                    onChange={(e) => setKeysInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="win+shift+arrowLeft arrowRight"
                    className={cn(
                      "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base font-mono",
                      "placeholder:text-muted-foreground/40",
                      "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                      "transition-all duration-150"
                    )}
                  />
                  {parsedCombos.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center">
                      {previewElements}
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
            )}
            {blockType === "shortcut" && (
              <div className="mt-3">
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
            )}

            {/* Section fields */}
            {blockType === "section" && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={sectionTitleInput}
                  onChange={(e) => setSectionTitleInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Getting Started"
                  className={cn(
                    "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
              </div>
            )}
            {blockType === "section" && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description <span className="text-muted-foreground/40">(optional)</span>
                </label>
                <input
                  type="text"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="A brief overview of this section"
                  className={cn(
                    "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
              </div>
            )}

            {/* Note fields */}
            {blockType === "note" && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Variant
                  </label>
                  <select
                    value={noteVariant}
                    onChange={(e) => setNoteVariant(e.target.value as NoteVariant)}
                    className={cn(
                      "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base",
                      "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                      "transition-all duration-150"
                    )}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="tip">Tip</option>
                    <option value="danger">Danger</option>
                  </select>
                </div>
              </div>
            )}
            {blockType === "note" && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Content
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.shiftKey) saveBlock() }}
                  placeholder="This is an important note for users..."
                  rows={3}
                  className={cn(
                    "w-full rounded-xl border border-border/60 bg-muted/30 p-4 text-base",
                    "placeholder:text-muted-foreground/40 resize-none",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
              </div>
            )}

            {/* Code fields */}
            {blockType === "code" && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Language
                </label>
                <input
                  type="text"
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="javascript, python, bash..."
                  className={cn(
                    "w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-base",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
              </div>
            )}
            {blockType === "code" && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Code
                </label>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.shiftKey) saveBlock() }}
                  placeholder="console.log('hello world');"
                  rows={5}
                  spellCheck={false}
                  className={cn(
                    "w-full rounded-xl border border-border/60 bg-muted/30 p-4 text-base font-mono",
                    "placeholder:text-muted-foreground/40 resize-none",
                    "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                    "transition-all duration-150"
                  )}
                />
              </div>
            )}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={saveBlock}
                disabled={blockType === "shortcut" && (!keysInput.trim() || !actionInput.trim())}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold",
                  "bg-primary text-primary-foreground",
                  "hover:brightness-110",
                  "disabled:opacity-30 disabled:pointer-events-none",
                  "transition-all duration-150 active:scale-[0.97]"
                )}
              >
                {editingId ? "Save" : blockType === "shortcut" ? "Add Shortcut" : `Add ${blockType.charAt(0).toUpperCase() + blockType.slice(1)}`}
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
        )}

        {/* ── Blocks List ── */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Blocks
              {blocks.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal">
                  ({blocks.length})
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
                disabled={blocks.length === 0}
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
                disabled={blocks.length === 0}
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
              {blocks.length > 0 && (
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
                  "Paste JSON or text format:\ncmd+K | Toggle Command Palette | Open the palette\nctrl+S cmd+S | Save | Save current file | Editing"
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
              <details className="mt-3 text-xs text-muted-foreground/60">
                <summary className="cursor-pointer hover:text-foreground transition-colors duration-150 font-medium">
                  Import Guide &mdash; copy for AI
                </summary>
                <div className="mt-2 space-y-2 leading-relaxed">
                  <p><strong>Format 1 &mdash; Text</strong> (keys | action | description):</p>
                  <pre className="bg-muted/40 rounded-lg p-3 font-mono text-[11px] text-foreground/80">
{`cmd+K ctrl+K | Toggle palette | Open the command palette
ctrl+S cmd+S | Save | Save changes
win+shift+arrowLeft | Move window left | Snap to left half`}</pre>
                  <p><strong>Format 2 &mdash; JSON</strong> (array of blocks):</p>
                  <pre className="bg-muted/40 rounded-lg p-3 font-mono text-[11px] text-foreground/80">
{`[
  {"keys":["cmd","k"],"action":"Toggle palette","description":"Open the command palette","group":"General"},
  {"type":"section","title":"Getting Started"},
  {"type":"note","variant":"tip","content":"You can also use ctrl+K"},
  {"type":"code","language":"javascript","code":"console.log(42)","group":"Dev"}
]`}</pre>
                  <p><strong>Tips:</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Separate alternative combos with space: <code className="text-foreground/70">cmd+K ctrl+K</code></li>
                    <li>Use <code className="text-foreground/70">+</code> between modifier and key within a combo</li>
                    <li>Add optional <code className="text-foreground/70">group</code> field to organize blocks</li>
                    <li>Old shortcuts without <code className="text-foreground/70">type</code> automatically become Shortcut blocks</li>
                  </ul>
                </div>
              </details>
            </div>
          )}

          {/* Empty State */}
          {blocks.length === 0 && (
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
                No blocks yet. Add a shortcut, section, note, or code block above.
              </p>
            </div>
          )}

          {/* Blocks — grouped */}
          {blocks.length > 0 && (
            <>
              {(() => {
                const groupOrder: string[] = []
                const grouped: Record<string, Block[]> = {}
                blocks.forEach((b) => {
                  const g = b.group || "Ungrouped"
                  if (!grouped[g]) {
                    grouped[g] = []
                    groupOrder.push(g)
                  }
                  grouped[g].push(b)
                })
                // "Ungrouped" always last
                const sortedGroups = groupOrder.filter((g) => g !== "Ungrouped").map((g) => [g, grouped[g]] as const)
                if (grouped["Ungrouped"]) sortedGroups.push(["Ungrouped", grouped["Ungrouped"]])
                return sortedGroups.map(([groupName, groupBlocks]) => (
                  <div key={groupName} className="mb-8 last:mb-0">
                    <div className="flex items-center gap-2 mb-4">
                      {renamingGroup === groupName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(groupName)
                              if (e.key === "Escape") setRenamingGroup(null)
                              e.stopPropagation()
                            }}
                            onBlur={() => commitRename(groupName)}
                            autoFocus
                            className={cn(
                              "h-8 rounded-lg border border-primary/40 bg-muted/30 px-3 text-base font-semibold",
                              "focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20",
                              "transition-all duration-150"
                            )}
                          />
                          <span className="text-xs text-muted-foreground/40">
                            ↵ save &nbsp;⎋ cancel
                          </span>
                        </div>
                      ) : (
                        <h3
                          className="text-base font-semibold text-foreground/80 cursor-pointer hover:text-foreground transition-colors duration-150"
                          onClick={() => {
                            setRenameValue(groupName)
                            setRenamingGroup(groupName)
                          }}
                        >
                          {groupName}
                        </h3>
                      )}
                      <span className="text-xs text-muted-foreground/50 font-medium px-2 py-0.5 rounded-full bg-muted/50 border border-border/40">
                        {groupBlocks.length}
                      </span>
                    </div>
                    <div
                      className={cn(
                        viewMode === "list"
                          ? "space-y-4"
                          : "grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5"
                      )}
                    >
                      {groupBlocks.map((block) => (
                        <BlockCard
                          key={block.id}
                          block={block}
                          pressedKeys={pressedKeys}
                          testMode={testMode}
                          viewMode={viewMode}
                          isMac={isMac}
                          onEdit={startEdit}
                          onRemove={removeBlock}
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
        <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8 text-center">
          {editing ? (
            <input
              type="text"
              value={pageDesc}
              onChange={(e) => setPageDesc(e.target.value)}
              placeholder="Add a description for visitors..."
              className="w-full max-w-xl mx-auto bg-transparent border-none outline-none text-center text-sm text-muted-foreground placeholder:text-muted-foreground/30"
            />
          ) : pageDesc ? (
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">{pageDesc}</p>
          ) : null}
          <p className="text-xs text-muted-foreground/50 mt-4">
            Shortcut Cheatsheet &mdash; Built with shadcn/ui &amp; Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  )
}

// ── Block Card Dispatcher ──────────────────────────────────────

function BlockCard({
  block,
  pressedKeys,
  testMode,
  viewMode,
  isMac,
  onEdit,
  onRemove,
}: {
  block: Block
  pressedKeys: Set<string>
  testMode: boolean
  viewMode: "list" | "grid"
  isMac: boolean
  onEdit: (block: Block) => void
  onRemove: (id: string) => void
}) {
  switch (block.type) {
    case "shortcut":
      return (
        <ShortcutCard
          shortcut={block}
          pressedKeys={pressedKeys}
          testMode={testMode}
          viewMode={viewMode}
          isMac={isMac}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      )
    case "section":
      return (
        <div className="group relative">
          <div className="absolute right-0 top-0 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
            <button type="button" onClick={() => onEdit(block)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-all duration-150">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            </button>
            <button type="button" onClick={() => onRemove(block.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-150 text-base">×</button>
          </div>
          <SectionCard title={block.title} description={block.description} />
        </div>
      )
    case "note":
      return (
        <div className="group relative">
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
            <button type="button" onClick={() => onEdit(block)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-all duration-150">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            </button>
            <button type="button" onClick={() => onRemove(block.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-150 text-base">×</button>
          </div>
          <NoteCard variant={block.variant} content={block.content} />
        </div>
      )
    case "code":
      return (
        <div className="group relative">
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
            <button type="button" onClick={() => onEdit(block)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-all duration-150">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            </button>
            <button type="button" onClick={() => onRemove(block.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-150 text-base">×</button>
          </div>
          <CodeCard language={block.language} code={block.code} />
        </div>
      )
  }
}

// ── Shortcut Card ─────────────────────────────────────────────

function ShortcutCard({
  shortcut,
  pressedKeys,
  testMode,
  viewMode,
  isMac,
  onEdit,
  onRemove,
}: {
  shortcut: Shortcut
  pressedKeys: Set<string>
  testMode: boolean
  viewMode: "list" | "grid"
  isMac: boolean
  onEdit: (shortcut: Shortcut) => void
  onRemove: (id: string) => void
}) {
  // Memoize all combos (primary + alts)
  const combosRef = useRef<string[][] | null>(null)
  if (combosRef.current === null) {
    combosRef.current = [shortcut.keys, ...(shortcut.alts || [])]
  }
  const normalizedCombos = useMemo(
    () => combosRef.current!.map((c) => normalizeKeys(c, isMac)),
    [isMac]
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
        <Kbd key={`combo-${i}`} keys={combo} pressedKeys={testMode ? pressedKeys : undefined} isMac={isMac} />
      )
    })
    return elements
  }, [testMode, pressedKeys, isMac])

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
