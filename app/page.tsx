import { Suspense } from "react"
import { Demo } from "@/kbd/demo"
import { Demo as DemoSymbols } from "@/kbd/demo-symbols"
import { Demo as DemoCustom } from "@/kbd/demo-custom"
import { Playground } from "@/kbd/playground"
import { DemoCanvas } from "@/docs/demo-canvas"
import { DemoPreview } from "@/docs/demo-preview"
import { DemoCode } from "@/docs/demo-code"
import { InstallationTabs } from "@/docs/installation-tabs"
import { PropsTable } from "@/docs/props-table"

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm text-primary mb-6">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01" />
              <path d="M8 12h8" />
              <path d="M6 16h.01M10 16h.01M14 16h.01M18 16h.01" />
            </svg>
            spell-ui / kbd
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Kbd
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            A beautiful, accessible keyboard shortcut component. Display key
            combinations with platform-aware symbols, active states, and
            optional real-time keyboard listening.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        {/* Demo */}
        <section>
          <DemoCanvas>
            <DemoPreview>
              <Demo />
            </DemoPreview>
            <DemoCode>
              <pre className="text-muted-foreground">
                <code>{`import { Kbd } from "@/components/ui/kbd"

<Kbd keys={["cmd", "K"]} />
<Kbd keys={["ctrl", "shift", "P"]} />
<Kbd keys={["alt", "tab"]} />
<Kbd keys={["shift", "enter"]} />
<Kbd keys={["escape"]} />`}</code>
              </pre>
            </DemoCode>
          </DemoCanvas>
        </section>

        {/* Installation */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Installation
          </h2>
          <p className="text-muted-foreground mb-6">
            Add the Kbd component to your project.
          </p>
          <InstallationTabs item="kbd">
            <div className="p-4 font-mono text-sm text-muted-foreground">
              <pre><code>{`// Copy the source from registry/spell-ui/kbd.tsx
// into your components/ui/kbd.tsx`}</code></pre>
            </div>
          </InstallationTabs>
        </section>

        {/* Key Symbols */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Examples
          </h2>
          <h3 className="text-lg font-semibold text-foreground mt-8 mb-2">
            Key Symbols
          </h3>
          <p className="text-muted-foreground mb-4">
            Use standard macOS key symbols directly in the keys array.
          </p>
          <DemoCanvas>
            <DemoPreview>
              <DemoSymbols />
            </DemoPreview>
            <DemoCode>
              <pre className="text-muted-foreground">
                <code>{`import { Kbd } from "@/components/ui/kbd"

<Kbd keys={["⌘", "K"]} />
<Kbd keys={["⌃", "⇧", "P"]} />
<Kbd keys={["⌥", "⇥"]} />
<Kbd keys={["⇧", "↵"]} />
<Kbd keys={["⎋"]} />`}</code>
              </pre>
            </DemoCode>
          </DemoCanvas>
        </section>

        {/* Custom Display with Keyboard Listener */}
        <section className="mt-12">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Custom Display with Keyboard Listener
          </h3>
          <p className="text-muted-foreground mb-4">
            Press the actual key combination to see the active state in real
            time.
          </p>
          <DemoCanvas>
            <DemoPreview>
              <DemoCustom />
            </DemoPreview>
            <DemoCode>
              <pre className="text-muted-foreground">
                <code>{`import { Kbd } from "@/components/ui/kbd"

<Kbd keys={["cmd", "K"]} listenToKeyboard />`}</code>
              </pre>
            </DemoCode>
          </DemoCanvas>
        </section>

        {/* Playground - URL-driven */}
        <Suspense fallback={null}>
          <Playground />
        </Suspense>

        {/* Usage */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Usage
          </h2>
          <p className="text-muted-foreground mb-6">
            Import the component and pass an array of keys.
          </p>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <pre className="text-sm text-muted-foreground overflow-x-auto">
              <code>{`import { Kbd } from "@/components/ui/kbd"`}</code>
            </pre>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 mt-4">
            <pre className="text-sm text-muted-foreground overflow-x-auto">
              <code>{`<Kbd keys={["cmd", "K"]} />
<Kbd keys={["ctrl", "shift", "P"]} />
<Kbd keys={["alt", "tab"]} />`}</code>
            </pre>
          </div>
        </section>

        {/* Props */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Props
          </h2>
          <p className="text-muted-foreground mb-6">
            Configuration options for the Kbd component.
          </p>
          <PropsTable
            data={[
              {
                name: "keys",
                type: "(string | { display, key })[]",
                nameDetails: "Array of key names to display",
                typeDetails:
                  'Each item can be a string or an object with display (shown text) and key (listened key). Supported keys: command/cmd, control/ctrl, alt/option, shift, enter/return, escape/esc, tab, space, delete/backspace, arrowleft/left, arrowdown/down, arrowup/up, arrowright/right, or any letter/number',
              },
              {
                name: "className",
                type: "string",
                nameDetails: "Additional CSS classes for the component",
              },
              {
                name: "active",
                type: "boolean",
                nameDetails: "Force the pressed state",
                typeDetails:
                  "When true, the key appears visually pressed",
              },
              {
                name: "listenToKeyboard",
                type: "boolean",
                nameDetails: "Listen for actual key presses",
                typeDetails:
                  "When true, the component shows pressed state when all specified keys are pressed simultaneously",
              },
            ]}
          />
        </section>
      </main>

      <footer className="border-t border-border/60 mt-24">
        <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8 text-center text-sm text-muted-foreground">
          spell-ui / kbd &mdash; Built with shadcn/ui &amp; Tailwind CSS
        </div>
      </footer>
    </div>
  )
}
