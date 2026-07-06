import { cn } from "@/lib/utils"

interface DemoCodeProps {
  children: React.ReactNode
  className?: string
}

export function DemoCode({ children, className }: DemoCodeProps) {
  return (
    <div className={cn("border-t border-border/60 bg-muted/30", className)}>
      <div className="overflow-x-auto p-4 text-sm">
        {children}
      </div>
    </div>
  )
}
