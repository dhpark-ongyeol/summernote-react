import { useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getDoc, prevNext, slugToPath, type DocMeta, type Locale } from '../lib/docs';
import { Markdown } from '../components/Markdown';
import { Toc } from '../components/Toc';
import { useLocale } from '../components/useLocale';
import { t, type UiStrings } from '../components/ui-strings';

function Pager({ prev, next, locale, s }: { prev: DocMeta | null; next: DocMeta | null; locale: Locale; s: UiStrings }): JSX.Element {
  return (
    <div className="doc-pager">
      {prev ? (
        <Link className="doc-pager-link" to={slugToPath(prev.slug, locale)}>
          <span className="doc-pager-dir">← {s.previous}</span>
          <span className="doc-pager-title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="doc-pager-link next" to={slugToPath(next.slug, locale)}>
          <span className="doc-pager-dir">{s.next} →</span>
          <span className="doc-pager-title">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

// Per-page AI hand-off: copy the page's Markdown source, or open its raw .md mirror (emitted into
// dist/docs/<slug>.md at build time). The Copy button copies the CURRENT locale's source.
function DocActions({ raw, slug, s }: { raw: string; slug: string; s: UiStrings }): JSX.Element {
  const [copied, setCopied] = useState(false);
  const mdHref = `${import.meta.env.BASE_URL}docs/${slug}.md`;
  return (
    <div className="doc-actions">
      <button
        type="button"
        className="doc-action"
        onClick={() => {
          navigator.clipboard
            .writeText(raw)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => undefined);
        }}
      >
        {copied ? s.copied : s.copyPage}
      </button>
      <a className="doc-action" href={mdHref} target="_blank" rel="noreferrer">
        {s.viewMarkdown}
      </a>
    </div>
  );
}

// `slug` is fixed for the /docs index (README); the /docs/:slug route reads it from the URL.
export function DocsPage({ slug: fixedSlug }: { slug?: string }): JSX.Element {
  const params = useParams();
  const locale = useLocale();
  const slug = fixedSlug ?? params.slug ?? 'readme';
  const doc = getDoc(slug, locale);
  const contentRef = useRef<HTMLElement>(null);

  if (!doc) return <Navigate to={slugToPath('readme', locale)} replace />;

  const { prev, next } = prevNext(slug);
  const s = t(locale);

  return (
    <div className="doc-page">
      <article className="doc-prose" ref={contentRef}>
        <DocActions raw={doc.raw} slug={slug} s={s} />
        {doc.fallbackFrom ? <div className="doc-fallback">{s.fallbackBanner}</div> : null}
        <Markdown source={doc.raw} />
        <Pager prev={prev} next={next} locale={locale} s={s} />
      </article>
      <Toc contentRef={contentRef} slug={slug} />
    </div>
  );
}
