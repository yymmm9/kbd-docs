import { Kbd } from "@/components/ui/kbd"

export function Demo() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Kbd keys={["cmd", "K"]} />
      <Kbd keys={["ctrl", "shift", "P"]} />
      <Kbd keys={["alt", "tab"]} />
      <Kbd keys={["shift", "enter"]} />
      <Kbd keys={["escape"]} />
    </div>
  )
}
