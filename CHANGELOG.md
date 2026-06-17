# @eaeao/summernote-react

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
