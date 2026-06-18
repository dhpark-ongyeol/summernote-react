import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fromRoot = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

// GitHub Pages serves 404.html for any unknown path. For a client-routed SPA, copy the BUILT
// index.html (its asset URLs are already base-prefixed) to 404.html so deep links / refreshes on
// /summernote-react/docs/... boot the app and let React Router take over.
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    writeBundle(options) {
      const dir = options.dir ?? 'dist';
      copyFileSync(resolve(dir, 'index.html'), resolve(dir, '404.html'));
    },
  };
}

// the demo imports the editor SOURCE directly (no build step) — alias the package + its @engine.
// `base` for a production build = the GitHub Pages project path (https://eaeao.github.io/summernote-react/);
// dev serves at '/'. Override at build time with `vite build --base=/your-repo/` if you fork/rename.
// `vite preview` runs with command === 'serve', so gate the Pages base on build OR preview —
// otherwise preview serves the base-baked dist at '/' and every hashed asset 404s. Dev stays at '/'.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/summernote-react/' : '/',
  plugins: [react(), spaFallback()],
  // the demo imports editor source (incl. font assets) from the repo root, one level above demo/.
  // allow Vite to serve files from there.
  server: {
    fs: {
      allow: [fromRoot('..')],
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@eaeao/summernote-react': fromRoot('../src/index.ts'),
      '@engine': fromRoot('../src/engine/index.ts'),
    },
  },
}));
