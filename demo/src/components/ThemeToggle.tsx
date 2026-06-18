import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('sn-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* localStorage may be unavailable (private mode) — fall through to light */
  }
  return 'light';
}

// Owns the global light/dark state for the whole site (one toggle in the top nav). The theme is
// the `data-theme` attribute on <html>, which every CSS variable in demo.css / docs.css keys off.
export function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('sn-theme', theme);
    } catch {
      /* ignore persistence failure */
    }
  }, [theme]);

  return (
    <button
      className="iconbtn sm"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      title="Toggle light / dark"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
