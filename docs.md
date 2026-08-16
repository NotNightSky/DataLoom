# DataLoom `.loom` Generator Backends

A `.loom` file is a single source of truth for a generator backend: YAML frontmatter with backend
metadata plus a Handlebars template that turns a parsed `DataDoc` into Fabric DataGen Java code.
The custom Vite plugin (`vite-plugin-loom.ts`) parses the frontmatter with `js-yaml` and precompiles
the template with Handlebars **at build time**, so the browser only loads a tiny precompiled runtime
(`handlebars/runtime.js`). Generation is instantaneous — no client-side template parsing.

## How it works

1. `vite-plugin-loom.ts` splits every imported `.loom` file on the `---` YAML boundaries.
2. The frontmatter is parsed into backend metadata (`id`, `name`, `description`, `defaultJson`).
3. The body is precompiled with `Handlebars.precompile(template)`.
4. Vite serves a plain JS module that exports a `GeneratorBackend` whose `generateJava(doc)`
   calls the precompiled renderer with the `DataDoc` (`{ data: {...} }`).

Because the template is compiled at build time, the app only needs the ~30 KB runtime, and a
`generateJava` call is a single function invocation against a recovered JSON document — edits in
the JSON editor regenerate Java instantly.

## File format

```
---
id: recipe_shaped            # unique backend id (also the card key in GeneratorGrid)
name: Shaped Recipe          # display name
description: ...             # card subtitle
defaultJson: '{}'            # JSON string that seeds the editor
---
<Handlebars template body>
```

The template receives the whole `DataDoc`, so JSON fields are addressed with `data.` paths
(e.g. `{{data.result.id}}`).

## Usage

Install the plugin (already done in this repo):

```bash
pnpm add handlebars
pnpm add -D js-yaml @types/js-yaml
```

Register it in `vite.config.ts`:

```ts
import loomPlugin from './vite-plugin-loom.ts'

plugins: [preact(), tailwindcss(), loomPlugin(), /* ... */]
```

Create a backend, e.g. `src/lib/generators/recipe_shaped.loom`:

```
---
id: recipe_shaped
name: Shaped Recipe
description: Generates a shaped crafting recipe.
defaultJson: '{ "type": "minecraft:crafting_shaped", "pattern": [] }'
---
// Fabric DataGen Recipe
ShapedRecipeJsonBuilder.create(RecipeCategory.MISC, Items.{{data.result.id}}, {{data.result.count}})
{{#each data.pattern}}
    .pattern("{{this}}")
{{/each}}
    .criterion("has_item", conditionsFromItem(Items.DIRT))
    .offerTo(exporter);
```

Import it like any module and add it to `REGISTRY` in `src/lib/generators.ts`:

```ts
import shapedRecipe from './generators/recipe_shaped.loom';

export const REGISTRY: GeneratorBackend[] = [shapedRecipe, /* ... */];
```

The `*.loom` ambient module declaration in `src/vite-env.d.ts` types every `.loom` import as a
`GeneratorBackend`, so `id`, `name`, `description`, `defaultJson` and `generateJava` are
type-checked against `src/lib/types.ts`.

## Template examples

Every JSON field the Spyglass parser recovered is available under `data`.

**Iterate an array (`{{#each}}`):**

```
{{#each data.pattern}}
    .pattern("{{this}}")
{{/each}}
```

**Conditionals (`{{#if}}` / `{{#unless}}`):**

```
{{#if data.result.count}}
    .output(Items.{{data.result.id}}, {{data.result.count}})
{{else}}
    .output(Items.{{data.result.id}})
{{/if}}
```

**Nested objects:**

```
{{#each data.pools}}
    LootTable.builder().pool(LootPool.builder().rolls({{this.rolls}}))
{{/each}}
```

**Conditional presence with `{{#with}}`:**

```
{{#with data.key}}
    .key("{{this}}", Items.DIRT)
{{/with}}
```

**Fallbacks (spyglass may recover partial documents):**

```
ShapedRecipeJsonBuilder.create(RecipeCategory.MISC, Items.{{data.result.id}}, {{data.result.count}})
{{#each data.pattern}}
    .pattern("{{this}}")
{{/each}}
{{#unless data.pattern}}
    .pattern("###")
{{/unless}}
    .criterion("has_item", conditionsFromItem(Items.DIRT))
    .offerTo(exporter);
```

Since templates run on possibly-partially-recovered documents, prefer `{{#each}}`/`{{#if}}` over
hard-coded paths, and provide fallbacks for the fields the editor may not have filled in yet.

## Custom Handlebars helpers

Custom helpers live in `src/lib/handlebars.ts`, a centralized runtime wrapper that registers
helpers and re-exports the `handlebars/runtime.js` instance. The `.loom` plugin imports this file
in every generated module (`import Handlebars from '/src/lib/handlebars.ts'`), so any helper
registered there is available to every template at render time.

Built-in helpers (all defensive — they return safe fallbacks for partial/spyglass-recovered data):

| Helper | Example | Output |
| --- | --- | --- |
| `toItemEnum` | `{{toItemEnum "minecraft:stone_pickaxe"}}` | `STONE_PICKAXE` (falls back to `AIR`) |
| `stripNamespace` | `{{stripNamespace "minecraft:stone_pickaxe"}}` | `stone_pickaxe` (falls back to `""`) |
| `capitalize` | `{{capitalize "cobblestone"}}` | `Cobblestone` (falls back to `""`) |

Usage in a template — helper name first, then the value path:

```
Items.{{toItemEnum data.result.id}}, {{data.result.count}}
.offerTo(exporter, Identifier.of("dataloom", "{{stripNamespace data.result.id}}"))
```

If the user deletes the `id` field mid-edit, the template degrades to `Items.AIR` and
`Identifier.of("dataloom", "")` instead of throwing, so the live preview keeps rendering.

To add a new helper, register it in `src/lib/handlebars.ts` and guard the input:

```ts
Handlebars.registerHelper('snakeCase', (val: unknown) => {
  if (typeof val !== 'string') return '';
  return val.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
});
```

Note on types: `handlebars` ships an empty `runtime.d.ts` stub, so `src/lib/handlebars.runtime.d.ts`
provides a typed facade for the `handlebars/runtime.js` specifier via the `paths` mapping in
`tsconfig.app.json`. That facade is compile-time only — Vite resolves the real module at build time.

## Notes

- The generated module imports `/src/lib/handlebars.ts` (project-root-absolute, resolved by Vite),
  which in turn imports `handlebars/runtime.js` — the `.js` extension is required because
  `handlebars` ships no `exports` map (the bare `handlebars/runtime` subpath does not resolve).
- Frontmatter values are JSON-stringified into the generated module, so any YAML scalar works;
  `defaultJson` should be a JSON string.
- Template errors (bad Handlebars syntax) surface at build/dev time as Vite transform errors —
  the precompile step never runs in the browser.
- The plugin is type-checked by `tsc -b` via `tsconfig.node.json` (it includes
  `vite-plugin-loom.ts`).