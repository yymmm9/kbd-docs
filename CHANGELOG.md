# Changelog

## [Unreleased]

### Added
- **New block types**: Section (divider with title), Note (info/warning/tip/danger admonitions), Code block (syntax-labeled with copy button)
- **Page metadata**: custom title (`?t=`) and description (`?d=`) for shared pages
- **Editing mode**: `?edit=1` shows the form and controls; visitors see only the content
- **Windows key SVG icon** with "win" label for win/windows/super keys
- **Import guide**: expandable `<details>` panel with text/JSON format examples & tips for AI
- **Group insertion-order**: groups display in the order their first block was added (instead of alphabetical)
- **Search**: filter shortcuts/sections/notes/code blocks by title or description
- **BlockMenu**: edit/delete moved to single `⋮` dropdown, gated by `editing` mode prop
- `normalizeBlocks()` utility for backward-compatible URL loading
- **缺失的 `@/lib/utils` 导出**: `Block`, `KeyItem`, `normalizeKeys`, `normalizeBlocks`, `createBlockId`, `exportShortcutsAsText`, `parseImportText` 等类型和函数

### Changed
- **Header restructured**: Test mode toggle moved next to ThemeToggle, hero description moved to header inputs
- **Group input**: always-text-input with dropdown combobox (removed toggle/select)
- **Inline editor**: type selector → shadcn/ui ToggleGroup (replaced `<select>`)
- **Form field label**: "Action" → "Title"
- **Grid view is now the default** view mode
- **Key combo preview**: 3+ alternatives show first 2 + "N more" badge instead of long "or or or" chain
- **Edit/Remove buttons**: added to Section, Note, and Code cards on hover
- **Key listening**: `useGlobalKeyTrap` 始终监听按键（不仅限 test mode），`preventDefault` 仅 test mode 生效
- **Kbd 高亮**: `pressedKeys` 始终传递，`matched` 高亮不依赖 testMode
- **原来硬编码 "Shortcut Cheatsheet"** → 输入框始终可编辑标题和描述

### Fixed
- Windows/super keys now render with proper SVG icon instead of `⊞` Unicode symbol
- Special keys display tooltip labels (`title` attribute) on each kbd element
- **Missing `</div>`** in Vercel SWC build (Unexpected token `div`)
- **TypeScript strict errors**: 所有 `@/lib/utils` 缺失的导出已补全，全项目零 TS 错误
- **编辑回填 bug**: `startEdit` 中 `block.keys.join("+")` → `c.map(k => k.listenKey).join("+")` 防止 `[object Object]`
- **Geist font**: 替换为 Inter 以修复 `Unknown font Geist` 构建错误
- **parseKeys 后缀 token**: 无 `+` 的后缀 token 视为独立单键而非继承前组合的 prefix（`win+shift+arrowleft arrowRight` 正确渲染为 `win+shift+arrowleft or arrowRight`）
- **Footer 清理**: 移除 "Built with shadcn/ui & Tailwind CSS" 引用文字
- **TypeScript 类型修复**: `parseKeys` 返回 `KeyItem[][]` 而非 `string[][]`；`combosRef` 类型修正；保存时补全缺失的 `combo` 字段；`parseImportText` 导入补全 `description` 字段

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
