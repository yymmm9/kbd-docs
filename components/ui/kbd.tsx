"use client"

import * as React from "react"
import { cn, type KeyItem, normalizeKeys } from "@/lib/utils"

interface KbdProps extends React.HTMLAttributes<HTMLSpanElement> {
  keys: KeyItem[]
  className?: string
  /** Force all keys to active state (shortcut-level override) */
  active?: boolean
  /** Enable self-contained keyboard listening (key-level only) */
  listenToKeyboard?: boolean
  /** External set of currently pressed keys (key-level) */
  pressedKeys?: Set<string>
  /** Show "+" separator between keys (default: true) */
  showSeparator?: boolean
  /** Platform override (auto-detected by default) */
  isMac?: boolean
}

function Kbd({
  keys,
  className,
  active,
  listenToKeyboard,
  pressedKeys,
  showSeparator = true,
  isMac,
  ...props
}: KbdProps) {
  const [localPressed, setLocalPressed] = React.useState<Set<string>>(new Set())
  const normalized = React.useMemo(() => normalizeKeys(keys, isMac), [keys, isMac])

  // Self-contained keyboard listening — tracks individual keys
  React.useEffect(() => {
    if (!listenToKeyboard) return

    function onKeyDown(e: KeyboardEvent) {
      setLocalPressed((prev) => new Set(prev).add(e.key.toLowerCase()))
    }
    function onKeyUp(e: KeyboardEvent) {
      setLocalPressed((prev) => {
        const next = new Set(prev)
        next.delete(e.key.toLowerCase())
        return next
      })
    }
    function onBlur() {
      setLocalPressed(new Set())
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [listenToKeyboard])

  // Check if a specific key is pressed (key-level)
  function isKeyPressed(listenKey: string): boolean {
    if (active) return true
    if (listenToKeyboard) return localPressed.has(listenKey)
    if (pressedKeys !== undefined) return pressedKeys.has(listenKey)
    return false
  }

  return (
    <span className={cn("inline-flex items-center gap-[3px]", className)} {...props}>
      {normalized.map((key, i) => (
        <span key={i} className="inline-flex items-center gap-[3px]">
          <kbd
            title={key.label}
            className={cn(
              "inline-flex h-12 min-w-[44px] items-center justify-center rounded-xl px-[13px]",
              "text-base font-semibold leading-none tracking-wide select-none",
              "border border-border/50 bg-gradient-to-b from-muted/80 to-muted/30 text-muted-foreground",
              "shadow-[0_3px_0_0_hsl(var(--border)),0_2px_8px_0_rgba(0,0,0,0.1)]",
              "transition-all duration-100 ease-out will-change-transform",
              isKeyPressed(key.listenKey) && [
                "border-primary/30 bg-gradient-to-b from-primary/12 to-primary/8 text-primary shadow-none",
                "translate-y-[3px]",
              ]
            )}
          >
            {key.symbolKey === "win" ? (
              <span className="flex flex-col items-center gap-[1px]">
                <svg viewBox="0 0 16 16" fill="currentColor" className="size-[18px]">
                  <path d="M0 2.792L6.528 1.944V8H0zM7.232 1.944L16 .84V8H7.232zM16 8.16l-.001 7.158L7.232 14.214V8.16zM6.528 14.214L0 13.368V8.16h6.528z" />
                </svg>
                <span className="text-[10px] font-medium opacity-50 leading-none">win</span>
              </span>
            ) : (
              key.display
            )}
          </kbd>
          {showSeparator && i < normalized.length - 1 && (
            <span className="text-muted-foreground/30 text-base font-semibold select-none leading-none">
              +
            </span>
          )}
        </span>
      ))}
    </span>
  )
}

export { Kbd, type KbdProps, type KeyItem }
