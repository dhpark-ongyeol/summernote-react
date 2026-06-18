import { useEffect, useState, type RefObject } from 'react';
import { useScrollSpy } from './useScrollSpy';
import { useLocale } from './useLocale';
import { t } from './ui-strings';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Build the "On this page" rail from the RENDERED headings, reading their real ids (set by
// rehype-slug via github-slugger) — so the TOC, the heading anchors, and the scroll-spy all use
// the exact same slugs without ever re-slugging a string. Re-reads when the doc (slug) changes.
export function Toc({ contentRef, slug }: { contentRef: RefObject<HTMLElement>; slug: string }): JSX.Element {
  const [items, setItems] = useState<TocItem[]>([]);
  const s = t(useLocale());

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const headings = Array.from(root.querySelectorAll('h2, h3')) as HTMLHeadingElement[];
    setItems(
      headings
        .filter((h) => h.id)
        .map((h) => ({ id: h.id, text: h.textContent ?? '', level: h.tagName === 'H3' ? 3 : 2 }))
        // drop a doc's own hand-written "Table of contents" / "Contents" heading — redundant here
        .filter((i) => !/^(table of\s+)?contents$/i.test(i.text.trim())),
    );
  }, [slug, contentRef]);

  const activeId = useScrollSpy(items.map((i) => i.id));

  if (items.length === 0) return <aside className="doc-toc" aria-hidden />;

  return (
    <aside className="doc-toc">
      <div className="doc-toc-head">{s.onThisPage}</div>
      <nav>
        {items.map((i) => (
          <a key={i.id} href={`#${i.id}`} className={`doc-toc-link lvl${i.level}${i.id === activeId ? ' active' : ''}`}>
            {i.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
