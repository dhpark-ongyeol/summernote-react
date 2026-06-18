import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import { MarkdownLink } from './MarkdownLink';

// rehype-slug must run before autolink (anchors need the heading ids), highlight runs last.
// The docs only use tsx/ts/bash fences. `languages` REPLACES rehype-highlight's default `common`
// set, so we register only these grammars under their CANONICAL names — highlight.js auto-applies
// each grammar's native aliases, so `typescript` covers ts + tsx and `javascript` covers js + jsx.
// (Rollup tree-shakes the unused `common` grammars out of the docs chunk on its own — verified.)
const rehypePlugins = [
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: 'wrap' }],
  [rehypeHighlight, { detect: false, languages: { typescript, javascript, bash } }],
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
