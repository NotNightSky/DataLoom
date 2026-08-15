import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    preact(),
    tailwindcss(),
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
})