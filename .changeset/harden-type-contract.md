---
"@eaeao/summernote-react": minor
---

Harden the published type contract and gate package/type correctness.

- Add an exported `CommandName` union (the 50 built-in commands). `command()` on `EditorCore`, the `<SummernoteEditor>` ref handle, and `useCommand()` now accept `CommandName | (string & {})`, so built-in command names autocomplete while plugin command names still type-check.
- Fix the package `exports` map: per-condition type declarations (`import` → `index.d.ts`, `require` → `index.d.cts`) plus a `"./package.json"` entry, so CommonJS consumers resolve the correct declarations (verified by are-the-types-wrong on node10/node16/bundler).
- Scrub internal/dev-phase notes that leaked into `dist/index.d.ts` so the declarations describe only the shipped public API, and fix the `onImageUpload` and `locales` doc examples to match their types.
- Keep the exported `VERSION` / `CORE_VERSION` constants in sync with `package.json`.
