# DataLoom Session Memories

Cumulative memory of what was built/changed in this session. The canonical project guide is `AGENTS.md`; this file records the hows and whys (especially gotchas) behind recent work.

## Spyglass AST & Monaco Integration
* **`src/lib/spyglass.ts` & AST Parsing**: Wrapped `@spyglassmc/core` 0.4.x to parse partial JSON documents live as the user types. Extracts the recovered AST alongside `LanguageError` diagnostics via `ctx.err.dump()`.
* **Monaco Diagnostics**: Mapped Spyglass's flat string-offset diagnostics to Monaco's 2D coordinate system (Line/Column) using `editorModel.getPositionAt()`. Applied error/warning squigglies directly to the editor via `monaco.editor.setModelMarkers`.
* **Partial AST Resilience**: Because Spyglass generates ASTs for broken JSON (e.g., halfway typed strings), backend translations must be defensive against `undefined` nodes.

## `.loom` backend system (vite-plugin-loom)
* **Architecture Rationale**: Standard TypeScript translation fails fatally (`TypeError`) on missing keys from partial ASTs. Handlebars was chosen because it safely evaluates missing variables as empty strings, keeping the live preview crash-free.
* **`vite-plugin-loom.ts`**: Custom Vite plugin at the project root. Splits `.loom` files on `/^---\s*$/m`, parses YAML frontmatter with `js-yaml`, precompiles the body with `Handlebars.precompile`, and emits a JS module default-exporting `{ id, name, description, defaultJson, generateJava(doc) }` (a `GeneratorBackend`).
* **Registration**: Registered in `vite.config.ts` and added to `tsconfig.node.json` `include` so `tsc -b` checks it.
* **File format**: `---` frontmatter (`id`, `name`, `description`, `defaultJson`) + Handlebars body. Template receives the whole `DataDoc`, so paths start with `data.` (`{{data.result.id}}`).
* **Precompile Gotcha**: `Handlebars.precompile()` returns a JS *object-literal string*, NOT a spec object. The plugin embeds it as inline code (`Handlebars.template(${precompiledTemplate})`). Do NOT pass the string to `runtime.template()` directly.
* **Runtime Subpath Gotcha**: Handlebars has no `exports` map, so the bare `handlebars/runtime` specifier fails under Node/Vite. Must import `handlebars/runtime.js`.
* **Type Stub Gotcha**: Handlebars' root `runtime.d.ts` is an empty stub, causing `tsc` to reject default imports. Workaround: Created `src/lib/handlebars.runtime.d.ts` as a typed facade and wired it via `"paths"` in `tsconfig.app.json` (compile-time only).

## Custom Handlebars helpers
* **`src/lib/handlebars.ts`**: Registers helpers on the runtime and default-exports it. Built-ins: `stripNamespace` (id → `minecraft:stone_pickaxe` → `stone_pickaxe`), `toItemEnum` (→ `STONE_PICKAXE`, falls back to `AIR`), and `capitalize`.
* **Defensive Design**: All helpers use `typeof val !== 'string'` guards so partial/recovered documents render safe outputs instead of throwing errors.
* **Plugin Wiring**: Generated modules import `/src/lib/handlebars.ts` (project-root-absolute) instead of the raw runtime, ensuring helper registration is a module side effect before rendering.
* **Verification**: Helpers successfully resolve inside precompiled inline specs. Full docs render correctly (e.g., `Items.STONE_PICKAXE`), and missing IDs gracefully degrade (e.g., `Items.AIR`).

## Backends & generators
* **Registry Update**: `src/lib/generators.ts` now holds only `REGISTRY: GeneratorBackend[] = [shapedRecipe]` and `getBackend(id)`. Legacy in-code backends were deleted.
* **Sole Backend**: `src/lib/generators/recipe_shaped.loom` is currently the only backend.
* **Icon Mapping**: `GeneratorGrid.tsx` `CARD_ICONS` maps `recipe_shaped → CookingPot` with a fallback to `Blocks`.

## Dead-code removal
* **Removed Dependencies**: `monaco-languageclient` (never imported) and `@spyglassmc/mcdoc` (redundant direct dep, already transitive via `@spyglassmc/json`).
* **Package.json Edit Gotcha**: Hand-editing `package.json` with an over-narrow find/replace silently dropped the `handlebars` entry (caught by `tsc` TS2307). Always review file contents post-edit.
* **Tailwind Cleanup**: Removed unused `@theme` block in `src/index.css` (`--color-mc_dark`, `--color-mc_border`).
* **Spyglass Cleanup**: Removed redundant `JsonNode.is(entry)` guard in `src/lib/spyglass.ts` and dropped the unused `JsonNode` value import.
* **CSS & Typings Cleanup**: Removed dead classes (`toolbar-back`, `output-pane`, `.footer-item svg`) and redundant `/// <reference types="vite/client" />` from `src/vite-env.d.ts`.

## Theming (light mode, unified tokens)
* **Single Source of Truth**: `src/styles/theme.css` manages all tokens, imported by `src/index.css`. Component stylesheets (header/editor/grid/footer) must only use these CSS variables.
* **Theme Value Encoding**: `data-theme` on `<html>` combines mode and accent. Options are `purple`/`teal` (dark) and `light`/`light-teal` (light).
* **Header Controls**: Features two independent toggles: Palette (swaps teal/purple) and Sun/Moon (swaps dark/light).
* **Cascade Gotcha**: The teal-accent override MUST come after the light palette block in `theme.css` due to equal specificity; otherwise, `light-teal` renders the light palette's default purple accent.
* **State Management**: `src/lib/theme.ts` manages mode state (`getIsLight` / `setIsLight` / `useIsLight`). `JsonEditor` and `JavaOutput` dynamically pass `theme={isLight ? 'vs' : 'vs-dark'}` to Monaco.

## UI details
* **Scrollbars**: Generator grid scrollbar is hidden while retaining functionality via `scrollbar-width: none;` and `::-webkit-scrollbar { display: none; }`.
* **Search Functionality**: Query state lives in `App.tsx` and passes to `Header` and `GeneratorGrid`. Features case-insensitive filtering over name/id/description, a dynamic count header, and a `.gen-grid-empty` fallback message.

## Verification
* **Build Step**: The singular verification command is `pnpm build` (`tsc -b` followed by `vite build`). No external linting or testing frameworks are configured.
* **Validation**: Run `pnpm build` after every change and ensure the output confirms a successful build without errors.