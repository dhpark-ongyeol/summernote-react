// Single source of truth for the docs page list — ordering (sidebar + prev/next), titles, Diátaxis
// section grouping, and a one-line description used to generate /llms.txt at build time.
// Consumed by both src/lib/docs.ts (the SPA loader) and vite.config.ts (the build-time AI artifacts:
// per-page .md mirrors, llms.txt, llms-full.txt), so the site and the generated files never drift.
export interface DocEntry {
  slug: string;
  /** the English (default) filename under /docs, e.g. 'README.md'. */
  file: string;
  title: string;
  /** Diátaxis section for sidebar grouping; ungrouped (Overview) when omitted. */
  section?: string;
  /** one-line summary for the llms.txt index. */
  description: string;
}

export const DOCS: DocEntry[] = [
  { slug: 'readme', file: 'README.md', title: 'Overview', description: 'Overview, install, quick start, and a feature summary.' },
  { slug: 'getting-started', file: 'getting-started.md', title: 'Getting started', section: 'Tutorial', description: 'Install and build your first editor, step by step.' },
  { slug: 'examples', file: 'examples.md', title: 'Examples', section: 'How-to', description: 'Copy-paste recipes: air mode, themes, i18n, image upload, custom toolbars, plugins.' },
  { slug: 'reference-component', file: 'reference-component.md', title: 'Component & state', section: 'Reference', description: 'The <SummernoteEditor> props, the imperative ref handle, and EditorState.' },
  { slug: 'reference-commands', file: 'reference-commands.md', title: 'Commands', section: 'Reference', description: 'The full command(name, ...args) catalog — the 50 built-in commands.' },
  { slug: 'reference-options', file: 'reference-options.md', title: 'Options & toolbar', section: 'Reference', description: 'Engine options, toolbar/popover item names, fonts, colors, keymap, themes, locales.' },
  { slug: 'reference-api', file: 'reference-api.md', title: 'Headless & plugin API', section: 'Reference', description: 'Headless useSummernote / createEditorCore and the definePlugin plugin API.' },
  { slug: 'concepts', file: 'concepts.md', title: 'How it works', section: 'Explanation', description: 'Architecture, the caret-safe controlled contract, and the security model.' },
  { slug: 'migrating', file: 'migrating.md', title: 'Migrating from jQuery', section: 'Explanation', description: 'Mapping the legacy jQuery summernote API to this React component.' },
  { slug: 'use-with-ai', file: 'use-with-ai.md', title: 'Use with AI', section: 'AI', description: 'Use the library with AI coding tools: the shipped AGENTS.md / SKILL.md, Context7, agent rules, and llms.txt.' },
];
