import { cn } from "@/lib/utils"

interface PropDef {
  name: string
  type: string
  nameDetails?: string
  typeDetails?: string
  default?: string
}

interface PropsTableProps {
  data: PropDef[]
}

export function PropsTable({ data }: PropsTableProps) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-foreground">Prop</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">Type</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {data.map((prop, i) => (
            <tr
              key={prop.name}
              className={cn(
                "border-b border-border/40",
                i === data.length - 1 && "border-b-0"
              )}
            >
              <td className="px-4 py-3">
                <code className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[13px] font-medium text-primary">
                  {prop.name}
                </code>
              </td>
              <td className="px-4 py-3">
                <code className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[13px] font-mono text-foreground">
                  {prop.type}
                </code>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <p className="mb-1">{prop.nameDetails}</p>
                {prop.typeDetails && (
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    {prop.typeDetails}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
