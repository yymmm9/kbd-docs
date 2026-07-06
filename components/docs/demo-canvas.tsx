interface DemoCanvasProps {
  children: React.ReactNode
}

export function DemoCanvas({ children }: DemoCanvasProps) {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border/60 bg-card shadow-ring">
      {children}
    </div>
  )
}
