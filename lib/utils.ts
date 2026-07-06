import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Key Symbol Map ──────────────────────────────────────────

export const keySymbolMap: Record<string, { display: string; symbol: string }> = {
  command: { display: "⌘", symbol: "⌘" },
  cmd: { display: "⌘", symbol: "⌘" },
  control: { display: "⌃", symbol: "⌃" },
  ctrl: { display: "⌃", symbol: "⌃" },
  option: { display: "⌥", symbol: "⌥" },
  alt: { display: "⌥", symbol: "⌥" },
  shift: { display: "⇧", symbol: "⇧" },
  enter: { display: "↵", symbol: "↵" },
  return: { display: "↵", symbol: "↵" },
  escape: { display: "⎋", symbol: "⎋" },
  esc: { display: "⎋", symbol: "⎋" },
  tab: { display: "⇥", symbol: "⇥" },
  space: { display: "␣", symbol: "␣" },
  delete: { display: "⌫", symbol: "⌫" },
  backspace: { display: "⌫", symbol: "⌫" },
  arrowup: { display: "↑", symbol: "↑" },
  up: { display: "↑", symbol: "↑" },
  arrowdown: { display: "↓", symbol: "↓" },
  down: { display: "↓", symbol: "↓" },
  arrowleft: { display: "←", symbol: "←" },
  left: { display: "←", symbol: "←" },
  arrowright: { display: "→", symbol: "→" },
  right: { display: "→", symbol: "→" },
  capslock: { display: "⇪", symbol: "⇪" },
  pageup: { display: "⇞", symbol: "⇞" },
  pagedown: { display: "⇟", symbol: "⇟" },
  home: { display: "↖", symbol: "↖" },
  end: { display: "↘", symbol: "↘" },
  win: { display: "⊞", symbol: "⊞" },
  windows: { display: "⊞", symbol: "⊞" },
  super: { display: "⊞", symbol: "⊞" },
}

export type KeyItem = string | { display: string; key: string }

export function normalizeKeys(keys: KeyItem[]): { display: string; listenKey: string }[] {
  return keys.map((key) => {
    if (typeof key === "string") {
      const lower = key.toLowerCase()
      const mapped = keySymbolMap[lower]
      if (mapped) {
        return { display: mapped.display, listenKey: lower }
      }
      return { display: key.length === 1 ? key.toUpperCase() : key, listenKey: lower }
    }
    return { display: key.display, listenKey: key.key.toLowerCase() }
  })
}

export function formatKeysForDisplay(keys: KeyItem[]): string {
  return normalizeKeys(keys)
    .map((k) => k.display)
    .join(" ")
}

// ── Shortcut Data Model ─────────────────────────────────────

export interface Shortcut {
  id: string
  keys: string[]
  action: string
  description: string
}

let counter = 0
export function createShortcutId(): string {
  counter++
  return `s_${Date.now().toString(36)}_${counter}`
}

// ── URL Export / Import ─────────────────────────────────────

export function exportShortcutsAsText(shortcuts: Shortcut[]): string {
  return shortcuts
    .map((s) => {
      const combo = s.keys.join("+")
      return `${combo} | ${s.action} | ${s.description}`
    })
    .join("\n")
}

export function parseImportText(text: string): Omit<Shortcut, "id">[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim())
      const keysPart = parts[0] || ""
      return {
        keys: keysPart.split("+").filter(Boolean),
        action: parts[1] || "",
        description: parts[2] || "",
      }
    })
    .filter((s) => s.keys.length > 0 && s.action)
}
