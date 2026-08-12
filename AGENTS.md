# AGENTS.md

DataLoom: a browser tool that converts Minecraft data-pack JSON (recipes, tags, loot tables) into Fabric DataGen Java code. The editor page is built (Visual/JSON editors + read-only generated-Java pane); the generator backend picker page does not exist yet.

## Commands

- Package manager is **pnpm** (pnpm-lock.yaml). Do not use npm/yarn.
- `pnpm dev` — Vite dev server
- `pnpm build` — `tsc -b` (typecheck) then `vite build`. This is the only verification step; there is no lint or test setup.
- `pnpm preview` — serve built output

## Stack gotchas

- **Preact**, not React. JSX compiles via `jsxImportSource: "preact"`; never import from `react`. lucide-react icons still work via path alias, but when passing icon components as props, type them `any` to avoid Preact/React JSX type clashes.
- **TypeScript 6** with `erasableSyntaxOnly` (no enums, namespaces, or parameter properties) and `verbatimModuleSyntax` (must use `import type`). `noUnusedLocals/Parameters` are on — unused code fails `pnpm build`.
- `src/app.tsx` is the app root. Components live in `src/component/` (TS only) with their CSS in `src/styles/` — keep styling out of component files. `src/index.css` is the Tailwind config: Tailwind v4 via `@tailwindcss/vite` with an inline `@theme` block — do not add a `tailwind.config` file.
- Theming uses CSS variables (`--app-bg`, `--surface`, `--border`, `--text-primary`, `--text-muted`, `--accent`, `--accent-secondary`) defined in `src/styles/header.css` using a dark Material palette: black `#000000` bg, `#121212` surfaces, `#272727` borders, purple `#bb86fc` primary accent, teal `#03dac6` secondary. The header's palette button sets `data-theme="teal"` on `<html>` to swap which accent is primary — there is no light theme. Keep new UI on these vars.
- lucide-react no longer ships brand icons (`Github` is absent) — inline the GitHub SVG like `Header.tsx` does.
- `public/` assets (`favicon.svg`, `icons.svg`) are served as-is; `src/assets/` was cleared — put real images back there if needed.

## Editor page and Monaco

- `src/component/EditorPage.tsx` is the abstract editor workspace: left pane toggles Visual/JSON via the mode buttons, right pane is the read-only generated-Java output. It takes a `GeneratorBackend` prop, so another page can pick the backend — none exists yet.
- Backend abstraction lives in `src/lib/`: `types.ts` defines `DataDoc`, `FieldSchema`, `GeneratorBackend`; `generators.ts` holds a `REGISTRY` array plus a placeholder recipe backend (schema-driven visual form + Java generation). Add new backends to `REGISTRY`; `getBackend(id)` resolves them.
- `src/component/VisualEditor.tsx` renders any `FieldSchema` generically (string/number/boolean/select/array/object) — no per-type hardcoding in the page.
- **Monaco is bundled, not CDN**: `src/lib/monaco.ts` wires `loader.config({ monaco })`, imports the lean `monaco-editor/editor/editor.api.js` (NOT the full `monaco-editor` package — that pulls in every language and the ~7 MB TS worker), adds only the JSON language via `monaco-editor/language/json/monaco.contribution.js`, registers a custom `java` Monarch language, and sets up `MonacoEnvironment` workers from `?worker` imports.
- Monaco worker imports must use the exports-map-friendly specifier (`monaco-editor/editor/editor.worker.js?worker`, `monaco-editor/language/json/json.worker.js?worker`) — `monaco-editor/esm/vs/...` paths fail to resolve under Vite/Rolldown.
- Never import `monaco-editor` (full package). If a new language/feature is needed, import its `monaco.contribution.js` from `monaco-editor/language/...` or the lean entry.
- `vite.config.ts` sets `worker: { format: 'es' }` (required for monaco workers). Do not remove.

## Conventions

- App is conspicuously mono-panel-styled (VS Code dark theme, side-by-side panels); keep new UI in that style — black background with Material purple/teal accents.
- Editor pages use the shared `editor.css` classes (`editor-view`, `editor-toolbar`, `mode-toggle`, `editor-columns`, `editor-pane`, `pane-header/body/footer`, `pane-btn`) — reuse these when adding panels; don't reinvent.