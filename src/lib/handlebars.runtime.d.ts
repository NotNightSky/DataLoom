/**
 * Type facade for `handlebars/runtime.js`.
 *
 * The package's own `runtime.d.ts` is an empty stub, so tsc can't see the
 * default export. This facade is wired up via the `paths` mapping in
 * tsconfig.app.json and is erased at build time — Vite resolves the real
 * `handlebars/runtime.js` module from node_modules, which exports the same
 * runtime object (template, registerHelper, helpers, ...).
 */
import type * as Handlebars from 'handlebars';

declare const runtime: typeof Handlebars;
export default runtime;