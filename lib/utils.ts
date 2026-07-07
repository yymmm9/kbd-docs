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
  /** Alternative key combos (space-separated in input) */
  alts?: string[][]
  /** Group/category for organizing shortcuts */
  group?: string
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
      const combos = [s.keys, ...(s.alts || [])]
        .map((c) => c.join("+"))
        .join(" ")
      const parts = [combos, s.action, s.description]
      if (s.group) parts.push(s.group)
      return parts.join(" | ")
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
      const tokens = keysPart.split(" ").filter(Boolean)
      const combos: string[][] = []
      tokens.forEach((token, idx) => {
        if (idx === 0) {
          combos.push(
            token
              .toLowerCase()
              .split("+")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        } else if (token.includes("+")) {
          combos.push(
            token
              .toLowerCase()
              .split("+")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        } else {
          // Suffix-only: take base prefix (all but last key) + this key
          const prefix = combos[0].slice(0, -1)
          combos.push([...prefix, token.toLowerCase()])
        }
      })
      return {
        keys: combos[0] || [],
        alts: combos.length > 1 ? combos.slice(1) : undefined,
        action: parts[1] || "",
        description: parts[2] || "",
        group: parts[3] || undefined,
      }
    })
    .filter((s) => s.keys.length > 0 && s.action)
}
