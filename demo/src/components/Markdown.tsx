import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import ts from 'highlight.js/lib/languages/typescript';
import js from 'highlight.js/lib/languages/javascript';
import { MarkdownLink } from './MarkdownLink';

// rehype-slug must run before autolink (anchors need the heading ids), highlight runs last.
// tsx/jsx aren't default hljs language names — register them onto the typescript/javascript
// grammars so the React code blocks (the bulk of the docs) actually get highlighted.
const rehypePlugins = [
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: 'wrap' }],
  [rehypeHighlight, { detect: false, ignoreMissing: true, languages: { tsx: ts, jsx: js } }],
] as const;

export function Markdown({ source }: { source: string }): JSX.Element {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rehypePlugins={rehypePlugins as any}
      components={{ a: MarkdownLink }}
    >
      {source}
    </ReactMarkdown>
  );
}
