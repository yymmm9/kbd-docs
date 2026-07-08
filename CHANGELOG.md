# Changelog

## [Unreleased]

### Added
- **New block types**: Section (divider with title), Note (info/warning/tip/danger admonitions), Code block (syntax-labeled with copy button)
- **Page metadata**: custom title (`?t=`) and description (`?d=`) for shared pages
- **Editing mode**: `?edit=1` shows the form and controls; visitors see only the content
- **Windows key SVG icon** with "win" label for win/windows/super keys
- **Import guide**: expandable `<details>` panel with text/JSON format examples & tips for AI
- **Group insertion-order**: groups display in the order their first block was added (instead of alphabetical)
- `normalizeBlocks()` utility for backward-compatible URL loading (old shortcuts without `type` field default to Shortcut)

### Changed
- **Header restructured**: Test mode toggle moved next to ThemeToggle, hero description moved to footer
- **Group input**: always-text-input with dropdown combobox (removed toggle/select)
- **Inline editor**: type selector + conditional fields for Section/Note/Code block editing
- **Grid view is now the default** view mode
- **Key combo preview**: 3+ alternatives show first 2 + "N more" badge instead of long "or or or" chain
- **Edit/Remove buttons**: added to Section, Note, and Code cards on hover

### Fixed
- Windows/super keys now render with proper SVG icon instead of `⊞` Unicode symbol
- Special keys display tooltip labels (`title` attribute) on each kbd element

## [2026-07-06]

### Added
- Group field for organizing shortcuts into collapsible sections
- Multi-combo syntax: space-separated tokens with suffix-only alt support
- Shortcut editing (click pencil icon to modify existing shortcut)
- List/grid view toggle
- Light/dark mode toggle persisted to localStorage with flash-free init
- TXT/JSON export buttons: clipboard copy with "Copied!" feedback
- URL serialization via `nuqs useQueryState("s")`
- Import from file or paste (JSON Array or `keys | action | description` format)
- Key-level press tracking: each key cap lights up independently
- Responsive layout with larger kbd (h-12 text-base)

### Fixed
- Banner light mode text colors (amber-600 dark:amber-300)
- `preventDefault` now skips INPUT/TEXTAREA/SELECT/contentEditable elements in test mode
- Key-level vs shortcut-level press tracking separation
- Extra closing `</button>` tag removed

### Removed
- Share mode / "Enable Share →" toggle (Copy URL always copies current state directly)
