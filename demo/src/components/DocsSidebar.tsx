import { NavLink } from 'react-router-dom';
import { DOC_ORDER, slugToPath, type DocMeta } from '../lib/docs';
import { useLocale } from './useLocale';
import { t } from './ui-strings';

// Group DOC_ORDER by its `section`, preserving order. Entries without a section (Overview) render
// ungrouped at the top; the rest fall under their Diátaxis heading (Tutorial / How-to / Reference / …).
function grouped(): { section: string | null; items: DocMeta[] }[] {
  const out: { section: string | null; items: DocMeta[] }[] = [];
  for (const d of DOC_ORDER) {
    const key = d.section ?? null;
    const last = out[out.length - 1];
    if (last && last.section === key) last.items.push(d);
    else out.push({ section: key, items: [d] });
  }
  return out;
}

export function DocsSidebar(): JSX.Element {
  const locale = useLocale();
  const s = t(locale);
  return (
    <aside className="docs-sidebar">
      <div className="docs-sidebar-head">{s.documentation}</div>
      <nav>
        {grouped().map((g, i) => (
          <div key={g.section ?? `top-${i}`} className="docs-nav-group">
            {g.section ? <div className="docs-nav-section">{s.sections[g.section] ?? g.section}</div> : null}
            {g.items.map((d) => (
              <NavLink
                key={d.slug}
                to={slugToPath(d.slug, locale)}
                end
                className={({ isActive }) => `docs-nav-link${isActive ? ' active' : ''}`}
              >
                {d.title}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
