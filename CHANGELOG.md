# Changelog

## [Unreleased]

### Added
- Platform detection (`isMac`): `cmd` key displays ⌘ on macOS, Ctrl on other platforms
- `ctrl` key now displays ⌃ symbol (distinct from `cmd` on all platforms)
- F1-F12 function keys added to key symbol map (display as "F1", "F2", etc.)
- Group selector: dropdown populated from existing groups when adding/editing shortcuts
- "+" button next to group selector to create a new group inline
- Inline group rename: click any group header (including "Ungrouped") to rename it
  - Renaming a group updates all shortcuts in that group
  - Renaming "Ungrouped" assigns the new group name to all ungrouped shortcuts

### Changed
- `normalizeKeys()` accepts optional `isMac` parameter for platform-aware display
- `Kbd` component accepts `isMac` prop and passes it through

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
