# kbd-docs — Agent Guide

Generate a keyboard-shortcut cheatsheet page by **building a URL**. There is no
backend: all page state is serialized into the `?s=` query param. An agent only
needs to produce JSON, `encodeURIComponent` it, and hand the user the link.

Base URL: `https://shortcut.y-m.dev/`

## URL format

```
https://shortcut.y-m.dev/?s=<encodeURIComponent(JSON array)>&t=<title>&d=<description>
```

| param | meaning |
|---|---|
| `s` | JSON array of blocks (see schema below). Required for a read-only share page. |
| `t` | page title |
| `d` | page description |
| `edit` | `edit=1` opens the editor UI; omit it for a clean visitor-facing page |

Minimal generator (JS):

```js
const url = `https://shortcut.y-m.dev/?s=${encodeURIComponent(JSON.stringify(blocks))}&t=${encodeURIComponent(title)}`
```

## Block schema

Blocks render top-to-bottom in array order, then grouped by `group`
(insertion order of first appearance; ungrouped items go last under "Ungrouped").

### shortcut

```json
{"type":"shortcut","keys":"cmd+k","alts":[["ctrl","k"]],"action":"Open palette","description":"…","group":"General"}
```

- `keys` — **string** `"a+b+c"` (preferred, terse) **or** array of
  `{"listenKey":"cmd","label":"cmd","display":"cmd"}` objects
- `alts` — alternative combos; array of key-arrays (object form) or omit
- `action` — shown as the row title (required)
- `description`, `group` — optional
- `type` may be omitted — `"shortcut"` is the default

### section — visual divider inside a group

```json
{"type":"section","title":"Navigation","description":"…","group":"…"}
```

### note — callout box

```json
{"type":"note","variant":"info","content":"…","group":"…"}
```

`variant`: `info | warning | tip | danger`

### code — code block with copy button

```json
{"type":"code","language":"javascript","code":"console.log(42)","group":"…"}
```

## Key vocabulary (`listenKey`)

Case-insensitive. Unknown strings render as-is.

| you write | renders on mac | renders elsewhere |
|---|---|---|
| `win`, `windows`, `super` | ⊞ icon + "win" caption | same |
| `shift` | ⇧ icon + "shift" caption | same |
| `cmd`, `command`, `meta` | ⌘ | Win |
| `ctrl`, `control` | ⌃ | Ctrl |
| `alt`, `option` | ⌥ | Alt |
| `up`/`arrowup`, `down`/`arrowdown`, `left`/`arrowleft`, `right`/`arrowright` | arrow icon | same |
| `enter`, `return` | ↩ | Enter |
| `esc`, `escape` | ⎋ | Esc |
| `space` | ␣ | Space |
| `tab` | ⇥ | Tab |
| `backspace` / `delete` | ⌫ / ⌦ | Bksp / Del |
| `capslock` | ⇪ | Caps |
| `pageup` / `pagedown` | ⇞ / ⇟ | PgUp / PgDn |
| `home` / `end` | ↖ / ↘ | Home / End |
| any other string | raw text | raw text |

Note: `win` means the **literal Windows key** (logo icon). Use `cmd`/`meta` for
the platform modifier when you want ⌘ on macOS viewers.

## In-app import format

The editor also accepts pasted text (`keys | action | description`), one per
line; space-separated tokens are alternative combos:

```
cmd+K ctrl+K | Toggle palette | Open the command palette
win+shift+arrowleft | Move window left | Snap to left half
```

## Example

```js
const blocks = [
  {"type":"shortcut","keys":"win+shift+arrowleft","action":"移动窗口到两边的屏幕"},
  {"type":"shortcut","keys":"/","action":"现场搜索经文","group":"信义PPT"},
  {"type":"section","title":"投影","group":"信义PPT"},
  {"type":"note","variant":"tip","content":"shift+r 可在 PPT 内刷新","group":"信义PPT"},
]
const url = "https://shortcut.y-m.dev/?s=" + encodeURIComponent(JSON.stringify(blocks))
  + "&t=" + encodeURIComponent("信义PPT指南")
```

## Repo notes

- Next.js App Router + Tailwind + shadcn/ui; single client component
  `components/shortcuts/shortcut-manager.tsx`; key normalization in
  `lib/utils.ts` (`normalizeKeys`, `KEY_LABELS`, `WIN_KEYS`, `ARROW_KEYS`)
- Verification: `npx tsc --noEmit` (run `npm install` first if node_modules missing)
- Do not run `npm run dev`/`build` — user verifies on the deployed site
- Commit style: Conventional Commits, Chinese subject, body lines start with `- `
