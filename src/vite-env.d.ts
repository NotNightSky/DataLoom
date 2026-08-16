declare module '*.loom' {
  import type { GeneratorBackend } from './lib/types';
  const backend: GeneratorBackend;
  export default backend;
}