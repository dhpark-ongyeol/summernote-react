import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DOCS } from './docs-manifest';

const fromRoot = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

// Deployed GitHub Pages origin (matches `base`); used in the generated AI artifacts' absolute URLs.
const SITE = 'https://eaeao.github.io/summernote-react';
const REPO = 'https://github.com/eaeao/summernote-react/blob/main';

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

// Emit agent-readable artifacts alongside the built site (see docs/use-with-ai.md):
//  - dist/docs/<slug>.md   per-page Markdown mirrors (the "View as Markdown" / append-.md target)
//  - dist/llms.txt         a curated, section-grouped index of every page (llmstxt.org convention)
//  - dist/llms-full.txt    the whole corpus concatenated into one file
// All three read the English docs/*.md via the shared DOCS manifest, so they never drift from the site.
function aiDocsArtifacts(): Plugin {
  const SECTION_ORDER = ['Overview', 'Tutorial', 'How-to', 'Reference', 'Explanation', 'AI'];
  return {
    name: 'ai-docs-artifacts',
    apply: 'build',
    writeBundle(options) {
      const dir = options.dir ?? 'dist';
      mkdirSync(resolve(dir, 'docs'), { recursive: true });

      const pages = DOCS.map((d) => ({
        ...d,
        raw: readFileSync(fromRoot(`../docs/${d.file}`), 'utf8'),
        mdUrl: `${SITE}/docs/${d.slug}.md`,
      }));

      // 1) per-page Markdown mirrors
      for (const p of pages) {
        writeFileSync(resolve(dir, 'docs', `${p.slug}.md`), p.raw);
      }

      // 2) llms.txt — H1 + summary + H2-per-section link index, then an Agent files section
      const groups = new Map<string, typeof pages>();
      for (const p of pages) {
        const key = p.section ?? 'Overview';
        const arr = groups.get(key) ?? [];
        arr.push(p);
        groups.set(key, arr);
      }
      const keys = [...groups.keys()].sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
      let llms =
        '# @eaeao/summernote-react\n\n' +
        '> React + TypeScript port of the summernote WYSIWYG editor — the editor engine and React bindings in one package, with zero runtime dependencies and no jQuery.\n\n';
      for (const key of keys) {
        llms += `## ${key}\n`;
        for (const p of groups.get(key)!) llms += `- [${p.title}](${p.mdUrl}): ${p.description}\n`;
        llms += '\n';
      }
      llms +=
        '## Agent files\n' +
        `- [AGENTS.md](${REPO}/AGENTS.md): Dense, self-contained API reference shipped in the npm package.\n` +
        `- [SKILL.md](${REPO}/SKILL.md): Anthropic Agent Skill entry shipped in the npm package.\n` +
        `- [llms-full.txt](${SITE}/llms-full.txt): The complete documentation concatenated into one file.\n`;
      writeFileSync(resolve(dir, 'llms.txt'), llms);

      // 3) llms-full.txt — the full corpus, one page after another
      let full =
        '# @eaeao/summernote-react — full documentation\n\n' +
        `> Source: ${SITE}/  ·  generated from the docs/ Markdown.\n`;
      for (const p of pages) full += `\n\n---\n\n# ${p.title}\nSource: ${p.mdUrl}\n\n${p.raw.trim()}\n`;
      writeFileSync(resolve(dir, 'llms-full.txt'), full);
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
  plugins: [react(), spaFallback(), aiDocsArtifacts()],
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
