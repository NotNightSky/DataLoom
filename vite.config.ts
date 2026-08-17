import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import loomPlugin from './vite-plugin-loom.ts'

export default defineConfig({
  base: '/DataLoom/',
  plugins: [
    preact(),
    tailwindcss(),
    loomPlugin(), // <-- Add the loom plugin here
    nodePolyfills({
      // Spyglass Core expects Node.js builtins even when running in the browser.
      include: [
        'assert',
        'buffer',
        'child_process',
        'constants',
        'crypto',
        'events',
        'fs',
        'http',
        'https',
        'net',
        'os',
        'path',
        'process',
        'punycode',
        'querystring',
        'stream',
        'string_decoder',
        'timers',
        'tls',
        'url',
        'util',
        'zlib',
      ],
      globals: { Buffer: true, process: true },
    }),
  ],
  worker: {
    format: 'es',
  },
  // Pre-bundle heavy dependencies to speed up the dev server
  optimizeDeps: {
    include: [
      'monaco-editor/editor/editor.api.js',
      '@spyglassmc/core',
      '@spyglassmc/json',
    ],
  },
})