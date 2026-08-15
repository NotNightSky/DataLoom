# DataLoom

A browser tool that converts Minecraft data-pack JSON recipes, tags, and loot tables into Fabric DataGen Java code.

> Status: early. the core conversion UI and logic are still to be built.

## Tech stack

- [Preact](https://preactjs.com/) + TypeScript
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) v4 (`@tailwindcss/vite`)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/react`
- [lucide-react](https://lucide.dev/) icons
- `pnpm` as package manager

## Getting started

Requires Node.js and [pnpm](https://pnpm.io/).

```sh
pnpm install
pnpm dev
```

## Scripts

| Command            | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `pnpm dev`         | Start the Vite dev server                              |
| `pnpm build`       | Typecheck with `tsc -b`, then build with `vite build`  |
| `pnpm preview`     | Serve the built output locally                         |

`pnpm build` is the only verification step — there is no lint or test setup yet.

## Project structure

``` Text
src/
  main.tsx          Entry point
  app.tsx           App root
  index.css         Tailwind config (inline @theme)
  component/        Preact components (TSX)
  styles/           Component stylesheets (CSS)
public/
  favicon.svg       Site icon
  icons.svg         Icon sprite
```

Components live in `src/component/` with their CSS in `src/styles/`. Styling is driven by CSS variables defined in `src/styles/header.css` (dark Material palette: black background, purple/teal accents).

## Roadmap

*This is a Vibe-Coded project and has minimal human intervention.

- Rebuild the three-panel UI: visual builder and JSON editor (Switchable), generated Java output
- Schema-driven conversion of recipes, tags, and loot tables
- Minecraft version targeting
- Export generated `.java` files
