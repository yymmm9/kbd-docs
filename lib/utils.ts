import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
    .join(" + ")
}

export function parseComboString(str: string): string[] {
  return str
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function serializeCombo(keys: string[]): string {
  return keys.join("+")
}

export function parseCombosParam(param: string | null): string[][] {
  if (!param) return []
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseComboString)
    .filter((c) => c.length > 0)
}

export function serializeCombos(combos: string[][]): string {
  return combos.map(serializeCombo).join(",")
}
