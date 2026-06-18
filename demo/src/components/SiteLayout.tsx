import { Link, NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { ScrollToHash } from './ScrollToHash';

const navLinkClass = ({ isActive }: { isActive: boolean }): string => `site-link${isActive ? ' active' : ''}`;

// Shared shell for every route: a sticky top nav (brand + section links + theme toggle) and the
// routed page in the <Outlet/>. ScrollToHash lives here so it runs across all routes.
export function SiteLayout(): JSX.Element {
  return (
    <>
      <ScrollToHash />
      <header className="site-nav">
        <div className="site-nav-inner">
          <Link to="/" className="site-brand">
            <span className="brand-logo">✦</span>
            <span className="site-brand-name">summernote&#8209;react</span>
          </Link>
          <nav className="site-links">
            <NavLink to="/docs" className={navLinkClass}>
              Docs
            </NavLink>
            <NavLink to="/playground" className={navLinkClass}>
              Playground
            </NavLink>
            <a className="site-link" href="https://www.npmjs.com/package/@eaeao/summernote-react" target="_blank" rel="noreferrer">
              npm ↗
            </a>
            <a className="site-link" href="https://github.com/eaeao/summernote-react" target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  );
}
