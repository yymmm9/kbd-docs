import { Suspense } from "react"
import { ShortcutManager } from "@/components/shortcuts/shortcut-manager"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <ShortcutManager />
    </Suspense>
  )
}
