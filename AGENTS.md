# AGENTS.md

DataLoom: a browser tool that converts Minecraft data-pack JSON (recipes, tags, loot tables) into Fabric DataGen Java code. The generator picker (`GeneratorGrid`) and the editor workspace (JSON editor + read-only generated-Java pane) are built; JSON parsing is powered by Spyglass, which recovers partial documents from broken JSON.

## Commands

- Package manager is **pnpm** (pnpm-lock.yaml). Do not use npm/yarn.
- `pnpm dev` — Vite dev server
- `pnpm build` — `tsc -b` (typecheck) then `vite build`. This is the only verification step; there is no lint or test setup.
- `pnpm preview` — serve built output

## Stack gotchas

- **Preact**, not React. JSX compiles via `jsxImportSource: "preact"`; never import from `react`. lucide-react icons still work via path alias, but when passing icon components as props, type them `any` to avoid Preact/React JSX type clashes.
- **TypeScript 6** with `erasableSyntaxOnly` (no enums, namespaces, or parameter properties) and `verbatimModuleSyntax` (must use `import type`). `noUnusedLocals/Parameters` are on — unused code fails `pnpm build`.
- `src/app.tsx` is the app root. Components live in `src/component/` (TS only) with their CSS in `src/styles/` — keep styling out of component files. `src/index.css` is the Tailwind config: Tailwind v4 via `@tailwindcss/vite` with an inline `@theme` block — do not add a `tailwind.config` file.
- Theming uses CSS variables (`--app-bg`, `--surface`, `--surface-alt`, `--surface-hover`, `--border`, `--text-primary`, `--text-muted`, `--accent`, `--accent-secondary`, `--warning`) — all defined in one place, `src/styles/theme.css` (imported by `src/index.css`): a dark Material palette (black `#000000` bg, `#121212` surfaces, `#0e0e0e` bars, `#272727` borders, purple `#bb86fc` primary accent, teal `#03dac6` secondary) plus a `[data-theme='light']` override. Component stylesheets (header/editor/grid/footer) must use these vars, never hard-coded colors. Two independent header buttons set `data-theme` on `<html>` — the accent button swaps between `teal`/`purple` (or `light-teal`/`light`), the mode button between dark/light (`light-teal` combines both). The mode also flows through the tiny store in `src/lib/theme.ts` (`useIsLight`/`setIsLight`) so Monaco can switch `vs`/`vs-dark` in `JsonEditor`/`JavaOutput`. Keep new UI on these vars.
- lucide-react no longer ships brand icons (`Github` is absent) — inline the GitHub SVG like `Header.tsx` does.
- `public/` assets (`favicon.svg`, `icons.svg`) are served as-is; `src/assets/` was cleared — put real images back there if needed.

## Editor page and Monaco

- `src/component/EditorPage.tsx` is the abstract editor workspace: left pane is the JSON editor, right pane is the read-only generated-Java output. It takes a `GeneratorBackend` prop; `src/app.tsx` shows the backend picker (`GeneratorGrid`) until one is chosen.
- The two panes are resized by a draggable splitter (`editor-splitter` div between the columns) that drags proportionally: `EditorPage.tsx` stores `split` as the left pane's percentage of available width (clamped 18–82, default 61.5), applied as inline `flexGrow` on each column with `flexBasis: 0`; drag is handled via `pointerdown` + window `pointermove`/`pointerup` listeners and a `body.resizing` class (cursor: col-resize, no text selection). Keep the splitter's 12px width in sync with the 12 subtracted in `updateSplit` if you restyle it.
- Backend abstraction lives in `src/lib/`: `types.ts` defines `DataDoc` and `GeneratorBackend`; `generators.ts` holds the `REGISTRY` array (one entry per `.loom` backend). Add new backends to `REGISTRY`; `getBackend(id)` resolves them. `GeneratorGrid.tsx` renders one card per `REGISTRY` entry via `CARD_ICONS` keyed by backend id (icon components are typed `any`).
- **Monaco is bundled, not CDN**: `src/lib/monaco.ts` wires `loader.config({ monaco })`, imports the lean `monaco-editor/editor/editor.api.js` (NOT the full `monaco-editor` package — that pulls in every language and the ~7 MB TS worker), adds only the JSON language via `monaco-editor/language/json/monaco.contribution.js`, registers a custom `java` Monarch language, and sets up `MonacoEnvironment` workers from `?worker` imports.
- Monaco worker imports must use the exports-map-friendly specifier (`monaco-editor/editor/editor.worker.js?worker`, `monaco-editor/language/json/json.worker.js?worker`) — `monaco-editor/esm/vs/...` paths fail to resolve under Vite/Rolldown.
- Never import `monaco-editor` (full package). If a new language/feature is needed, import its `monaco.contribution.js` from `monaco-editor/language/...` or the lean entry.
- `vite.config.ts` sets `worker: { format: 'es' }` (required for monaco workers). Do not remove.

