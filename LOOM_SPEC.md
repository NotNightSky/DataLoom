# `.loom` Filetype Specification

A machine-readable spec for syntax highlighting and intellisense of DataLoom's `.loom` generator
files. Companion to `docs.md` (usage-oriented); this document is normative for editor tooling:
grammars, token scopes, schemas, completions, and diagnostics.

## 1. File identity

| Property | Value |
| --- | --- |
| Extension | `.loom` |
| Language id | `loom` |
| TextMate scope | `source.loom` |
| MIME | `text/x-loom` |
| Fallback detection | `firstLineMatch: '^---\\s*$'` |

A `.loom` file is **two regions**: a YAML frontmatter block (metadata) and a Handlebars template
body (code generation). The build plugin (`vite-plugin-loom.ts`) splits on the regex
`/^---\s*$/m` and requires at least three parts, i.e. exactly two `---` delimiter lines
opening/closing the frontmatter. **Only the first two `---` lines are delimiters** — `---` lines
later in the body are template text (the plugin re-joins them via `parts.slice(2).join('---')`).

## 2. File structure

```
loom-file     := frontmatter-delim template-body
frontmatter   := '---' EOL yaml-document EOL '---' EOL
template-body := ( mustache | text )*
mustache      := '{{' WS? expression WS? '}}'
               | '{{{' WS? expression WS? '}}}'          (unescaped)
               | '{{&' WS? expression WS? '}}'           (unescaped)
               | '{{!' comment '}}'                      (comment)
               | '{{!--' comment '--}}'                  (block comment)
expression    := block-open | block-close | helper-call | path | literal
block-open    := '#' keyword args '}}' ... '{{/' keyword '}}'
block-close   := '/' keyword
helper-call   := identifier args            e.g. {{toItemEnum data.result.id}}
subexpression := '(' helper-call ')'        e.g. (eq data.type "minecraft:crafting_shaped")
path          := segment ( '.' segment )*   e.g. data.result.id, this, @key, ../data.x
literal       := '"str"' | "'str'" | number | true | false | null | undefined
WS            := whitespace and the whitespace-strip markers '~' / '~'
```

The frontmatter delimiter line is `---` followed by optional trailing whitespace. YAML is parsed
with `js-yaml`; the body is precompiled with `Handlebars.precompile` **at build time**, so grammar
errors surface as Vite transform errors, never in the browser.

## 3. Frontmatter schema

Exactly four keys are consumed; everything else is ignored by the plugin (but flagged by tooling).

| Key | Type | Required | Default | Constraints |
| --- | --- | --- | --- | --- |
| `id` | string | yes | — | `^[a-z][a-z0-9_]*$` (snake_case; also the `GeneratorGrid` card key) |
| `name` | string | yes | — | display name |
| `description` | string | yes | — | card subtitle |
| `defaultJson` | string | no | `'{}'` | must parse as JSON; seeds the editor and drives path completion |

