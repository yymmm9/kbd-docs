"use client"

import * as React from "react"
import { cn, type KeyItem, normalizeKeys } from "@/lib/utils"

interface KbdProps extends React.HTMLAttributes<HTMLSpanElement> {
  keys: KeyItem[]
  className?: string
  active?: boolean
  listenToKeyboard?: boolean
  pressedKeys?: Set<string>
  /** Show "+" separator between keys (default: true) */
  showSeparator?: boolean
}

function Kbd({
  keys,
  className,
  active,
  listenToKeyboard,
  pressedKeys,
  showSeparator = true,
  ...props
}: KbdProps) {
  const [pressedSelf, setPressedSelf] = React.useState(false)
  const normalized = React.useMemo(() => normalizeKeys(keys), [keys])

  // Self-contained keyboard listening
  React.useEffect(() => {
    if (!listenToKeyboard) return
    const localPressed = new Set<string>()

    function check() {
      setPressedSelf(
        normalized.length > 0 &&
          normalized.every((k) => localPressed.has(k.listenKey))
      )
    }

    function onKeyDown(e: KeyboardEvent) {
      localPressed.add(e.key.toLowerCase())
      check()
    }
    function onKeyUp(e: KeyboardEvent) {
      localPressed.delete(e.key.toLowerCase())
      check()
    }
    function onBlur() {
      localPressed.clear()
      setPressedSelf(false)
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [listenToKeyboard, normalized])

  // External pressedKeys mode
  const isActive =
    active ||
    pressedSelf ||
    (pressedKeys !== undefined &&
      normalized.length > 0 &&
      normalized.every((k) => pressedKeys.has(k.listenKey)))

  return (
    <span className={cn("inline-flex items-center gap-[3px]", className)} {...props}>
      {normalized.map((key, i) => (
        <span key={i} className="inline-flex items-center gap-[3px]">
          <kbd
            className={cn(
              "inline-flex h-12 min-w-[44px] items-center justify-center rounded-xl px-[13px]",
              "text-base font-semibold leading-none tracking-wide select-none",
              "border border-border/50 bg-gradient-to-b from-muted/80 to-muted/30 text-muted-foreground",
              "shadow-[0_3px_0_0_hsl(var(--border)),0_2px_8px_0_rgba(0,0,0,0.1)]",
              "transition-all duration-100 ease-out will-change-transform",
              isActive && [
                "border-primary/30 bg-gradient-to-b from-primary/12 to-primary/8 text-primary shadow-none",
                "translate-y-[3px]",
              ]
            )}
          >
            {key.display}
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
