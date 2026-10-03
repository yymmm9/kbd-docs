# Changelog

## [Unreleased]

### Added
- **New block types**: Section (divider with title), Note (info/warning/tip/danger admonitions), Code block (syntax-labeled with copy button)
- **Page metadata**: custom title (`?t=`) and description (`?d=`) for shared pages
- **Editing mode**: `?edit=1` shows the form and controls; visitors see only the content
- **Windows key SVG icon** with "win" label for win/windows/super keys
- **Import guide**: expandable `<details>` panel with text/JSON format examples & tips for AI
- **`AGENTS.md` 规范文档**: 完整记录 URL schema、block 类型、键名词汇表，供 AI agent 直接生成分享链接；"Copy for AI" 按钮文本同步升级为完整规范
- **`/llms.txt`**: 站点级机器可读规范（llms.txt 约定），首页 `<link rel="alternate" type="text/markdown">` + meta description 声明，任意 AI 拿到网址即可自学用法
- **Group insertion-order**: groups display in the order their first block was added (instead of alphabetical)
- **Group 展开/收起**: 每组头部新增 chevron 按钮折叠整块；浏览模式点组名/数量徽章也可切换
- **方向键 SVG icon**: `up/down/left/right` 与 `arrow*` 一律渲染为箭头 icon（`symbolKey` 复用 win logo 机制），文本导出仍用 ↑↓←→
- **Shift 键 icon**: ⇧ 图标 + "shift" 小字caption，与 win 键同版式；文本导出仍用 ⇧/Shift
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
- **Grid 移动端 2 列**: 手机也保持两列，卡片 padding/字号、kbd 尺寸在小屏收窄；section 分隔块在 grid 中横跨两列
- **Group 重命名仅在编辑模式触发**: 浏览模式点组名改为折叠，修复访客可改名的 bug
- **Key combo preview**: 3+ alternatives show first 2 + "N more" badge instead of long "or or or" chain
- **Edit/Remove buttons**: added to Section, Note, and Code cards on hover
- **Key listening**: `useGlobalKeyTrap` 始终监听按键（不仅限 test mode），`preventDefault` 仅 test mode 生效
- **Kbd 高亮**: `pressedKeys` 始终传递，`matched` 高亮不依赖 testMode
- **原来硬编码 "Shortcut Cheatsheet"** → 输入框始终可编辑标题和描述

### Fixed
- **`win` 键在 Mac 上显示为 ⌘**: `win`/`windows`/`super` 现在始终渲染 Windows logo（启用 `symbolKey`），平台修饰键改用 `cmd`/`command`/`meta` 表示（Mac ⌘ / 其他 Win）
- **`arrow*` 键无映射**: `arrowup`/`arrowdown`/`arrowleft`/`arrowright` 补入 `KEY_LABELS`，渲染为 ↑↓←→ 而非原始文本
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
