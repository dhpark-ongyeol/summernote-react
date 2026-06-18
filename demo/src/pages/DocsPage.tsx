import { useRef } from 'react';
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
        {doc.fallbackFrom ? <div className="doc-fallback">{s.fallbackBanner}</div> : null}
        <Markdown source={doc.raw} />
        <Pager prev={prev} next={next} locale={locale} s={s} />
      </article>
      <Toc contentRef={contentRef} slug={slug} />
    </div>
  );
}
