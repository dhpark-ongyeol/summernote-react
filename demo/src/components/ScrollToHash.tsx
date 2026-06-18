import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router v6 does not scroll on navigation. Scroll to the top on a route change, or to the
// #hash target if one is present (TOC links, deep links, in-doc anchors). The docs routes are
// lazy-loaded, so on a COLD deep link the target heading may not exist for a few frames while the
// chunk streams in — poll getElementById across a short window instead of a single rAF.
// `scroll-margin-top` on headings clears the sticky nav.
export function ScrollToHash(): null {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let raf = 0;
    let tries = 0;
    const tryScroll = (): void => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (tries++ < 40) raf = requestAnimationFrame(tryScroll);
    };
    raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [hash, pathname]);

  return null;
}
