# @eaeao/summernote-react

## 1.4.0

### Minor Changes

- 46bb227: Add dark mode. The new `colorScheme` prop (`'light' | 'dark' | 'auto'`) themes the whole editor — toolbar, dropdowns, dialogs, popovers, and the code view — from CSS variables on the editor root, and `'auto'` follows the OS `prefers-color-scheme`. The lite skin's colors are now CSS variables (`--note-bg`, `--note-text`, `--note-bg-toolbar`, …), so you can also retheme the editor yourself by overriding them. Backward compatible — the default `'light'` is unchanged, and all four skins (lite + bs3/bs4/bs5) support dark mode.

## 1.3.0

### Minor Changes

- 67c0a4e: Harden the published type contract and gate package/type correctness.

  - Add an exported `CommandName` union (the 50 built-in commands). `command()` on `EditorCore`, the `<SummernoteEditor>` ref handle, and `useCommand()` now accept `CommandName | (string & {})`, so built-in command names autocomplete while plugin command names still type-check.
  - Fix the package `exports` map: per-condition type declarations (`import` → `index.d.ts`, `require` → `index.d.cts`) plus a `"./package.json"` entry, so CommonJS consumers resolve the correct declarations (verified by are-the-types-wrong on node10/node16/bundler).
  - Scrub internal/dev-phase notes that leaked into `dist/index.d.ts` so the declarations describe only the shipped public API, and fix the `onImageUpload` and `locales` doc examples to match their types.
  - Keep the exported `VERSION` / `CORE_VERSION` constants in sync with `package.json`.

## 1.2.0

### Minor Changes

- 83f0f9f: The default toolbar's **Style** group now includes the **font size** and **line height** dropdowns next to the style / format-block picker, rendered as a connected segmented button group (like the bold/underline group). The `fontSize` / `lineHeight` commands and the `fontsize` / `height` toolbar items already existed — this wires them into the default toolbar, tags their toggles `note-btn-size` / `note-btn-height`, and adds CSS so several controls inside one toolbar group connect with overlapping borders and rounded outer corners.

### Patch Changes

- daea37c: Font controls: the default font-family list now ships a Korean-office set (굴림 / 굴림체 / 궁서 / 궁서체 / 돋움 / 돋움체 / 맑은 고딕 / 바탕 / 바탕체 + Arial / Inter / Tahoma / Times New Roman / Verdana / Noto Sans KR), and the font-family / font-size toggles keep the last-seen value when the caret leaves the editor (the font-size toggle defaults to 13).

## 1.1.0

### Minor Changes

- 0dfaefd: Add an `onImageUpload` hook for custom image uploads. By default a picked image is embedded as a base64 data URL; pass `onImageUpload={async (file) => uploadAndReturnUrl(file)}` to upload the file your own way (your server, S3, …) and return — or resolve to — the image `src` to insert (a hosted URL, or a base64 string). A loading spinner shows in place while the promise resolves; on rejection the placeholder is removed. The picture dialog's file input is now single-file. Exposed as the `ImageUploadHandler` type and `core.insertImageUpload(file, handler)`.

## 1.0.4

### Patch Changes

- Survive browser extensions that grab the editable selection. Dictionary / translator extensions (e.g. NDIC 누렁이 영어사전, Google Translate's selection popup) collapse the selection the instant a toolbar button is pressed, which silently no-op'd commands like **bold** and **color**. The engine now caches the last real in-editor selection and restores it before running a command — while still honouring a caret you place yourself (bold-then-type). The editable also opts out of Grammarly (`data-gramm`) and page translation (`translate="no"` / `notranslate`).

## 1.0.3

### Patch Changes

- Add npm package metadata (author, homepage, repository, bugs, keywords)

## 1.0.2

### Patch Changes

- Table & popover fixes:

  - **Tab / Shift+Tab** now navigate between table cells (and insert an indent run outside tables) instead of moving focus out of the editor — the `TAB`/`SHIFT+TAB` keymap entries were dead because plain-key shortcuts were never matched.
  - **Table cells** now show visible guide-line borders while editing (the inserted `table table-bordered` had no styling in the lite base CSS).
  - **Contextual popovers** (table / link / image) now float just above their target instead of rendering over it — the table popover no longer covers the caret cell.
