import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Key Types ──────────────────────────────────────────────────

export interface KeyItem {
  listenKey: string
  label: string
  display: string
  symbolKey?: string
}

// ── Block Types ────────────────────────────────────────────────

export type BlockType = "shortcut" | "section" | "note" | "code"
export type NoteVariant = "info" | "warning" | "tip" | "danger"

export interface BaseBlock {
  id: string
  type: BlockType
  group?: string
}

export interface ShortcutBlock extends BaseBlock {
  type: "shortcut"
  keys: KeyItem[]
  /** Alternate key combinations */
  alts?: KeyItem[][]
  /** Action name (shown in the UI) */
  action: string
  /** Short description */
  description: string
  /** Compact string like "ctrl+k" (derived from keys) */
  combo: string
}

export interface SectionBlock extends BaseBlock {
  type: "section"
  title: string
  description?: string
}

export interface NoteBlock extends BaseBlock {
  type: "note"
  variant: NoteVariant
  content: string
}

export interface CodeBlock extends BaseBlock {
  type: "code"
  language: string
  code: string
}

export type Block = ShortcutBlock | SectionBlock | NoteBlock | CodeBlock

/** Type alias for ShortcutBlock used in type guards */
export type Shortcut = ShortcutBlock

// ── Key Normalization ──────────────────────────────────────────

const KEY_LABELS: Record<string, { mac: string; default: string }> = {
  control: { mac: "⌃", default: "Ctrl" },
  ctrl: { mac: "⌃", default: "Ctrl" },
  alt: { mac: "⌥", default: "Alt" },
  option: { mac: "⌥", default: "Alt" },
  meta: { mac: "⌘", default: "Win" },
  windows: { mac: "⌘", default: "Win" },
  win: { mac: "⌘", default: "Win" },
  shift: { mac: "⇧", default: "Shift" },
  capslock: { mac: "⇪", default: "Caps" },
  enter: { mac: "↩", default: "Enter" },
  return: { mac: "↩", default: "Enter" },
  tab: { mac: "⇥", default: "Tab" },
  backspace: { mac: "⌫", default: "Bksp" },
  delete: { mac: "⌦", default: "Del" },
  escape: { mac: "⎋", default: "Esc" },
  esc: { mac: "⎋", default: "Esc" },
  space: { mac: "␣", default: "Space" },
  up: { mac: "↑", default: "↑" },
  down: { mac: "↓", default: "↓" },
  left: { mac: "←", default: "←" },
  right: { mac: "→", default: "→" },
  pageup: { mac: "⇞", default: "PgUp" },
  pagedown: { mac: "⇟", default: "PgDn" },
  home: { mac: "↖", default: "Home" },
  end: { mac: "↘", default: "End" },
}

export function normalizeKeys(keys: KeyItem[], isMac = true): KeyItem[] {
  return keys.map((k) => {
    const lower = k.listenKey.toLowerCase()
    const mapping = KEY_LABELS[lower]
    if (!mapping) return k
    const label = isMac ? mapping.mac : mapping.default
    // Only update display if the key has a known mapping, preserve the original otherwise
    return { ...k, label, display: label }
  })
}

// ── Block Normalization ────────────────────────────────────────

function normalizeKeyItem(raw: unknown): KeyItem {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    const listenKey = String(obj.listenKey ?? "")
    const label = String(obj.label ?? listenKey)
    const display = String(obj.display ?? label)
    return { listenKey, label, display }
  }
  const s = String(raw ?? "")
  return { listenKey: s, label: s, display: s }
}

function normalizeShortcutKeys(
  raw: unknown
): KeyItem[] {
  if (Array.isArray(raw)) return raw.map(normalizeKeyItem)
  if (typeof raw === "string") {
    return raw.split("+").map((k) => {
      const t = k.trim().toLowerCase()
      return { listenKey: t, label: t, display: t }
    })
  }
  return []
}

export function normalizeBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item: unknown, idx: number) => {
    if (!item || typeof item !== "object") {
      return createDefaultBlock(idx)
    }
    const obj = item as Record<string, unknown>
    const type = String(obj.type ?? "shortcut") as BlockType
    const base = {
      id: String(obj.id ?? createBlockId()),
      type,
      group: obj.group ? String(obj.group) : undefined,
    }

    switch (type) {
      case "shortcut": {
        const keys = normalizeShortcutKeys(obj.keys ?? obj.combo ?? "")
        const raws = obj.alts
        const alts = Array.isArray(raws)
          ? raws.map(normalizeShortcutKeys)
          : undefined
        return {
          ...base,
          type: "shortcut" as const,
          keys,
          alts: alts && alts.length > 0 ? alts : undefined,
          action: String(obj.action ?? ""),
          description: String(obj.description ?? ""),
          combo: String(obj.combo ?? ""),
        }
      }
      case "section": {
        return {
          ...base,
          type: "section" as const,
          title: String(obj.title ?? ""),
          description: obj.description ? String(obj.description) : undefined,
        }
      }
      case "note": {
        return {
          ...base,
          type: "note" as const,
          variant: (obj.variant as NoteVariant) ?? ("info" as NoteVariant),
          content: String(obj.content ?? ""),
        }
      }
      case "code": {
        return {
          ...base,
          type: "code" as const,
          language: String(obj.language ?? obj.lang ?? "code"),
          code: String(obj.code ?? ""),
        }
      }
      default:
        return createDefaultBlock(idx)
    }
  })
}

function createDefaultBlock(idx: number): Block {
  return {
    id: createBlockId(),
    type: "shortcut",
    keys: [],
    action: `Shortcut ${idx + 1}`,
    description: "",
    combo: "",
  }
}

// ── ID Generation ──────────────────────────────────────────────

let _idCounter = 0

export function createBlockId(): string {
  _idCounter++
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  return `${ts}-${rand}-${_idCounter}`
}

// ── Export / Import (text format) ──────────────────────────────

/**
 * Format: `Shortcut Keys, Action Name`
 * Example: `⌘K, Open Command Palette`
 */
export function exportShortcutsAsText(shortcuts: Shortcut[]): string {
  return shortcuts
    .map((s) => {
      const keysStr = s.keys.map((k) => k.display || k.label).join("+")
      return `${keysStr}, ${s.action}`
    })
    .join("\n")
}

/**
 * Parse text format: `Key Combo, Action Name`
 * Handles lines with comma separator.
 */
export function parseImportText(
  text: string
): { keys: KeyItem[]; action: string; combo: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Split on first comma
      const commaIdx = line.indexOf(",")
      if (commaIdx === -1) return null

      const keyPart = line.slice(0, commaIdx).trim()
      const action = line.slice(commaIdx + 1).trim()
      if (!keyPart || !action) return null

      const tokens = keyPart.split("+").map((k) => k.trim().toLowerCase())
      const keys = tokens.map((t) => ({
        listenKey: t,
        label: t,
        display: t,
      }))

      return {
        keys,
        action,
        combo: tokens.join("+"),
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
}
