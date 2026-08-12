# AGENTS.md

DataLoom: a browser tool that converts Minecraft data-pack JSON (recipes, tags, loot tables) into Fabric DataGen Java code. Currently a minimal blank scaffold — the three-panel prototype was scrapped; rebuild the UI from here.

## Commands

- Package manager is **pnpm** (pnpm-lock.yaml). Do not use npm/yarn.
- `pnpm dev` — Vite dev server
- `pnpm build` — `tsc -b` (typecheck) then `vite build`. This is the only verification step; there is no lint or test setup.
- `pnpm preview` — serve built output

## Stack gotchas

- **Preact**, not React. JSX compiles via `jsxImportSource: "preact"`; never import from `react`. lucide-react icons still work via path alias, but when passing icon components as props, type them `any` to avoid Preact/React JSX type clashes.
- **TypeScript 6** with `erasableSyntaxOnly` (no enums, namespaces, or parameter properties) and `verbatimModuleSyntax` (must use `import type`). `noUnusedLocals/Parameters` are on — unused code fails `pnpm build`.
- `src/app.tsx` is the app root; `src/index.css` is the Tailwind config: Tailwind v4 via `@tailwindcss/vite` with custom theme colors (`mc_dark`, `mc_border`) declared inline in `@theme` — do not add a `tailwind.config` file.
- `public/` assets (`favicon.svg`, `icons.svg`) are served as-is; `src/assets/` was cleared — put real images back there if needed.

## Conventions

- App is conspicuously mono-panel-styled (VS Code dark theme, three side-by-side panels); keep new UI in that style — the scrapped prototype's design language: `#1e1e1e` background, `#3c3c3c` header, sky-blue (`text-sky-400`) accents.
- Semicolons are used in `app.tsx`, though the template omits them elsewhere; match the surrounding file.