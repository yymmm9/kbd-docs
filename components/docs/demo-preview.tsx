interface DemoPreviewProps {
  children: React.ReactNode
}

export function DemoPreview({ children }: DemoPreviewProps) {
  return (
    <div className="flex min-h-[120px] items-center justify-center p-8">
      {children}
    </div>
  )
}
