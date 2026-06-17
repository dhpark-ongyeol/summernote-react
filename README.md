# summernote-react

A **React + TypeScript** port of the [summernote](https://summernote.org) WYSIWYG editor — rebuilt
on summernote's own editing engine with **zero runtime dependencies**, **no jQuery**, and **no
`document.execCommand`**. Verified on Chromium + WebKit (Safari engine).

## Packages

| package | description |
|---|---|
| [`@eaeao4jerry/summernote-core`](packages/core) | headless, framework-agnostic editor engine (typed command registry + EditorState + IME state machine) |
| [`@eaeao4jerry/summernote-react`](packages/react) | React bindings — `<SummernoteEditor>` + `useSummernote()`, full chrome, 4 themes, 46 locales, plugins |

```bash
npm install @eaeao4jerry/summernote-react @eaeao4jerry/summernote-core
```

```tsx
import { SummernoteEditor } from '@eaeao4jerry/summernote-react';
import '@eaeao4jerry/summernote-react/styles.css';
import '@eaeao4jerry/summernote-react/icons.css';

<SummernoteEditor defaultValue="<p>Hello</p>" onChange={setHtml} />;
```

See [packages/react/README.md](packages/react/README.md) for the full API (controlled/uncontrolled,
themes, i18n, plugins, imperative handle, air mode).

## Development

Monorepo on Yarn workspaces. Tests run in real browsers via Vitest + Playwright (Chromium + WebKit).

```bash
yarn install
yarn verify          # jQuery-ban + zero-dep gates + typecheck (both packages)
yarn test            # full suite, both engines  (heavy — see docs/STATUS.md note)
yarn build:packages  # dual ESM + CJS + .d.ts
```

Design + status: [docs/PORTING-PLAN.md](docs/PORTING-PLAN.md), [docs/STATUS.md](docs/STATUS.md).
Agent/contributor conventions: [CLAUDE.md](CLAUDE.md).

## License

MIT — a port of [summernote](https://github.com/summernote/summernote) (MIT).
