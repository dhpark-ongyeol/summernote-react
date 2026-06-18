import { useLocation } from 'react-router-dom';
import { DEFAULT_LOCALE, type Locale } from '../lib/docs';

// The active docs locale is derived from the URL: '/ko/...' is Korean, everything else is the
// default (English, unprefixed). react-router has already stripped the Pages basename, so the
// pathname here is base-relative (e.g. '/ko/docs/getting-started').
export function useLocale(): Locale {
  const { pathname } = useLocation();
  return /^\/ko(\/|$)/.test(pathname) ? 'ko' : DEFAULT_LOCALE;
}
