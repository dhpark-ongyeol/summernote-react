import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router v6 does not scroll on navigation. Scroll to the top on a route change, or to the
// #hash target if one is present (TOC links, deep links, in-doc anchors). rAF lets the freshly
// rendered markdown lay out before we measure. `scroll-margin-top` on headings clears the nav.
export function ScrollToHash(): null {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [hash, pathname]);

  return null;
}
