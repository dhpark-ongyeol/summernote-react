# @eaeao/summernote-react

> A React + TypeScript port of summernote — its own engine, zero runtime dependencies, no jQuery, no `document.execCommand`.

`@eaeao/summernote-react` is a single npm package that brings the summernote WYSIWYG editor to React 18+ as a real component. The editing engine (range commands, history, tables, lists, structural state detection) and the React bindings ship together, so there are **no runtime dependencies** — `react`/`react-dom` (>=18) are peer dependencies, and the engine is bundled in. You use it the React way: render `<SummernoteEditor value={html} onChange={setHtml} />`, drive it imperatively through a `SummernoteEditorHandle` ref, extend it with `definePlugin(...)`, switch themes per-instance, and localize with bundled `locales`. Verified on Chromium + WebKit.

## Install

```bash
npm install @eaeao/summernote-react
```

```bash
yarn add @eaeao/summernote-react
```

`react` and `react-dom` (>=18) must already be present in your app — they are peer dependencies.

## Minimal example

```tsx
import { useState } from 'react';
import { SummernoteEditor } from '@eaeao/summernote-react';

// CSS is not auto-injected — import the base skin + icon webfont yourself.
import '@eaeao/summernote-react/styles.css';
import '@eaeao/summernote-react/icons.css';

export function Editor() {
  const [html, setHtml] = useState('<p>Hello <b>Summernote</b></p>');

  return <SummernoteEditor value={html} onChange={setHtml} />;
}
```

That's the whole contract: `value` is the HTML source of truth and `onChange(html: string)` reports edits. The engine owns the `contentEditable` subtree; React only renders the surrounding chrome (toolbar, dropdowns, dialogs, popovers, statusbar), so re-renders never disturb the caret.

### Uncontrolled + imperative ref

```tsx
import { useRef } from 'react';
import { SummernoteEditor, type SummernoteEditorHandle } from '@eaeao/summernote-react';

function Demo() {
  const ref = useRef<SummernoteEditorHandle>(null);

  return (
    <>
      <SummernoteEditor ref={ref} defaultValue="<p>Start typing…</p>" />
      <button onClick={() => console.log(ref.current?.getCode())}>Get HTML</button>
      <button onClick={() => ref.current?.command('bold')}>Bold</button>
      <button onClick={() => ref.current?.undo()}>Undo</button>
    </>
  );
}
```

The `SummernoteEditorHandle` exposes `getCode()`, `setCode(html)`, `command(name, ...args)`, `focus()`, `undo()`, `redo()`, and `core` (the raw `EditorCore` engine instance, or `null` until mounted).

## Documentation

| Page | What's inside |
|---|---|
| [Getting started](./getting-started.md) | Install, CSS imports, controlled vs. uncontrolled, the full `<SummernoteEditor>` prop table, the imperative ref API, and the `useSummernote` headless hook. |
| [Deep dive](./deep-dive.md) | Engine `options`, the `toolbar` / `popover` tuple format and built-in item names, every `command(name, ...)`, the published `EditorState`, callbacks, keyboard shortcuts, and the controlled caret-safe / codeview-XSS contracts. |
| [Examples](./examples.md) | Copy-pasteable recipes: air mode, multiple editors, click-to-edit, custom toolbars, themes, image upload, and localized editors. |
| [Plugins](./plugins.md) | The `definePlugin({ name, commands, buttons })` contract, `useChrome` / `useCommand` authoring helpers, and the bundled `helloPlugin` / `specialcharsPlugin` / `databasicPlugin`. |

## Key facts

- **No jQuery, no `execCommand`.** The engine computes editor state structurally from the caret's ancestor chain and edits via its own Range commands.
- **Zero runtime deps.** Only `react` / `react-dom` (>=18) peers; the engine is bundled (ESM + CJS + `.d.ts`).
- **Per-instance themes.** `theme="lite | bs3 | bs4 | bs5"` plus the matching CSS — multiple editors with different themes coexist on one page.
- **46 bundled locales.** `import { locales } from '@eaeao/summernote-react'` and pass `lang={locales['ko-KR']}`; missing keys fall back to en-US.
- **Pluggable image upload.** `onImageUpload={(file) => string | Promise<string>}` replaces the default base64 embed with your own hosted `src`.

## Links

- **Live demo:** <https://eaeao.github.io/summernote-react/>
- **npm:** <https://www.npmjs.com/package/@eaeao/summernote-react>

## License

MIT.
