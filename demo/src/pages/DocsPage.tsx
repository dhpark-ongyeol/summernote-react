import { useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getDoc, prevNext, slugToPath, type DocMeta } from '../lib/docs';
import { Markdown } from '../components/Markdown';
import { Toc } from '../components/Toc';

function Pager({ prev, next }: { prev: DocMeta | null; next: DocMeta | null }): JSX.Element {
  return (
    <div className="doc-pager">
      {prev ? (
        <Link className="doc-pager-link" to={slugToPath(prev.slug)}>
          <span className="doc-pager-dir">← Previous</span>
          <span className="doc-pager-title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="doc-pager-link next" to={slugToPath(next.slug)}>
          <span className="doc-pager-dir">Next →</span>
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
  const slug = fixedSlug ?? params.slug ?? 'readme';
  const doc = getDoc(slug);
  const contentRef = useRef<HTMLElement>(null);

  if (!doc || doc.raw === undefined) return <Navigate to="/docs" replace />;

  const { prev, next } = prevNext(slug);

  return (
    <div className="doc-page">
      <article className="doc-prose" ref={contentRef}>
        <Markdown source={doc.raw} />
        <Pager prev={prev} next={next} />
      </article>
      <Toc contentRef={contentRef} slug={slug} />
    </div>
  );
}
