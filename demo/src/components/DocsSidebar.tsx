import { NavLink } from 'react-router-dom';
import { DOC_ORDER, slugToPath } from '../lib/docs';

export function DocsSidebar(): JSX.Element {
  return (
    <aside className="docs-sidebar">
      <div className="docs-sidebar-head">Documentation</div>
      <nav>
        {DOC_ORDER.map((d) => (
          <NavLink
            key={d.slug}
            to={slugToPath(d.slug)}
            end
            className={({ isActive }) => `docs-nav-link${isActive ? ' active' : ''}`}
          >
            {d.title}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
