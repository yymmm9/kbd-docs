import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import "./globals.css"
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

export const metadata: Metadata = {
  title: "Shortcut Cheatsheet — Define & Share Keyboard Shortcuts",
  description:
    "Define keyboard shortcuts with names and descriptions. Export and share via URL, JSON, or plain text.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('kbd-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  )
}