## Spyglass parsing

- `src/lib/spyglass.ts` is a singleton browser wrapper around @spyglassmc/core (0.4.x). It constructs a `Project` with `BrowserExternals` (`@spyglassmc/core/lib/browser.js`) and the JSON initializer (`@spyglassmc/json`'s `getInitializer()`), calls `project.init()` only (no `ready()` — vanilla datapack providers are skipped on purpose; no network), and parses documents with its own `ParserContext` + core `file(parser)`. `Service` has no `parse()` and no `ready()` in 0.4.x — do not use the older public API.
- `parse()` returns a `DataDoc` (mirroring the strict `{ "data": { ... } }` envelope) plus `errors` and a `recovered` flag. Spyglass keeps generating an AST for broken JSON, so the Java backends keep working on partial documents; `recovered` is detected via a strict `JSON.parse` probe.
- `EditorPage.handleJsonChange` runs the parse through a debounced, sequence-guarded async flow (`parseTimer`/`parseSeq` refs); the JSON pane shows boot/OK/recovered chips via props on `JsonEditor`.
- `runtime` note: Spyglass's own libs are browser-clean, but `vite-plugin-node-polyfills` in `vite.config.ts` is still required for the transitive CJS deps (decompress, graceful-fs, follow-redirects). Don't remove the plugin's `include` list.
- `vscode-languageserver-textdocument` is a direct dependency (used to create the `TextDocument` for `ParserContext`).

## Features & specs

- **Backend picker** (`src/app.tsx` + `GeneratorGrid.tsx`): the app starts with no backend selected, so the picker page is shown until one is chosen; `EditorPage` gets the chosen backend and a back button that resets to the picker. Cards are rendered one per `REGISTRY` entry with an icon (`CARD_ICONS` keyed by backend id, fallback `Blocks`), the backend `name`, `description`, and an "Open" CTA; the grid header shows the backend count.
- **Backend contract**: a backend is `{ id, name, description, defaultJson, generateJava(doc) }`. `defaultJson` seeds both the JSON editor text and the initial `DataDoc` (via `parseDefaultJson`, which falls back to `{ data: {} }`). Backends now live as `.loom` files (YAML frontmatter + Handlebars template) compiled by the custom `vite-plugin-loom.ts`; `REGISTRY` ships one: `recipe_shaped` (see `src/lib/generators/recipe_shaped.loom`). Custom Handlebars helpers (`toItemEnum`, `stripNamespace`, `capitalize`) are registered centrally in `src/lib/handlebars.ts`.
- **Editor workspace** (`EditorPage`): left pane is the JSON editor, right pane is read-only generated Java; both are Monaco (vs-dark). The splitter drags proportionally (`split` % clamped 18–82, default 61.5, splitter width 12px). Toolbar shows back button, `name — id`, and `backend: <id>`. Java is recomputed via `useMemo(generateJava(doc))` whenever the parsed doc changes.
- **JSON editor status chips** (`JsonEditor`): while Spyglass boots → "Spyglass booting…"; parse failure → "Invalid JSON" with the message in a tooltip; parse succeeded but doc was recovered or issues exist → "Recovered N issues"/"N issues" with messages in the tooltip; clean parse → "Valid JSON". Footer states that broken documents still generate from recovered parts.
- **Spyglass recovery flow**: parsing is debounced 80 ms and sequence-guarded (`parseTimer`/`parseSeq`) so stale results are dropped; a partial AST still yields a `DataDoc` and regenerates Java, so edits never block the output — the JSON pane only shows an error when no usable root object could be extracted.
- **Copy button** (`JavaOutput`): copies the generated Java via `navigator.clipboard`; shows "Copied" with a check for 2 s.
- **Header** (`Header.tsx`): brand + DataLoom wordmark, a search input (controlled — filters the generator grid via `App.tsx` state, searching name/id/description), an accent button (Palette icon toggling `data-theme` between `teal` and `purple`) and a mode button (Sun/Moon icon toggling dark/light), both on `<html>` (default purple + dark), and an inline GitHub SVG link to the profile (lucide's `Github` icon is unavailable).
- **Footer** (`Footer.tsx`): attribution to NotNightSky with a ♡, "Made with Vite and Preact".

## Conventions

- App is conspicuously mono-panel-styled (VS Code dark theme, side-by-side panels); keep new UI in that style — black background with Material purple/teal accents.
- Editor pages use the shared `editor.css` classes (`editor-view`, `editor-toolbar`, `editor-columns`, `editor-pane`, `pane-header/body/footer`, `pane-btn`) — reuse these when adding panels; don't reinvent.