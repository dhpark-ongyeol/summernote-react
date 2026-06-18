# Examples

Runnable TSX recipes for `@eaeao/summernote-react` — a React + TypeScript port of summernote with **zero runtime dependencies and no jQuery**. Each recipe mirrors a demo from [summernote.org/examples](https://summernote.org/examples/) but is fully adapted to our React component API.

> New here? Start with [Getting Started](./getting-started.md) for installation and the basics, then come back for these recipes. For the full prop / handle / command / option contracts, see the [API reference](./deep-dive.md).

## Contents

- [Setup (CSS imports)](#setup-css-imports)
- [1. Basic editor](#1-basic-editor)
- [2. Controlled value + live HTML](#2-controlled-value--live-html)
- [3. Uncontrolled + imperative ref](#3-uncontrolled--imperative-ref)
- [4. Air mode](#4-air-mode)
- [5. Themes](#5-themes)
- [6. Localization (i18n)](#6-localization-i18n)
- [7. Image upload (async `onImageUpload`)](#7-image-upload-async-onimageupload)
- [8. Custom toolbar](#8-custom-toolbar)
- [9. Click to edit](#9-click-to-edit)
- [10. Multiple editors](#10-multiple-editors)
- [11. Custom plugin](#11-custom-plugin)
- [Prop reference](#prop-reference)
- [Imperative handle reference](#imperative-handle-reference)

---

## Setup (CSS imports)

The CSS is **not** auto-injected — import it yourself. The base skin (`styles.css`) and the icon webfont (`icons.css`) are always required; the Bootstrap skins are optional and layered on top.

```tsx
import { SummernoteEditor } from '@eaeao/summernote-react';

import '@eaeao/summernote-react/styles.css'; // base / lite skin (required)
import '@eaeao/summernote-react/icons.css';  // shared icon webfont (required)
// optional, only if you use a Bootstrap theme:
// import '@eaeao/summernote-react/themes/bs3.css';
// import '@eaeao/summernote-react/themes/bs4.css';
// import '@eaeao/summernote-react/themes/bs5.css';
```

| Import specifier | Skin |
|---|---|
| `@eaeao/summernote-react/styles.css` | base / lite (required) |
| `@eaeao/summernote-react/icons.css` | icon webfont (required) |
| `@eaeao/summernote-react/themes/bs3.css` | Bootstrap 3 |
| `@eaeao/summernote-react/themes/bs4.css` | Bootstrap 4 |
| `@eaeao/summernote-react/themes/bs5.css` | Bootstrap 5 |

The CSS imports are omitted from the recipes below for brevity — add them once at your app entry.

---

## 1. Basic editor

The simplest case: an uncontrolled editor with an initial value. The engine owns the content after mount; you read it back through the ref (see [recipe 3](#3-uncontrolled--imperative-ref)) or listen with `onChange`.

```tsx
import { SummernoteEditor } from '@eaeao/summernote-react';

export function BasicEditor() {
  return (
    <SummernoteEditor
      defaultValue="<p>Hello <b>Summernote</b> for React!</p>"
      placeholder="Write something…"
    />
  );
}
```

- `defaultValue` seeds the content **once** at mount (uncontrolled).
- `placeholder` shows only while the editable is empty and codeview is closed.

---

## 2. Controlled value + live HTML

Pass `value` + `onChange` to make the editor controlled. The component is caret-safe: an external `value` is only re-applied to the engine when it genuinely differs from both the last emitted change and the current DOM, so toolbar/state re-renders never disturb the caret.

```tsx
import { useState } from 'react';
import { SummernoteEditor } from '@eaeao/summernote-react';

export function ControlledEditor() {
  const [html, setHtml] = useState('<p>Edit me — the HTML updates live below.</p>');

  return (
    <div>
      <SummernoteEditor value={html} onChange={setHtml} />

      <h3>Live HTML</h3>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 12 }}>
        {html}
      </pre>
    </div>
  );
}
```

- `onChange(html: string)` receives the new editable HTML after every committed change.
- `value` (controlled) always wins over `defaultValue`.

---

## 3. Uncontrolled + imperative ref

For form-style usage you can leave the editor uncontrolled and reach in through a `SummernoteEditorHandle` ref. The handle exposes `getCode` / `setCode` / `command` / `focus` / `undo` / `redo` and the raw `core` escape hatch.

```tsx
import { useRef } from 'react';
import { SummernoteEditor, type SummernoteEditorHandle } from '@eaeao/summernote-react';

export function RefEditor() {
  const ref = useRef<SummernoteEditorHandle>(null);

  return (
    <div>
      <SummernoteEditor ref={ref} defaultValue="<p>Start typing…</p>" />

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => console.log(ref.current?.getCode())}>Log HTML</button>
        <button onClick={() => ref.current?.setCode('<p>Replaced!</p>')}>Set HTML</button>
        <button onClick={() => ref.current?.command('bold')}>Bold</button>
        <button onClick={() => ref.current?.command('insertText', '★')}>Insert ★</button>
        <button onClick={() => ref.current?.focus()}>Focus</button>
        <button onClick={() => ref.current?.undo()}>Undo</button>
        <button onClick={() => ref.current?.redo()}>Redo</button>
      </div>
    </div>
  );
}
```

`command(name, ...args)` dispatches any engine or plugin command and returns whether it ran. Common commands: `bold`, `italic`, `underline`, `insertText`, `formatH1`–`formatH6`, `insertOrderedList`, `insertImage`, `createLink`. See the [command list](./deep-dive.md) for the full set.

---

## 4. Air mode

Air mode removes the fixed toolbar and statusbar; a floating toolbar appears at the selection instead. Enable it with the `airMode` prop. The floating toolbar's contents come from the engine's `popover.air` config.

```tsx
import { SummernoteEditor } from '@eaeao/summernote-react';

export function AirModeEditor() {
  return (
    <SummernoteEditor
      airMode
      defaultValue="<p>Select some text to reveal the floating toolbar.</p>"
    />
  );
}
```

- The root element gains the `note-airframe` class.
- The statusbar/resize bar is never rendered in air mode (regardless of `disableResize`).
- The default air popover offers: color, bold/underline/clear, ul/paragraph, table, link/picture, and fullscreen/codeview.

---

## 5. Themes

The `theme` prop selects one of four visual skins — `lite` (default), `bs3`, `bs4`, `bs5`. Themes are **per-instance**, so multiple editors with different themes can coexist on one page. Remember to import the matching CSS skin.

```tsx
import { SummernoteEditor } from '@eaeao/summernote-react';

import '@eaeao/summernote-react/styles.css';
import '@eaeao/summernote-react/icons.css';
import '@eaeao/summernote-react/themes/bs5.css'; // matches theme="bs5"

export function ThemedEditor() {
  return <SummernoteEditor theme="bs5" defaultValue="<p>Bootstrap 5 skin.</p>" />;
}
```

| `theme` | Required CSS (in addition to `styles.css` + `icons.css`) |
|---|---|
| `lite` (default) | — (base skin only) |
| `bs3` | `@eaeao/summernote-react/themes/bs3.css` |
| `bs4` | `@eaeao/summernote-react/themes/bs4.css` |
| `bs5` | `@eaeao/summernote-react/themes/bs5.css` |

The `theme` prop only sets the `note-theme-${theme}` root class; all themes share the same `.note-*` markup and the shared icon webfont. Unlike the legacy jQuery build (where the UI was a global and mixed themes per page were unsupported), this port resolves the theme per instance.

You can also type a theme name with the exported `ThemeName` type:

```tsx
import type { ThemeName } from '@eaeao/summernote-react';
const theme: ThemeName = 'bs4';
```

---

## 6. Localization (i18n)

Pass a locale to the `lang` prop. The 46 bundled locales are exported as the `locales` map; each one is a partial override deep-merged over en-US (missing keys fall back to English). The default (no `lang` prop) is en-US.

```tsx
import { SummernoteEditor, locales } from '@eaeao/summernote-react';

export function KoreanEditor() {
  return <SummernoteEditor lang={locales['ko-KR']} defaultValue="<p>안녕하세요.</p>" />;
}
```

You can also pass an ad-hoc partial — any missing keys fall back to English:

```tsx
<SummernoteEditor lang={{ link: { insert: '링크 삽입' } }} />
```

Each locale in `locales` is its own module, so the `locales` map is tree-shakeable — a bundler that supports it will drop the locales you never reference. If you only need one, destructure it (or alias it) rather than spreading the whole map:

```tsx
import { SummernoteEditor, locales } from '@eaeao/summernote-react';

const koKR = locales['ko-KR'];
<SummernoteEditor lang={koKR} />;
```

**Bundled locale codes (46):** `ar-AR, az-AZ, bg-BG, bn-BD, ca-ES, cs-CZ, da-DK, de-CH, de-DE, el-GR, es-ES, es-EU, fa-IR, fi-FI, fr-FR, gl-ES, he-IL, hr-HR, hu-HU, id-ID, it-IT, ja-JP, ko-KR, lt-LT, lt-LV, mn-MN, nb-NO, nl-NL, pl-PL, pt-BR, pt-PT, ro-RO, ru-RU, sk-SK, sl-SI, sr-RS, sr-RS-Latin, sv-SE, ta-IN, th-TH, tr-TR, uk-UA, uz-UZ, vi-VN, zh-CN, zh-TW`. (en-US is the always-present base.)

---

## 7. Image upload (async `onImageUpload`)

By default a picked image is embedded as a base64 data URL. Provide an `onImageUpload` handler to upload the file your own way (your server, S3, …) and return the `src` to insert. The signature is `(file: File) => string | Promise<string>`; while the promise is pending the editor shows a spinner in place, and on rejection the placeholder is removed without ever touching the saved value or the undo stack.

```tsx
import { SummernoteEditor } from '@eaeao/summernote-react';

async function uploadToServer(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body });
  if (!res.ok) throw new Error('upload failed'); // rejection → placeholder removed
  const { url } = await res.json();
  return url; // inserted as <img src={url}>
}

export function UploadEditor() {
  return (
    <SummernoteEditor
      onImageUpload={uploadToServer}
      defaultValue="<p>Insert a picture to trigger the uploader.</p>"
    />
  );
}
```

- Called **once per picked file** (the picture dialog's file input is single-file).
- Return a hosted URL **or** a base64 data URL — both are valid `src` values.
- The picture dialog also supports inserting by **URL** directly, independent of this hook.

---

## 8. Custom toolbar

The `toolbar` prop is an array of `[groupName, [itemName, …]]` tuples — the same tuple format as the legacy jQuery build, but passed as a prop instead of an options object. The group name is a CSS grouping label only; the item names must be recognized toolbar items.

```tsx
import { SummernoteEditor } from '@eaeao/summernote-react';

export function CustomToolbarEditor() {
  return (
    <SummernoteEditor
      toolbar={[
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'clear']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['insert', ['link', 'picture']],
        ['view', ['codeview', 'fullscreen']],
      ]}
      defaultValue="<p>A trimmed-down toolbar.</p>"
    />
  );
}
```

To hide the toolbar entirely, pass an empty array:

```tsx
<SummernoteEditor toolbar={[]} />
```

### Recognized toolbar item names

**Dropdowns:** `style`, `fontname`, `fontsize`, `fontsizeunit`, `height`, `color`, `paragraph`, `table`.

**Format buttons:** `bold`, `italic`, `underline`, `strikethrough`, `superscript`, `subscript`, `clear`, `ul`, `ol`, `hr`, `undo`, `redo`.

**Action buttons:** `link`, `picture`, `video`, `fullscreen`, `codeview`, `help`.

Any name not in those three sets is treated as a custom/plugin name (rendered through the plugin button slot — see [recipe 11](#11-custom-plugin)).

The default toolbar (when you omit the prop) is:

```tsx
[
  ['style',    ['style', 'fontsize', 'height']],
  ['font',     ['bold', 'underline', 'clear']],
  ['fontname', ['fontname']],
  ['color',    ['color']],
  ['para',     ['ul', 'ol', 'paragraph']],
  ['table',    ['table']],
  ['insert',   ['link', 'picture', 'video']],
  ['view',     ['fullscreen', 'codeview', 'help']],
]
```

---

## 9. Click to edit

The jQuery version toggles between a read-only display and a live editor by initializing on "edit" and tearing down + reading `code` on "save". In React this is just conditional mounting — unmounting the component is the teardown, and you read the content back through the ref before unmounting.

```tsx
import { useRef, useState } from 'react';
import { SummernoteEditor, type SummernoteEditorHandle } from '@eaeao/summernote-react';

export function ClickToEdit() {
  const [editing, setEditing] = useState(false);
  const [html, setHtml] = useState('<p>Click <b>Edit</b> to start.</p>');
  const ref = useRef<SummernoteEditorHandle>(null);

  const save = () => {
    const markup = ref.current?.getCode();
    if (markup != null) setHtml(markup); // read before unmount
    setEditing(false);
  };

  return editing ? (
    <div>
      <SummernoteEditor ref={ref} defaultValue={html} />
      <button onClick={save}>Save</button>
    </div>
  ) : (
    <div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <button onClick={() => setEditing(true)}>Edit</button>
    </div>
  );
}
```

- Mounting `<SummernoteEditor>` constructs the engine (the equivalent of initializing summernote); unmounting it runs `core.destroy()` (the equivalent of `'destroy'`).
- Read the content with `ref.current?.getCode()` (the `code` getter) **before** you unmount.

---

## 10. Multiple editors

Each `<SummernoteEditor>` is fully independent — just render as many as you like. Because the theme is per-instance, you can even mix themes on the same page.

```tsx
import { useState } from 'react';
import { SummernoteEditor } from '@eaeao/summernote-react';

export function MultipleEditors() {
  const [a, setA] = useState('<p>Editor one (lite).</p>');
  const [b, setB] = useState('<p>Editor two (bs5).</p>');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SummernoteEditor value={a} onChange={setA} theme="lite" />
      <SummernoteEditor value={b} onChange={setB} theme="bs5" />
    </div>
  );
}
```

Each editor keeps its own state, undo history, theme, and locale. There is no shared global to clobber.

---

## 11. Custom plugin

Plugins are the per-instance replacement for the legacy `$.extend($.summernote.plugins, …)` global. Define one with `definePlugin({ name, commands?, buttons? })`: `commands` are registered onto the live `EditorCore` via `core.registerCommand`, and `buttons` are React components rendered wherever their key appears in the `toolbar` config.

```tsx
import {
  definePlugin,
  useChrome,
  useCommand,
  SummernoteEditor,
} from '@eaeao/summernote-react';

function StarButton(): JSX.Element {
  const { options } = useChrome();
  const cmd = useCommand();
  return (
    <button
      type="button"
      className="note-btn"
      title="Insert star"
      // keep the editable selection — the toolbar mousedown must not blur it
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => cmd('insertStar')}
    >
      <span className={options.icons.question} aria-hidden="true" />
    </button>
  );
}

const starPlugin = definePlugin({
  name: 'star',
  commands: {
    insertStar: (core): boolean => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      const range = sel.getRangeAt(0);
      if (!core.ownsRange(range)) return false; // guard: must be inside this editor
      range.deleteContents();
      range.insertNode(document.createTextNode('★'));
      range.collapse(false);
      return true; // changed → one undo step + onChange
    },
  },
  buttons: { star: StarButton },
});

export function PluginEditor() {
  return (
    <SummernoteEditor
      plugins={[starPlugin]}
      toolbar={[
        ['font', ['bold', 'italic']],
        ['insert', ['star']], // reference the button by its key
      ]}
    />
  );
}
```

- A command is `(core, ...args) => boolean`. Return `true` if it changed the content (the engine then commits one undo step and fires `onChange`); return `false` to no-op.
- Guard commands with `core.ownsRange(range)` so they only act inside their own editable.
- Button components may use `useChrome()` (for `core`, `state`, `lang`, `options`, `ui`, `codeviewActive`, `onImageUpload`, …) and `useCommand()` (a selection-preserving dispatcher). Both throw if rendered outside `<SummernoteEditor>`.

### Ship-in-the-box reference plugins

Three example plugins are exported from the package root:

| Plugin | What it shows |
|---|---|
| `helloPlugin` | Minimal contract — one command + one button (`toolbar={[['insert', ['hello']]]}`). |
| `specialcharsPlugin` | A dialog-style button with `core.saveRange()` / `core.restoreRange()` around a modal. |
| `databasicPlugin` | Composing the plugin API with a direct table-node insert. |

```tsx
import { SummernoteEditor, helloPlugin } from '@eaeao/summernote-react';

<SummernoteEditor plugins={[helloPlugin]} toolbar={[['insert', ['hello']]]} />;
```

---

## Prop reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | — | Controlled HTML. When set, the editor is controlled. |
| `defaultValue` | `string` | — | Uncontrolled initial HTML, applied once at mount. |
| `onChange` | `(html: string) => void` | — | Fires after content changes; receives the new editable HTML. |
| `toolbar` | `readonly [string, readonly string[]][]` | summernote default | `[group, names]` toolbar tuples. `[]` hides it. |
| `placeholder` | `string` | — | Shown over an empty editable (not in codeview). |
| `theme` | `'lite' \| 'bs3' \| 'bs4' \| 'bs5'` | `'lite'` | Visual skin, per-instance. |
| `lang` | `LangPartial` | en-US | Locale, deep-merged over en-US. |
| `airMode` | `boolean` | `false` | No fixed toolbar/statusbar; floating selection toolbar. |
| `disableResize` | `boolean` | `false` | Disables the resize statusbar. |
| `plugins` | `readonly SummernotePlugin[]` | — | Per-instance plugins (commands + buttons). |
| `onImageUpload` | `(file: File) => string \| Promise<string>` | — | Image-upload hook; default is base64 embed. |
| `options` | `Omit<EditorCoreOptions, 'value' \| 'onChange'>` | — | Pass-through engine options (`historyLimit`, `shortcuts`, `keyMap`, `isMac`, `onShortcut`). |
| `className` | `string` | — | Extra class on the root element. |

> The `options` prop forwards engine options, but the component always manages `value`, `onChange`, and `onShortcut` itself. See [`EditorCoreOptions`](./deep-dive.md) for the forwarded fields.

---

## Imperative handle reference

`SummernoteEditorHandle`, obtained from a `ref`:

| Member | Signature | Behavior |
|---|---|---|
| `focus` | `() => void` | Focuses the editable. |
| `getCode` | `() => string` | Returns the current editable HTML. |
| `setCode` | `(html: string) => void` | Replaces the content. |
| `command` | `(name: string, ...args: unknown[]) => boolean` | Dispatches any engine/plugin command; returns whether it ran. |
| `undo` | `() => void` | Undo. |
| `redo` | `() => void` | Redo. |
| `core` | `EditorCore \| null` | The raw engine instance — escape hatch to the full headless API. |

For the headless (no-chrome) use case, see the `useSummernote` hook in the [API reference](./deep-dive.md).

---

## See also

- [Getting Started](./getting-started.md) — install + first editor
- [API reference](./deep-dive.md) — props, handle, commands, options, `EditorState`
- [summernote.org/examples](https://summernote.org/examples/) — the original jQuery demos these recipes mirror
