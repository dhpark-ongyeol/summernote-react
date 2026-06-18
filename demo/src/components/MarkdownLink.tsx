import { Link } from 'react-router-dom';
import type { Components } from 'react-markdown';
import { slugToPath } from '../lib/docs';
import { useLocale } from './useLocale';

// Rewrite links inside the rendered docs:
//  - external (http/https/mailto) → open in a new tab
//  - in-page anchors (#hash)       → native anchor (ScrollToHash + smooth scroll handle it)
//  - sibling docs (./x.md#hash)    → client-side <Link> to /docs/<slug>#hash, in the current locale
export const MarkdownLink: Components['a'] = ({ href = '', children, node: _node, ...rest }) => {
  const locale = useLocale();

  if (/^(https?:)?\/\//i.test(href) || href.startsWith('mailto:')) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  if (href.startsWith('#')) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  const m = href.match(/^\.?\/?([\w-]+)\.md(#.+)?$/i);
  if (m) {
    const to = slugToPath(m[1], locale) + (m[2] ?? '');
    return (
      <Link to={to} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
};