Reference JSON Schema (wire into `yaml-language-server` via `yaml.schemas`):

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DataLoom backend frontmatter",
  "type": "object",
  "required": ["id", "name", "description"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9_]*$",
      "description": "Unique backend id; snake_case. Also the GeneratorGrid card key."
    },
    "name": { "type": "string", "description": "Display name shown on the backend card." },
    "description": { "type": "string", "description": "Card subtitle." },
    "defaultJson": {
      "type": "string",
      "contentMediaType": "application/json",
      "description": "JSON string that seeds the editor; drives data-path completion."
    }
  }
}
```

## 4. Template language and data model

The template is standard Handlebars (Mustache syntax) with the following in-scope surface:

- **Data context**: the renderer is called with the whole `DataDoc` (`{ data: {...} }`), so every
  JSON field is addressed as `data.<path>` — `{{data.result.id}}`. `{{data}}` is the whole
  recovered object. The AST may be **partial** (Spyglass recovery), so paths may be absent.
- **Block helpers**: `{{#if}}`, `{{#unless}}`, `{{#each}}`, `{{#with}}`, with `{{else}}`,
  `{{else if (…)}}` chaining and `{{/keyword}}` closers. Inside `{{#each}}`: `{{this}}`, `{{@key}}`
  (object iteration), `{{@index}}`, `{{@first}}`, `{{@last}}`; `{{@root}}` escapes to the doc root;
  `../` walks up one level.
- **Subexpressions**: `(helper arg …)` — e.g. `{{#if (eq data.type "minecraft:smelting")}}`.
- **Literals**: `"…"` / `'…'` strings, numbers, `true`/`false`/`null`/`undefined`.
- **Comments**: `{{! … }}` and `{{!-- … --}}`.
- **Whitespace control**: `{{~` and `~}}` strip surrounding whitespace.
- **Unescaped output**: `{{{expr}}}` and `{{&expr}}` skip HTML escaping. **Escaping matters**:
  `{{expr}}` HTML-escapes (`&` → `&amp;`), which corrupts Java string output; prefer helpers that
  return `Handlebars.SafeString` (see §5) or triple mustache for Java-string content.
- **Out of scope (unsupported)**: partials (`{{> …}}` throws at render — no partials registered),
  decorators, raw blocks, dynamic paths.

## 5. Helper catalog (built-ins + customs)

Built-in keywords: `if`, `unless`, `each`, `with`, `else`, `lookup`, `log`.

Custom helpers, registered centrally in `src/lib/handlebars.ts` (all defensive — safe fallbacks
for partially recovered data):

| Helper | Signature | Returns | Fallback |
| --- | --- | --- | --- |
| `stripNamespace` | `(val: string) → string` | path part after `:` (`minecraft:stone` → `stone`) | `''` |
| `toItemEnum` | `(val: string) → string` | UPPER_SNAKE path (`minecraft:stone_pickaxe` → `STONE_PICKAXE`) | `AIR` |
| `capitalize` | `(val: string) → string` | first char uppercased | `''` |
| `recipeCategory` | `(val: string) → string` | `building`/`building_blocks`/`blocks`→`BUILDING_BLOCKS`, `redstone`→`REDSTONE`, `food`→`FOOD`, `tools`→`TOOLS`, `combat`→`COMBAT`, `decorations`/`decoration`→`DECORATIONS`, else `MISC` | `MISC` |
| `recipeUnlock` | `(val) → SafeString` | `Items.X` / `ItemTags.X` / `TagKey.create(…)` for the first ingredient | `Items.DIRT` |
| `tagEntry` | `(val) → SafeString` | `.add(Identifier.of("…"))`, `.addTag(…)`, `.addOptionalTag(…)`, `.forceAddTag(…)` | `''` |
| `coalesce` | `(val, fallback)` | `val` if not `null`/`undefined`/`''`, else `fallback` | — |
| `eq` | `(a, b) → boolean` | strict equality | — |
| `or` | `(…args) → boolean` | any truthy | — |
| `and` | `(…args) → boolean` | all truthy | — |

`recipeUnlock`/`tagEntry` return `SafeString` → not HTML-escaped; the rest are escaped by
`{{…}}`. Helpers are invoked helper-name-first: `{{toItemEnum data.result.id}}`.

## 6. Syntax highlighting

### 6.1 Token taxonomy (scopes)

| Construct | TextMate scope |
| --- | --- |
| Whole file | `source.loom` |
| Frontmatter region | `meta.frontmatter.loom` |
| `---` delimiters | `punctuation.definition.frontmatter.loom` |
| YAML key | `entity.name.tag.yaml` |
| YAML scalar / quoted string | `string.unquoted.yaml` / `string.quoted.single.yaml` / `string.quoted.double.yaml` |
| YAML comment | `comment.line.number-sign.yaml` |
| `{{` / `}}` (and `{{{`/`}}}`) | `punctuation.definition.mustache.begin/end.loom` |
| Mustache expression region | `meta.expression.mustache` |
| `#` / `/` block markers | `punctuation.definition.block.mustache` |
| Built-in keywords (`if`/`unless`/`each`/`with`/`else`/`lookup`/`log`) | `keyword.control.handlebars` |
| Custom helpers (fixed list, §5) | `support.function.handlebars` |
| Unknown helper names | `entity.name.function.handlebars` |
| Paths (`data.x.y`) | `variable.other.handlebars` |
| `this` / `.` | `variable.language.this.handlebars` |
| `@key`/`@index`/`@first`/`@last`/`@root` | `variable.parameter.handlebars` |
| `../` | `variable.language.parent.handlebars` |
| String literals inside mustache | `string.quoted.double/single.handlebars` |
| Numbers | `constant.numeric.handlebars` |
| `true`/`false`/`null`/`undefined` | `constant.language.handlebars` |
| Subexpression parens | `punctuation.parenthesis.handlebars` |
| `{{! … }}` / `{{!-- … --}}` | `comment.block.handlebars` |
| Plain body text (Java source) | `text.loom` (optionally `source.java` via embedding) |

### 6.2 Canonical Monarch grammar (Monaco)

Reference implementation matching the conventions of `src/lib/monaco.ts` (a `loom` language can be
registered the same way `java` is, via `registerLoomLanguage()`):

```ts
const loomMonarch: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.loom',
  ignoreCase: false,
  brackets: [
    { token: 'punctuation.definition.mustache.begin', open: '{{', close: '}}' },
    { token: 'punctuation.definition.mustache.unescaped.begin', open: '{{{', close: '}}}' },
  ],
  customHelpers: ['stripNamespace', 'toItemEnum', 'capitalize', 'recipeCategory',
    'recipeUnlock', 'tagEntry', 'coalesce', 'eq', 'or', 'and'],
  blockKeywords: ['if', 'unless', 'each', 'with', 'else', 'lookup', 'log'],
  tokenizer: {
    root: [
      // Only a `---` line at the very start of the file opens the frontmatter.
      [/^---[ \t]*$/, 'punctuation.definition.frontmatter', '@frontmatter'],
      [/[\s\S]/, { token: 'text', next: '@body' }],
    ],
    frontmatter: [
      [/^---[ \t]*$/, 'punctuation.definition.frontmatter', '@body'],
      [/#.*$/, 'comment.line.number-sign.yaml'],
      [/[A-Za-z_][A-Za-z0-9_-]*(?=\s*:)/, 'entity.name.tag.yaml'],
      [/['"][^'"]*['"]/, 'string.quoted.yaml'],
      [/[A-Za-z0-9_.:\-]+/, 'string.unquoted.yaml'],
      [/[ \t\r\n]+/, 'white'],
      [/./, 'invalid.illegal.yaml'],
    ],
    body: [
      [/{{~?!--[\s\S]*?--~?}}/, 'comment.block.handlebars'],
      [/{{~?![\s\S]*?~?}}/, 'comment.block.handlebars'],
      [/{{~?&/, { token: 'punctuation.definition.mustache.unescaped.begin', next: '@mustacheUnescaped' }],
      [/{{{~?/, { token: 'punctuation.definition.mustache.unescaped.begin', next: '@mustacheUnescaped' }],
      [/{{~?/, { token: 'punctuation.definition.mustache.begin', next: '@mustache' }],
      [/[^{}]+/, 'text'],
      [/[{}]/, 'invalid.illegal.stray-brace'],
    ],
    mustache: [
      [/~?}}/, { token: 'punctuation.definition.mustache.end', next: '@pop' }],
      { include: '@mustacheInner' },
    ],
    mustacheUnescaped: [
      [/~?}}}/, { token: 'punctuation.definition.mustache.unescaped.end', next: '@pop' }],
      { include: '@mustacheInner' },
    ],
    mustacheInner: [
      [/[#/]/, 'punctuation.definition.block.mustache'],
      [/[A-Za-z_][\w-]*/, {
        cases: {
          '@customHelpers': 'support.function.handlebars',
          '@blockKeywords': 'keyword.control.handlebars',
          '@default': 'entity.name.function.handlebars',
        },
      }],
      [/@(?:key|index|first|last|root)/, 'variable.parameter.handlebars'],
      [/\bthis\b/, 'variable.language.this.handlebars'],
      [/\.\.\//, 'variable.language.parent.handlebars'],
      [/[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/, 'variable.other.handlebars'],
      [/"(?:[^"\\]|\\.)*"/, 'string.quoted.double.handlebars'],
      [/'(?:[^'\\]|\\.)*'/, 'string.quoted.single.handlebars'],
      [/\d+(\.\d+)?/, 'constant.numeric.handlebars'],
      [/\b(?:true|false|null|undefined)\b/, 'constant.language.handlebars'],
      [/[()]/, 'punctuation.parenthesis.handlebars'],
      [/[ \t\r\n]+/, 'white'],
    ],
  },
};
```

Notes:

- The `root → frontmatter → body` chain guarantees `---` lines inside the template body are never
  misread as delimiters (§1). The frontmatter region is entered only from the file start.
- `{{{`/`{{&` share `mustacheInner` with `{{` but pop on `}}}` — keep the closing rule *before*
  the shared include.
- Custom helpers are matched from a fixed list, so misspelled helpers tokenize as
  `entity.name.function.handlebars` instead of `support.function.handlebars` (mirrors §8, LOOM007).

### 6.3 Language configuration (Monaco / VS Code)

```ts
monaco.languages.setLanguageConfiguration('loom', {
  comments: { blockComment: ['{{!--', '--}}'] },
  brackets: [['{{', '}}'], ['{{{', '}}}'], ['{', '}'], ['(', ')'], ['"', '"']],
  autoClosingPairs: [
    { open: '{{', close: '}}' },
    { open: '{{{', close: '}}}' },
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{{', close: '}}' }, { open: '{', close: '}' },
    { open: '(', close: ')' }, { open: '"', close: '"' }, { open: "'", close: "'" },
  ],
  folding: { markers: { start: '^\\s*\\{\\{#', end: '^\\s*\\{\\{/' } },
  wordPattern: /-?[\d.]+|[A-Za-z_$][\w$]*|@[A-Za-z]+/,
});
```

### 6.4 Theme colors

Custom Monarch tokens are not colored by the default `vs`/`vs-dark` themes. If registered inside
DataLoom, add rules to the active theme, mapped to the app palette (`src/styles/theme.css`):

| Token | Color |
| --- | --- |
| `support.function.handlebars` (custom helpers) | `--accent` (`#bb86fc` purple) |
| `keyword.control.handlebars` (blocks) | `--accent-secondary` (`#03dac6` teal) |
| `variable.other.handlebars` / `variable.parameter.handlebars` (paths, `@key`) | `--text-primary` |
| `string.quoted.*.handlebars`, `comment.block.handlebars` | existing dark-theme string/comment colors |
| `entity.name.tag.yaml` (frontmatter keys) | `--accent-secondary` |

## 7. Intellisense

### 7.1 Completion providers

| Provider | Trigger context | Items |
| --- | --- | --- |
| Frontmatter keys | inside `meta.frontmatter` region, after `key:` or new line | `id`, `name`, `description`, `defaultJson` with docs from §3 (schema-driven via YAML-LS) |
| Block helpers | after `{{` + `#` or `{{` + `{{#` | `if`, `unless`, `each`, `with` as snippets with `{{/…}}` closer; `else`, `else if` when an open block exists |
| Custom helpers | after `{{` or inside a subexpression `(` | the ten helpers from §5 with signatures + docs; insert helper-name-first form `{{<helper> $0}}` |
| Data paths | after `data.` or inside `{{#if`/`{{#each`/helper arg position | paths derived by recursively walking the **parsed `defaultJson`** (`data.result.id`, `data.key.l`, …); re-derived whenever `defaultJson` changes; plus `this`, `@key`, `@index`, `@root`, `../` where valid |
| Snippets | empty file | full backend boilerplate (`---` block + template) |

The `defaultJson`-driven path provider is the key feature: parse the frontmatter `defaultJson`
string as JSON and emit every `data.<dot-path>` reachable from the root object.

### 7.2 Signature help

Available for: `coalesce(value, fallback)`, `eq(a, b)`, `or(…args)`, `and(…args)`,
`recipeUnlock(value)`, `tagEntry(value)`, `toItemEnum(value)`, `stripNamespace(value)`,
`capitalize(value)`, `recipeCategory(value)` — parameter list and docs per §5.

### 7.3 Hover

For each helper: signature, description, fallback behavior, and one example
(e.g. `toItemEnum` → "`minecraft:stone_pickaxe` → `STONE_PICKAXE`; falls back to `AIR`").
For a `data.x.y` path: type hint `any` (recovered AST) and a note that the value may be absent
in partial documents.

### 7.4 Schema wiring (frontmatter only)

Associate the §3 JSON Schema with `.loom` files in `yaml-language-server`:

```jsonc
// .vscode/settings.json (or yaml.schemas)
{
  "yaml.schemas": {
    "./loom-frontmatter.json": ["*.loom"]
  }
}
```

Caveat: plain YAML-LS treats the whole file as YAML, so template body validation is noisy.
For full coverage use a dedicated language server (see §9).

## 8. Diagnostics

| Code | Severity | Message | Trigger |
| --- | --- | --- | --- |
| `LOOM001` | error | Missing `---` frontmatter delimiters (must be first two `---`-only lines) | file structure |
| `LOOM002` | error | Frontmatter missing required key: `id` / `name` / `description` | frontmatter |
| `LOOM003` | error | `id` must match `^[a-z][a-z0-9_]*$` | frontmatter |
| `LOOM004` | warning | Unknown frontmatter key `x` (ignored by the plugin) | frontmatter |
| `LOOM005` | error | `defaultJson` is not valid JSON | frontmatter |
| `LOOM006` | error | Template failed to precompile: `<message>` (unbalanced `{{#…}}`/`{{/…}}`, bad subexpression) | body |
| `LOOM007` | warning | Unknown helper `foo` — renders literally as text | body |
| `LOOM008` | warning | Partials are not registered; `{{> …}}` throws at render | body |

`LOOM001`–`LOOM005` mirror the build plugin's own failure modes (`parts.length < 3` throw,
`js-yaml` parse, `defaultJson` misuse); `LOOM006` mirrors `Handlebars.precompile` failure.

## 9. Editor integration

**Monaco (in DataLoom):** register `loom` like `java` in `src/lib/monaco.ts` — §6.2 Monarch,
§6.3 configuration, §6.4 theme rules — then `monaco.editor.createModel(text, 'loom')` for
`.loom` files. No `monaco.contribution.js` import exists for Handlebars, so a custom language is
required (same pattern as the existing `java` registration).

**VS Code extension:** contribute a language with the TM grammar (scopes per §6.1, structure per
§1) plus the configuration from §6.3:

```json
{
  "contributes": {
    "languages": [{
      "id": "loom",
      "aliases": ["DataLoom", "loom"],
      "extensions": [".loom"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "loom",
      "scopeName": "source.loom",
      "path": "./syntaxes/loom.tmLanguage.json"
    }]
  }
}
```

**Language server:** implement §7 providers and §8 diagnostics over the language id `loom`.
Recommended split: frontmatter range = `meta.frontmatter.loom`; body range = everything after the
second `---` line (exclusive).