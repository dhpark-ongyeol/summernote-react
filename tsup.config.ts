import { defineConfig } from 'tsup';
import { fileURLToPath } from 'node:url';

// the engine (src/engine) is bundled INTO this single package; only react is external.
const engine = fileURLToPath(new URL('./src/engine/index.ts', import.meta.url));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.alias = { ...(options.alias ?? {}), '@engine': engine };
  },
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
