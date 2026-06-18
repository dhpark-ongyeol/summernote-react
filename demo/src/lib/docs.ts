import { DOCS, type DocEntry } from '../../docs-manifest';

// Docs are the single source of truth: read the same Markdown files committed under /docs.
// English files are unsuffixed (`getting-started.md`); translations carry a locale suffix
// (`getting-started.ko.md`). Vite inlines them all as raw strings at build time. DOC_ORDER is the
// explicit allowlist (drives sidebar order + prev/next); internal docs are ignored.
const rawModules = import.meta.glob('../../../docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const LOCALES = ['en', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_LABELS: Record<Locale, string> = { en: 'English', ko: '한국어' };

// The page list (order, titles, sections, llms.txt descriptions) lives in a framework-agnostic
// manifest shared with the build (vite.config.ts), so the SPA and the generated AI artifacts agree.
export type DocMeta = DocEntry;

export const DOC_ORDER: DocMeta[] = DOCS;

// Index raw content by [locale][base-filename]. `README.ko.md` → locale 'ko', base 'README'.
const rawByLocale: Record<string, Record<string, string>> = {};
for (const [path, raw] of Object.entries(rawModules)) {
  const filename = path.split('/').pop();
  if (!filename) continue;
  const noExt = filename.replace(/\.md$/, '');
  const parts = noExt.split('.');
  const maybeLocale = parts[parts.length - 1];
  const isLocale = parts.length > 1 && (LOCALES as readonly string[]).includes(maybeLocale);
  const locale = isLocale ? maybeLocale : DEFAULT_LOCALE;
  const base = isLocale ? parts.slice(0, -1).join('.') : noExt;
  (rawByLocale[locale] ??= {})[base] = raw;
}

export function isLocale(value: string | undefined): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value);
}

export interface LoadedDoc extends DocMeta {
  raw: string;
  /** Set to the requested locale when the requested translation is missing and we fell back to English. */
  fallbackFrom?: Locale;
}

export function getDoc(slug: string, locale: Locale = DEFAULT_LOCALE): LoadedDoc | null {
  const meta = DOC_ORDER.find((d) => d.slug === slug);
  if (!meta) return null;
  const base = meta.file.replace(/\.md$/, '');
  const localized = rawByLocale[locale]?.[base];
  if (localized !== undefined) return { ...meta, raw: localized };
  const english = rawByLocale[DEFAULT_LOCALE]?.[base];
  if (english === undefined) return null;
  return { ...meta, raw: english, fallbackFrom: locale === DEFAULT_LOCALE ? undefined : locale };
}

export function prevNext(slug: string): { prev: DocMeta | null; next: DocMeta | null } {
  const i = DOC_ORDER.findIndex((d) => d.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return { prev: DOC_ORDER[i - 1] ?? null, next: DOC_ORDER[i + 1] ?? null };
}

const prefix = (locale: Locale): string => (locale === DEFAULT_LOCALE ? '' : `/${locale}`);

// Path to a route, locale-prefixed (English unprefixed). README is the docs landing (/docs).
export function slugToPath(slug: string, locale: Locale = DEFAULT_LOCALE): string {
  const s = slug.toLowerCase();
  return s === 'readme' ? `${prefix(locale)}/docs` : `${prefix(locale)}/docs/${s}`;
}

// Locale-prefix any top-level site path ('/', '/docs', '/playground').
export function localePath(path: string, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}
