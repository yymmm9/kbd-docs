import { Kbd } from "@/components/ui/kbd"

export function Demo() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Kbd keys={["⌘", "K"]} />
      <Kbd keys={["⌃", "⇧", "P"]} />
      <Kbd keys={["⌥", "⇥"]} />
      <Kbd keys={["⇧", "↵"]} />
      <Kbd keys={["⎋"]} />
    </div>
  )
}
