import { useEffect, useState } from 'react';

// Highlight whichever of the given element ids is currently in view. Reused by the docs TOC and
// the playground bookmark rail (same IntersectionObserver pattern the demo always used).
export function useScrollSpy(ids: string[]): string {
  const [active, setActive] = useState('');
  const key = ids.join('|');

  useEffect(() => {
    if (ids.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-15% 0px -75% 0px' },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // re-create the observer whenever the set of tracked ids changes (e.g. navigating docs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return active;
}
