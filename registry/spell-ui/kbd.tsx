"use client"

import * as React from "react"
import { cn, type KeyItem, normalizeKeys } from "@/lib/utils"

interface KbdProps extends React.HTMLAttributes<HTMLSpanElement> {
  keys: KeyItem[]
  className?: string
  active?: boolean
  listenToKeyboard?: boolean
}

function Kbd({ keys, className, active, listenToKeyboard, ...props }: KbdProps) {
  const [pressed, setPressed] = React.useState(false)
  const normalized = React.useMemo(() => normalizeKeys(keys), [keys])
  const isActive = active || (listenToKeyboard && pressed)

  React.useEffect(() => {
    if (!listenToKeyboard) return

    const pressedKeys = new Set<string>()

    function checkCombination() {
      const allPressed = normalized.every((k) => pressedKeys.has(k.listenKey))
      setPressed(allPressed)
    }

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      pressedKeys.add(key)
      checkCombination()
    }

    function handleKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      pressedKeys.delete(key)
      checkCombination()
    }

    function handleBlur() {
      pressedKeys.clear()
      setPressed(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur)
    }
  }, [listenToKeyboard, normalized])

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[2px]",
        className
      )}
      {...props}
    >
      {normalized.map((key, i) => (
        <span key={i}>
          <kbd
            className={cn(
              "inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-[7px] text-[11px] font-medium leading-none select-none",
              "border border-border/60 bg-muted/50 text-muted-foreground",
              "shadow-[0_1px_0_0_hsl(var(--border)),0_1px_2px_0_rgba(0,0,0,0.05)]",
              "transition-all duration-100 ease-out",
              isActive && [
                "border-primary/40 bg-primary/10 text-primary shadow-none",
                "translate-y-[1px]",
              ]
            )}
          >
            {key.display}
          </kbd>
          {i < normalized.length - 1 && (
            <span className="text-muted-foreground/40 mx-[2px] text-[11px] font-medium select-none">
              +
            </span>
          )}
        </span>
      ))}
    </span>
  )
}

export { Kbd, type KbdProps, type KeyItem }
