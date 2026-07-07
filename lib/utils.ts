import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Key Symbol Map ──────────────────────────────────────────

const keySymbolMap: Record<string, { display: string; symbol: string }> = {
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
  // Function keys
  f1: { display: "F1", symbol: "F1" },
  f2: { display: "F2", symbol: "F2" },
  f3: { display: "F3", symbol: "F3" },
  f4: { display: "F4", symbol: "F4" },
  f5: { display: "F5", symbol: "F5" },
  f6: { display: "F6", symbol: "F6" },
  f7: { display: "F7", symbol: "F7" },
  f8: { display: "F8", symbol: "F8" },
  f9: { display: "F9", symbol: "F9" },
  f10: { display: "F10", symbol: "F10" },
  f11: { display: "F11", symbol: "F11" },
  f12: { display: "F12", symbol: "F12" },
}

// On macOS we show ⌘ for cmd; elsewhere show Ctrl (common convention)
const CMD_DISPLAY_MAC = "⌘"
const CMD_DISPLAY_NON_MAC = "Ctrl"

export type KeyItem = string | { display: string; key: string }

// listenKey maps to what e.key.toLowerCase() produces when the key is pressed
//   cmd → "meta"     (e.key is "Meta" on both Mac ⌘ and Windows ⊞ Win)
//   ctrl → "control" (e.key is "Control")
//   shift → "shift"  (e.key is "Shift")
//   alt → "alt"      (e.key is "Alt")
function listenKey(input: string): string {
  const lower = input.toLowerCase()
  if (lower === "cmd" || lower === "command" || lower === "meta") return "meta"
  if (lower === "ctrl" || lower === "control") return "control"
  if (lower === "alt" || lower === "option") return "alt"
  if (lower === "shift") return "shift"
  return lower
}

export function normalizeKeys(
  keys: KeyItem[],
  isMac?: boolean
): { display: string; listenKey: string }[] {
  return keys.map((key) => {
    if (typeof key === "string") {
      const lower = key.toLowerCase()
      const mapped = keySymbolMap[lower]
      if (mapped) {
        // Platform-aware display: cmd → ⌘ on Mac, Ctrl on non-Mac
        if ((lower === "cmd" || lower === "command") && isMac === false) {
          return { display: CMD_DISPLAY_NON_MAC, listenKey: listenKey(lower) }
        }
        return { display: mapped.display, listenKey: listenKey(lower) }
      }
      return {
        display: key.length === 1 ? key.toUpperCase() : key,
        listenKey: listenKey(lower),
      }
    }
    return { display: key.display, listenKey: listenKey(key.key) }
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
