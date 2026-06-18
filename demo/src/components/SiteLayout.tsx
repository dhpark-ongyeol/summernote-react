import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { ScrollToHash } from './ScrollToHash';
import { useLocale } from './useLocale';
import { LOCALES, localePath, type Locale } from '../lib/docs';
import { t } from './ui-strings';

const navLinkClass = ({ isActive }: { isActive: boolean }): string => `site-link${isActive ? ' active' : ''}`;

// Drop a leading '/ko' so we can re-prefix for the other locale while preserving the rest of the path.
const stripLocale = (pathname: string): string => pathname.replace(/^\/ko(?=\/|$)/, '') || '/';

// Shared shell for every route: a sticky top nav (brand + section links + language switcher + theme
// toggle) and the routed page in the <Outlet/>. ScrollToHash lives here so it runs across all routes.
export function SiteLayout(): JSX.Element {
  const locale = useLocale();
  const { pathname, hash } = useLocation();
  const s = t(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const base = stripLocale(pathname);
  const toLocale = (target: Locale): string =>
    (target === 'en' ? base : base === '/' ? '/ko' : `/ko${base}`) + hash;

  return (
    <>
      <ScrollToHash />
      <header className="site-nav">
        <div className="site-nav-inner">
          <Link to={localePath('/', locale)} className="site-brand">
            <span className="brand-logo">✦</span>
            <span className="site-brand-name">summernote&#8209;react</span>
          </Link>
          <nav className="site-links">
            <NavLink to={localePath('/docs', locale)} className={navLinkClass}>
              {s.docs}
            </NavLink>
            <NavLink to={localePath('/playground', locale)} className={navLinkClass}>
              {s.playground}
            </NavLink>
            <a className="site-link" href="https://www.npmjs.com/package/@eaeao/summernote-react" target="_blank" rel="noreferrer">
              npm ↗
            </a>
            <a className="site-link" href="https://github.com/eaeao/summernote-react" target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <span className="lang-switch">
              {LOCALES.map((l) => (
                <Link
                  key={l}
                  to={toLocale(l)}
                  className={`lang-opt${l === locale ? ' active' : ''}`}
                  aria-current={l === locale ? 'true' : undefined}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </span>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  );
}
