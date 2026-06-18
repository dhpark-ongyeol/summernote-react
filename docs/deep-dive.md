# Deep dive

Customize `@eaeao/summernote-react`'s toolbar, options, commands, plugins, themes, and i18n to build your very own editor — all through React props and a typed imperative ref, with no jQuery.

This is the comprehensive reference. For installation and a first editor, see [Getting started](./getting-started.md).

---

## Table of contents

- [Architecture](#architecture)
- [Props reference](#props-reference)
- [Imperative ref — `SummernoteEditorHandle`](#imperative-ref--summernoteeditorhandle)
- [Commands — `command(name, ...args)`](#commands--commandname-args)
- [Options reference (`options` prop)](#options-reference-options-prop)
  - [Toolbar configuration](#toolbar-configuration)
  - [Toolbar / popover item names](#toolbar--popover-item-names)
  - [Popover configuration](#popover-configuration)
  - [Style tags](#style-tags)
  - [Font names](#font-names)
  - [Font sizes & units](#font-sizes--units)
  - [Line heights](#line-heights)
  - [Colors](#colors)
  - [Tables](#tables)
  - [Keyboard shortcuts (`keyMap`)](#keyboard-shortcuts-keymap)
  - [History](#history)
- [`EditorState`](#editorstate)
- [Callbacks — `onChange`, `onImageUpload`](#callbacks--onchange-onimageupload)
- [Controlled vs. uncontrolled & the caret-safe contract](#controlled-vs-uncontrolled--the-caret-safe-contract)
- [Headless: `useSummernote` & `createEditorCore`](#headless-usesummernote--createeditorcore)
- [Plugins — `definePlugin`](#plugins--defineplugin)
- [Themes](#themes)
- [Internationalization (i18n)](#internationalization-i18n)
- [Security](#security)
- [Extension-safe selection](#extension-safe-selection)

---

## Architecture

`@eaeao/summernote-react` is a from-scratch React + TypeScript port of summernote. The legacy jQuery editor and its runtime are gone. In their place:

- **A headless engine** (`EditorCore`, exported as the `@engine` module set) that owns the `contentEditable` subtree imperatively. It performs all editing through structural Range commands and computes toolbar state by walking the caret's ancestor chain.
- **React bindings** that render *only the chrome* (toolbar, dropdowns, dialogs, statusbar, popovers) plus a single uncontrolled `contentEditable` leaf. React never reconciles content into the editable, so chrome re-renders cannot disturb the caret.

Key properties:

| Property | Value |
|---|---|
| Package | `@eaeao/summernote-react` |
| React | 18+ (peer dependency, with `react-dom`) |
| Runtime dependencies | **zero** |
| jQuery | **none** |
| Module format | ESM + CJS + `.d.ts` (single dual build) |
| License | MIT |
| Verified on | Chromium + WebKit |

```bash
npm install @eaeao/summernote-react
```

```tsx
import { SummernoteEditor } from '@eaeao/summernote-react';
import '@eaeao/summernote-react/styles.css';
import '@eaeao/summernote-react/icons.css';

function App() {
  const [html, setHtml] = React.useState('<p>Hello <b>world</b></p>');
  return <SummernoteEditor value={html} onChange={setHtml} />;
}
```

> There is no `$('.x').summernote(...)`. The editor is a React component, options are props, and the imperative API is a typed `ref`.

### What React renders vs. what the engine owns

React renders the chrome plus one leaf: an uncontrolled `<div class="note-editable notranslate" contentEditable>` that the engine owns. That div carries `translate="no"`, `data-gramm="false"`, `data-gramm_editor="false"`, and `data-enable-grammarly="false"` to opt out of Google Translate / Grammarly hijacking the selection. When codeview is open the editable is `display:none` and a `<Codeview>` textarea renders in its place.

The root element class is composed from: `note-editor`, `note-frame`, `note-theme-${theme ?? 'lite'}`, `note-airframe` (air mode), `fullscreen` (when fullscreen is toggled), plus your `className`.

---

## Props reference

`<SummernoteEditor>` is a `forwardRef<SummernoteEditorHandle, SummernoteEditorProps>`. Every prop:

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | — | **Controlled** HTML value. When provided, the editor is controlled (see [caret-safe contract](#controlled-vs-uncontrolled--the-caret-safe-contract)). |
| `defaultValue` | `string` | — | **Uncontrolled** initial HTML, applied once at mount. |
| `onChange` | `(html: string) => void` | — | Fires after every committed content change. Receives the new editable HTML. |
| `options` | `Omit<EditorCoreOptions, 'value' \| 'onChange'>` | — | Pass-through engine options: `historyLimit`, `shortcuts`, `keyMap`, `isMac`, `onShortcut`. See [Options reference](#options-reference-options-prop). |
| `toolbar` | `readonly ToolbarGroup[]` where `ToolbarGroup = readonly [string, readonly string[]]` | summernote default toolbar | `[group, [itemName...]]` toolbar config tuples. See [Toolbar configuration](#toolbar-configuration). |
| `placeholder` | `string` | — | Placeholder shown over an empty editable (only when not in codeview and the HTML is empty). |
| `disableResize` | `boolean` | `false` | Disables the resize statusbar. The statusbar renders only when `!airMode && !disableResize && !codeview`. |
| `airMode` | `boolean` | `false` | Air mode: no fixed toolbar/statusbar; a floating toolbar appears at the selection. Adds the `note-airframe` root class. |
| `plugins` | `readonly SummernotePlugin[]` | — | Per-instance plugins. See [Plugins](#plugins--defineplugin). |
| `theme` | `'lite' \| 'bs3' \| 'bs4' \| 'bs5'` | `'lite'` | Visual theme, **per-instance** — multiple editors with different themes coexist. Drives the `note-theme-${theme}` root class. |
| `lang` | `LangPartial` (= `Record<string, Record<string, string> \| undefined>`) | en-US | Locale, deep-merged over en-US via `resolveLang(lang)`. Use `lang={locales['ko-KR']}`. |
| `onImageUpload` | `ImageUploadHandler` (= `(file: File) => string \| Promise<string>`) | — | Image-upload hook. Called per picked file instead of base64-embedding; return/resolve the `src`. See [Callbacks](#callbacks--onchange-onimageupload). |
| `className` | `string` | — | Extra class appended to the root `note-editor note-frame …` element. |

---

## Imperative ref — `SummernoteEditorHandle`

Attach a `ref` to reach the engine imperatively. The handle is recomputed when the underlying core changes.

```ts
export interface SummernoteEditorHandle {
  focus(): void;
  getCode(): string;
  setCode(html: string): void;
  command(name: string, ...args: unknown[]): boolean;
  undo(): void;
  redo(): void;
  readonly core: EditorCore | null;
}
```

| Member | Signature | Behavior |
|---|---|---|
| `focus` | `() => void` | Focuses the editable. |
| `getCode` | `() => string` | Current editable HTML (`''` before mount). |
| `setCode` | `(html: string) => void` | Replaces content. |
| `command` | `(name, ...args) => boolean` | Dispatches any engine/plugin command (e.g. `'bold'`, `'insertText'`). Returns whether it ran. |
| `undo` | `() => void` | Undo (`command('undo')`). |
| `redo` | `() => void` | Redo (`command('redo')`). |
| `core` | `EditorCore \| null` | The raw engine instance (null until mounted) — escape hatch to the [full headless API](#editorcore-public-methods). |

```tsx
import { useRef } from 'react';
import { SummernoteEditor, type SummernoteEditorHandle } from '@eaeao/summernote-react';

function Editor() {
  const ref = useRef<SummernoteEditorHandle>(null);
  return (
    <>
      <SummernoteEditor ref={ref} defaultValue="<p>Start…</p>" onChange={(h) => console.log(h)} />
      <button onClick={() => ref.current?.command('bold')}>Bold</button>
      <button onClick={() => ref.current?.command('insertText', 'Hello, world')}>Insert text</button>
      <button onClick={() => ref.current?.undo()}>Undo</button>
      <button onClick={() => console.log(ref.current?.getCode())}>Log HTML</button>
    </>
  );
}
```

> In legacy summernote you would call `$('#x').summernote('insertText', 'hi')`. Here the equivalent is `ref.current?.command('insertText', 'hi')` — there is no string-dispatch `'module.method'` syntax; every command is a flat name passed to `command()`.

---

## Commands — `command(name, ...args)`

`core.command(name, ...args): boolean` (and the handle's `command(...)`) dispatches into the engine's command registry. Custom commands registered by plugins via `registerCommand` take precedence over built-ins of the same name. It returns `true` if the command reported a change.

Every command **except** the selectionless ones (`undo`, `redo`, `resizeImage`, `floatImage`, `removeMedia`) requires a live or recoverable in-editor selection, or it returns `false` without acting.

### Inline format

| Command | Args | Effect |
|---|---|---|
| `bold` | — | Toggle bold (canonical `<b>`). |
| `italic` | — | Toggle italic (canonical `<i>`). |
| `underline` | — | Toggle `<u>`. |
| `strikethrough` | — | Toggle strikethrough (canonical `<s>`). |
| `superscript` | — | Toggle `<sup>`. |
| `subscript` | — | Toggle `<sub>`. |
| `removeFormat` | — | Unwrap all inline format tags at the caret (`B,STRONG,I,EM,U,S,STRIKE,SUP,SUB,SPAN`). |
| `fontName` | `(name: string)` | Apply `font-family` (validated for availability). |
| `fontSize` | `(size: number \| string)` | Apply `font-size` = `size + currentUnit` (unit from state, default `px`). |
| `fontSizeUnit` | `(unit: string)` | Re-apply current size with new unit (`px`/`pt`/…). |
| `foreColor` | `(color: string)` | Apply `color`. |
| `backColor` | `(color: string)` | Apply `background-color`. |
| `color` | `({ foreColor?, backColor? })` | Apply fore and/or back color in one call. |
| `insertText` | `(text: string)` | Replace selection with a text node; collapse caret after it. |

### Block format / alignment

| Command | Args | Effect |
|---|---|---|
| `justifyLeft` | — | Paragraph `text-align: left`. |
| `justifyCenter` | — | `text-align: center`. |
| `justifyRight` | — | `text-align: right`. |
| `justifyFull` | — | `text-align: justify`. |
| `formatPara` | — | Convert block(s) to `<p>`. |
| `formatH1` … `formatH6` | — | Convert block(s) to `<h1>` … `<h6>`. |
| `formatBlock` | `(tag: string)` | Generic block conversion (default `'p'`) — drives the style dropdown (p/blockquote/pre/h1..h6). |
| `lineHeight` | `(ratio: number \| string)` | Apply `line-height` to selected paragraphs. |
| `indent` | — | Indent. |
| `outdent` | — | Outdent. |
| `tab` | — | In a collapsed table cell → move to next cell; otherwise insert a 4-NBSP run. |
| `untab` | — | In a collapsed table cell → move to previous cell; otherwise no-op. |

### List

| Command | Args | Effect |
|---|---|---|
| `insertOrderedList` | — | Toggle/insert `<ol>`. |
| `insertUnorderedList` | — | Toggle/insert `<ul>`. |

### Table

| Command | Args | Effect |
|---|---|---|
| `insertTable` | `(dimStr: string)` | Insert a table from `"COLxROW"` (e.g. `'3x2'`, default `'1x1'`) with class `table table-bordered`. |
| `addRow` | `(where?: 'top' \| 'bottom')` | Add a row (default `'bottom'`). |
| `addCol` | `(where?: 'left' \| 'right')` | Add a column (default `'right'`). |
| `deleteRow` | — | Delete current row. |
| `deleteCol` | — | Delete current column. |
| `deleteTable` | — | Delete the enclosing table. |

### Media / link

| Command | Args | Effect |
|---|---|---|
| `createLink` | `({ url, text?, newWindow? })` | Create or update an `<a>`; rejects empty / unsafe (`javascript:`/`vbscript:`/`data:`) URLs. `newWindow: true` sets `target="_blank"` + `rel="noopener noreferrer"`. Edits an existing anchor in place. |
| `unlink` | — | Unwrap the enclosing anchor. |
| `insertImage` | `(src: string, filename?: string)` | Insert `<img src>` (+ optional `data-filename`); caret after it. |
| `insertVideo` | `(url: string)` | Parse a provider URL to an embed node and insert. |
| `insertHorizontalRule` | — | Insert `<hr>`. |
| `insertNode` | `(node: Node)` | Insert an arbitrary DOM node (custom embeds); caret after it. |
| `resizeImage` | `(img: HTMLImageElement, value)` | Set `img` width to `parseFloat(value)*100%`; `''`/`'none'` removes width. (Selectionless.) |
| `floatImage` | `(img: HTMLImageElement, value)` | Set `img` CSS `float` (default `'none'`). (Selectionless.) |
| `removeMedia` | `(img: HTMLImageElement)` | Remove the given image node. (Selectionless.) |

### History

| Command | Args | Effect |
|---|---|---|
| `undo` | — | Undo. (Selectionless.) |
| `redo` | — | Redo. (Selectionless.) |

> **Not commands** (handled elsewhere): `escape`, `insertParagraph`, and `linkDialog.show` are keyMap methods routed to `onShortcut` / native handling, not the command registry. Codeview, fullscreen, and the help/link/image/video dialogs are chrome actions (`ChromeUI`: `openLinkDialog`, `openImageDialog`, `openVideoDialog`, `openHelpDialog`, `toggleFullscreen`, `toggleCodeview`), not engine commands.

---

## Options reference (`options` prop)

The component owns `value` and `onChange`, so the `options` prop is `Omit<EditorCoreOptions, 'value' | 'onChange'>`:

```ts
export interface EditorCoreOptions {
  value?: string;                              // managed by the component
  onChange?: (html: string) => void;           // managed by the component
  historyLimit?: number;                        // undo-stack depth (default 200)
  shortcuts?: boolean;                          // enable keyboard shortcuts (default true)
  keyMap?: KeyMap;                             // default the ported pc/mac keyMap
  isMac?: boolean;                            // use mac keyMap (default env.isMac)
  onShortcut?: (method: string) => boolean;     // shortcut whose method is NOT an editing command
}
```

```tsx
<SummernoteEditor
  options={{
    historyLimit: 500,
    shortcuts: true,
    isMac: false,
  }}
/>
```

> `onShortcut` is set internally by `<SummernoteEditor>` to route e.g. `'linkDialog.show'` to the chrome dialog; returning `true` makes the engine `preventDefault`. If you also pass your own `options`, note the component overrides `value` / `onChange` / `onShortcut`.

The remaining chrome-relevant configuration (toolbar, fonts, colors, styles, line heights, etc.) lives in the engine's `defaultOptions`. Most of it is configured through dedicated props (`toolbar`, `theme`, `lang`) or by composing toolbar item names; the values below document the defaults and the data your custom toolbar/plugins read via `ChromeContext`.

### Toolbar configuration

The `toolbar` prop is an array of `[groupName, [itemName...]]` tuples. The group name is an arbitrary CSS-grouping label; the second element is the ordered list of item names.

**Default toolbar:**

```tsx
const defaultToolbar = [
  ['style',    ['style', 'fontsize', 'height']],
  ['font',     ['bold', 'underline', 'clear']],
  ['fontname', ['fontname']],
  ['color',    ['color']],
  ['para',     ['ul', 'ol', 'paragraph']],
  ['table',    ['table']],
  ['insert',   ['link', 'picture', 'video']],
  ['view',     ['fullscreen', 'codeview', 'help']],
];
```

**A custom toolbar:**

```tsx
<SummernoteEditor
  toolbar={[
    ['style', ['bold', 'italic', 'underline', 'clear']],
    ['font', ['fontname', 'fontsize']],
    ['color', ['color']],
    ['para', ['ul', 'ol', 'paragraph']],
    ['insert', ['link', 'picture', 'video', 'hr']],
    ['view', ['undo', 'redo', 'fullscreen', 'codeview', 'help']],
  ]}
/>
```

### Toolbar / popover item names

Item names are resolved by the toolbar registry to dropdowns, format buttons, or action buttons. Any name not in these tables is treated as a custom (plugin) slot.

**Dropdowns**

| Name | Renders |
|---|---|
| `style` | Block-style (format) dropdown |
| `fontname` | Font-family dropdown |
| `fontsize` | Font-size dropdown |
| `fontsizeunit` | Font-size-unit dropdown |
| `height` | Line-height dropdown |
| `color` | Fore/back color dropdown |
| `paragraph` | Paragraph-align dropdown |
| `table` | Insert-table picker |

**Format buttons** (name → bound command, with derived active/disabled state)

| Name | Command | Active / disabled |
|---|---|---|
| `bold` | `bold` | active = `state.bold` |
| `italic` | `italic` | active = `state.italic` |
| `underline` | `underline` | active = `state.underline` |
| `strikethrough` | `strikethrough` | active = `state.strikethrough` |
| `superscript` | `superscript` | active = `state.superscript` |
| `subscript` | `subscript` | active = `state.subscript` |
| `clear` | `removeFormat` | — |
| `ul` | `insertUnorderedList` | active = `state.unorderedList` |
| `ol` | `insertOrderedList` | active = `state.orderedList` |
| `hr` | `insertHorizontalRule` | — |
| `undo` | `undo` | disabled = `!state.canUndo` |
| `redo` | `redo` | disabled = `!state.canRedo` |

**Action buttons** (name → chrome handler)

| Name | Opens / toggles |
|---|---|
| `link` | Link dialog |
| `picture` | Image dialog |
| `video` | Video dialog |
| `fullscreen` | Fullscreen |
| `codeview` | Codeview (WYSIWYG ↔ HTML) |
| `help` | Help dialog |

> `isKnownItem(name)` returns `true` iff the name is a known dropdown / format / action name (exported from the package). Unknown names render the plugin button registered under that name, or nothing.

### Popover configuration

Contextual popovers are configured per surface (`image`, `link`, `table`, `air`), each as a `ToolbarGroup[]`. Popover-only item names: `resizeFull`/`resizeHalf`/`resizeQuarter`/`resizeNone`, `floatLeft`/`floatRight`/`floatNone`, `removeMedia`, `linkDialogShow`, `unlink`, `addRowDown`/`addRowUp`/`addColLeft`/`addColRight`, `deleteRow`/`deleteCol`/`deleteTable`.

**Default popover config:**

```tsx
const defaultPopover = {
  image: [
    ['resize', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
    ['float',  ['floatLeft', 'floatRight', 'floatNone']],
    ['remove', ['removeMedia']],
  ],
  link: [['link', ['linkDialogShow', 'unlink']]],
  table: [
    ['add',    ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
    ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
  ],
  air: [
    ['color',  ['color']],
    ['font',   ['bold', 'underline', 'clear']],
    ['para',   ['ul', 'paragraph']],
    ['table',  ['table']],
    ['insert', ['link', 'picture']],
    ['view',   ['fullscreen', 'codeview']],
  ],
};
```

The `air` popover is what renders in [air mode](#props-reference) (`airMode` prop) at the selection.

### Style tags

The block-style dropdown (`style` item) offers these tags by default:

```ts
['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
```

These drive the `formatBlock` command (the style dropdown calls `formatBlock(tag)`).

### Font names

The font-family dropdown (`fontname` item) defaults to a Korean-office + Latin set:

```
굴림, 굴림체, 궁서, 궁서체, 돋움, 돋움체, 맑은 고딕, 바탕, 바탕체,
Arial, Inter, Tahoma, Times New Roman, Verdana, Noto Sans KR
```

Companion settings: `fontNamesIgnoreCheck` (names exempt from the "is font installed" filter, default `[]`) and `addDefaultFonts` (whether to prepend the default list, default `true`). Web fonts that aren't loaded yet may be filtered out unless listed in `fontNamesIgnoreCheck`.

### Font sizes & units

```ts
fontSizes:     ['8', '9', '10', '11', '12', '14', '18', '24', '36']   // fontsize dropdown
fontSizeUnits: ['px', 'pt']                                            // fontsizeunit dropdown
```

`fontSize(size)` applies `size + currentUnit`; `fontSizeUnit(unit)` re-applies the current size in a new unit.

### Line heights

The line-height dropdown (`height` item) defaults to:

```ts
['1.0', '1.2', '1.4', '1.5', '1.6', '1.8', '2.0', '3.0']
```

These drive the `lineHeight(ratio)` command.

### Colors

The color dropdown (`color` item) renders an 8×8 hex palette (`colors`) with a positionally matched 8×8 name grid (`colorsName`). The default split-button recents are `{ foreColor: '#000000', backColor: '#FFFF00' }` (`colorButton`).

```
Row 0: #000000 #424242 #636363 #9C9C94 #CEC6CE #EFEFEF #F7F7F7 #FFFFFF
Row 1: #FF0000 #FF9C00 #FFFF00 #00FF00 #00FFFF #0000FF #9C00FF #FF00FF
Row 2: #F7C6CE #FFE7CE #FFEFC6 #D6EFD6 #CEDEE7 #CEE7F7 #D6D6E7 #E7D6DE
Row 3: #E79C9C #FFC69C #FFE79C #B5D6A5 #A5C6CE #9CC6EF #B5A5D6 #D6A5BD
Row 4: #E76363 #F7AD6B #FFD663 #94BD7B #73A5AD #6BADDE #8C7BC6 #C67BA5
Row 5: #CE0000 #E79439 #EFC631 #6BA54A #4A7B8C #3984C6 #634AA5 #A54A7B
Row 6: #9C0000 #B56308 #BD9400 #397B21 #104A5A #085294 #311873 #731842
Row 7: #630000 #7B3900 #846300 #295218 #083139 #003163 #21104A #4A1031
```

Color commands: `foreColor(color)`, `backColor(color)`, or both at once via `color({ foreColor, backColor })`.

### Tables

```ts
tableClassName:     'table table-bordered'   // class on inserted <table>
insertTableMaxSize: { col: 10, row: 10 }     // max dimensions in the size picker
```

Table commands: `insertTable('COLxROW')`, `addRow('top'|'bottom')`, `addCol('left'|'right')`, `deleteRow`, `deleteCol`, `deleteTable`. Tab / Shift+Tab navigate cells.

### Keyboard shortcuts (`keyMap`)

Shortcuts are enabled by default (`shortcuts: true`); disable with `options={{ shortcuts: false }}`. The PC vs. Mac map is chosen by `options.isMac` (defaults to the detected platform). Each entry maps a key combo to a command method; if the method is a registered command it runs directly, otherwise it is dispatched to `onShortcut` (or left native).

| PC combo | Mac combo | Method |
|---|---|---|
| `ESC` | `ESC` | `escape` |
| `ENTER` | `ENTER` | `insertParagraph` |
| `CTRL+Z` | `CMD+Z` | `undo` |
| `CTRL+Y` | `CMD+SHIFT+Z` | `redo` |
| `TAB` | `TAB` | `tab` |
| `SHIFT+TAB` | `SHIFT+TAB` | `untab` |
| `CTRL+B` | `CMD+B` | `bold` |
| `CTRL+I` | `CMD+I` | `italic` |
| `CTRL+U` | `CMD+U` | `underline` |
| `CTRL+SHIFT+S` | `CMD+SHIFT+S` | `strikethrough` |
| `CTRL+BACKSLASH` | `CMD+BACKSLASH` | `removeFormat` |
| `CTRL+SHIFT+L` | `CMD+SHIFT+L` | `justifyLeft` |
| `CTRL+SHIFT+E` | `CMD+SHIFT+E` | `justifyCenter` |
| `CTRL+SHIFT+R` | `CMD+SHIFT+R` | `justifyRight` |
| `CTRL+SHIFT+J` | `CMD+SHIFT+J` | `justifyFull` |
| `CTRL+SHIFT+NUM7` | `CMD+SHIFT+NUM7` | `insertUnorderedList` |
| `CTRL+SHIFT+NUM8` | `CMD+SHIFT+NUM8` | `insertOrderedList` |
| `CTRL+LEFTBRACKET` | `CMD+LEFTBRACKET` | `outdent` |
| `CTRL+RIGHTBRACKET` | `CMD+RIGHTBRACKET` | `indent` |
| `CTRL+NUM0` | `CMD+NUM0` | `formatPara` |
| `CTRL+NUM1`..`NUM6` | `CMD+NUM1`..`NUM6` | `formatH1`..`formatH6` |
| `CTRL+ENTER` | `CMD+ENTER` | `insertHorizontalRule` |
| `CTRL+K` | `CMD+K` | `linkDialog.show` |

`escape`, `insertParagraph`, and `linkDialog.show` are not commands — they fall through to `onShortcut` or stay native. You can supply a custom `keyMap` via `options`.

### History

`historyLimit` (default `200`) sets the undo-stack depth. The engine records one undo step per committed command, per `setHTML`, per settled typing/IME run, and per resolved image upload.

---

## `EditorState`

The engine publishes a snapshot of the caret's structural state via `subscribe(listener)` / `getSnapshot()` (a `useSyncExternalStore` source). It is computed by walking the caret's ancestor chain — there is no `queryCommandState`.

```ts
export interface EditorState {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strikethrough: boolean;
  readonly superscript: boolean;
  readonly subscript: boolean;
  readonly orderedList: boolean;
  readonly unorderedList: boolean;
  readonly align: 'left' | 'center' | 'right' | 'justify' | null; // closest paragraph; null outside editor
  readonly formatBlock: string | null;        // lowercase tag p/h1..h6/blockquote/pre, or null
  readonly link: boolean;                       // caret inside an anchor
  readonly inTable: boolean;                    // caret inside a table cell
  readonly fontName: string;                    // first font-family at caret, dequoted ('' outside)
  readonly fontSize: string;                    // integer font-size as string, e.g. '14' ('' when none)
  readonly fontSizeUnit: string;                // 'px' | 'pt' | '%' … (defaults 'px')
  readonly lineHeight: string;                  // ratio e.g. '1.5' ('' when normal/none)
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly isComposing: boolean;                // IME composition in progress
}
```

You receive this as `state` from [`useSummernote`](#headless-usesummernote--createeditorcore), and inside chrome/plugin components via `useChrome().state`. The toolbar uses it to highlight active buttons and disable undo/redo.

---

## Callbacks — `onChange`, `onImageUpload`

Unlike legacy summernote (which fired both jQuery events and `callbacks`), this port exposes plain React props — a single channel, no dual event path.

### `onChange(html: string)`

Fires after every committed content change: command `afterCommand`, `setHTML`, direct typing/IME settle, undo, redo, and a resolved image upload. It receives the current `getHTML()`.

```tsx
<SummernoteEditor value={html} onChange={(next) => setHtml(next)} />
```

### `onImageUpload(file: File) => string | Promise<string>`

By default a picked image is embedded as a **base64 data URL**. Provide `onImageUpload` to upload the file yourself and return the `src` to insert (a hosted URL or a base64 string). It is called **once per picked file** (single-file). While the promise is pending the editor shows a loading spinner in place; on rejection the placeholder is removed.

```tsx
<SummernoteEditor
  onImageUpload={async (file) => {
    const url = await uploadToS3(file); // your upload
    return url;                          // inserted as <img src={url}>
  }}
/>
```

Mechanics (engine `core.insertImageUpload`):

1. Resolves a range; if nothing is selected/owned, defaults to a caret at the end of the editable.
2. Inserts a placeholder `<img class="note-image-uploading" data-filename="…">`, moves the caret past it, and notifies state — **the spinner is shown but is not yet a change / undo step**.
3. Runs the handler. On resolve (if the placeholder is still connected): sets `src`, removes the `note-image-uploading` class, and commits one undo step + `onChange`. If the placeholder was disconnected (undone / re-seeded while uploading), it bails.
4. On reject: removes the placeholder. So a transient placeholder never leaks into the saved value or the undo stack.

The image dialog also supports inserting by **URL** (independent of `onImageUpload`).

> The engine exposes only two callback hooks: `onChange` (above) and `onShortcut` (a matched shortcut whose method is not a built-in command, e.g. `escape` / `insertParagraph` / `linkDialog.show`; return `true` to `preventDefault`). `onShortcut` is wired internally by the component.

---

## Controlled vs. uncontrolled & the caret-safe contract

**Initial value.** `value ?? defaultValue` seeds the engine once. `value` (controlled) wins over `defaultValue` (uncontrolled, applied once).

**Uncontrolled.** Pass `defaultValue` (and/or use the ref). The engine owns the content after mount; `onChange` reports edits.

```tsx
<SummernoteEditor defaultValue="<p>Edit me…</p>" onChange={save} />
```

**Controlled.** Pass `value` + `onChange`. An external `value` is pushed into the engine **only when it genuinely differs and is not an echo of our own `onChange`**:

- Skipped when `value === undefined` or the core is not mounted.
- While **codeview is open**, the textarea owns content: an external `value` is routed to the codeview HTML (only if it differs), not to the engine.
- Otherwise, returns early if `value` equals the last emitted change **or** equals `core.getHTML()` (already applied) — these guards prevent caret-destroying re-seeds.
- Only a truly new external value calls `core.setHTML(value)`.

```tsx
const [html, setHtml] = React.useState('<p>Hello</p>');
<SummernoteEditor value={html} onChange={setHtml} />;
```

**Why the caret survives.** React renders only the chrome plus the single uncontrolled `contentEditable` leaf — it never renders children into the editable. So chrome re-renders (toolbar / state changes) can't disturb the caret. The engine, not React's reconciler, is the source of truth for the editable subtree, and controlled `value` is only ever force-applied when it differs from both the last emitted value and the current DOM HTML.

---

## Headless: `useSummernote` & `createEditorCore`

Build your own chrome (or no chrome) on top of the engine.

### `useSummernote(options)`

```ts
function useSummernote(options?: EditorCoreOptions): UseSummernoteResult;

interface UseSummernoteResult {
  editableRef: MutableRefObject<HTMLDivElement | null>; // attach to your .note-editable div
  core: EditorCore | null;                              // null until mounted
  state: EditorState;                                   // live selection/toolbar state
}
```

```tsx
import { useSummernote } from '@eaeao/summernote-react';
import '@eaeao/summernote-react/styles.css';

function Headless() {
  const { editableRef, core, state } = useSummernote({ historyLimit: 100 });
  return (
    <div className="note-editor note-frame note-theme-lite">
      <div className="note-toolbar">
        <button
          className={state.bold ? 'active' : undefined}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => core?.command('bold')}
        >
          Bold
        </button>
        <button disabled={!state.canUndo} onClick={() => core?.undo()}>Undo</button>
      </div>
      <div ref={editableRef} className="note-editable notranslate" />
    </div>
  );
}
```

Mechanics: the core mounts in a layout effect on mount only (client-only, StrictMode-idempotent — destroys + nulls on cleanup). Latest options/callbacks flow through a ref, so option changes do **not** remount the engine. `state` re-renders your chrome on engine state changes while the editable DOM stays untouched by React. Before mount, `state` is an inert snapshot (all toggles `false`/empty, `fontSizeUnit: 'px'`).

### `createEditorCore(editable, options)`

Mount the engine on any element with no React at all.

```ts
import { createEditorCore } from '@eaeao/summernote-react';

const el = document.querySelector('#editable') as HTMLElement;
const core = createEditorCore(el, {
  value: '<p>Hi</p>',
  onChange: (html) => console.log(html),
});

core.command('bold');
core.command('insertText', 'Hello');
const html = core.getHTML();
core.destroy();
```

### `EditorCore` public methods

| Method | Signature | Behavior |
|---|---|---|
| constructor | `new EditorCore(editable, options?)` | Adds `note-editable` + `contenteditable=true`, seeds HTML, records initial undo, binds events + IME state machine. |
| `createEditorCore` | `(editable, options?) => EditorCore` | Factory wrapper. |
| `command` | `(name, ...args) => boolean` | Dispatch a command (custom first, then built-in). |
| `registerCommand` | `(name, fn) => void` | Register a per-instance command `(core, ...args) => boolean`. |
| `ownsRange` | `(range) => boolean` | True if a range is inside this editable subtree. |
| `getHTML` | `() => string` | `editable.innerHTML`. |
| `setHTML` | `(html) => void` | Replace content (empty → `<p><br></p>`); no-op while composing; fires `afterCommand`. |
| `insertImageUpload` | `(file, handler) => void` | Spinner placeholder → await handler → swap in `src` + one undo step + `onChange`; remove placeholder on reject. |
| `saveRange` | `() => void` | Snapshot the in-editor selection (for dialogs that steal focus). |
| `restoreRange` | `() => void` | Restore the saved selection (ignores stale ranges). |
| `getSelectedText` | `() => string` | Plain text of saved/live selection (dialog prefill). |
| `getAnchorInfo` | `() => { url; text; newWindow } \| null` | Anchor under saved/live selection (link-dialog prefill). |
| `focus` | `() => void` | Focus the editable. |
| `isComposing` | `() => boolean` | IME composition flag. |
| `subscribe` | `(listener) => () => void` | Add a state listener; returns unsubscribe. |
| `getSnapshot` | `() => EditorState` | Current state snapshot. |
| `undo` | `() => boolean` | Undo + notify + `onChange`; `false` if nothing to undo. |
| `redo` | `() => boolean` | Redo + notify + `onChange`; `false` if nothing to redo. |
| `destroy` | `() => void` | Clear timers, remove listeners, clear subscribers. |
| `editable` | `HTMLElement` (readonly) | The underlying editable element. |

---

## Plugins — `definePlugin`

A plugin is the per-instance replacement for the legacy `$.extend($.summernote.plugins, …)` global. It registers per-instance **commands** on the core and/or custom toolbar **buttons** referenced by name in the toolbar config. No globals.

```ts
export interface SummernotePlugin {
  readonly name: string;
  readonly commands?: Record<string, (core: EditorCore, ...args: unknown[]) => boolean>;
  readonly buttons?: Record<string, FC>; // keyed by the name used in the toolbar config
}

export function definePlugin(plugin: SummernotePlugin): SummernotePlugin;
```

- **`commands`**: each is `(core, ...args) => boolean`. Return `true` if content changed (the engine then commits one undo step + `onChange`); `false` to no-op. Registered via `core.registerCommand` — custom commands take precedence over built-ins of the same name.
- **`buttons`**: keyed by the name you put in the toolbar config, e.g. `toolbar={[['insert', ['star']]]}`. Each is a React `FC` that may call `useChrome()` / `useCommand()`.

### Authoring helpers (from `ChromeContext`)

- `useChrome(): ChromeValue` — gives a button `{ core, state, lang, options, ui, codeviewActive, onImageUpload? }`. Throws if rendered outside `<SummernoteEditor>`.
- `useCommand(): (name, ...args) => void` — dispatches `core.command(name, ...args)` while keeping the editable selection.
- On the core: `core.ownsRange(range)`, `core.saveRange()` / `core.restoreRange()` / `core.focus()`.

> Toolbar buttons must call `onMouseDown={(e) => e.preventDefault()}` so the toolbar mousedown does not blur the editable selection.

### A complete custom plugin

```tsx
import { definePlugin, useChrome, useCommand, SummernoteEditor } from '@eaeao/summernote-react';

function StarButton(): JSX.Element {
  const { options } = useChrome();
  const cmd = useCommand();
  return (
    <button
      type="button"
      className="note-btn"
      title="Star"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => cmd('insertStar')}
    >
      <span className={options.icons.question} aria-hidden="true" />
    </button>
  );
}

export const starPlugin = definePlugin({
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
      return true; // changed → undo step + onChange
    },
  },
  buttons: { star: StarButton },
});

// usage:
<SummernoteEditor plugins={[starPlugin]} toolbar={[['insert', ['star']]]} />;
```

`options.icons` is the icon-class map (e.g. `options.icons.question`, `options.icons.table`) — render glyphs through the shared icon webfont.

### Ship-in-the-box reference plugins

All three are exported from the package root.

| Plugin | Button name | Demonstrates |
|---|---|---|
| `helloPlugin` | `hello` | The minimal contract: one command (`hello`, inserts a text node) + one button. |
| `specialcharsPlugin` | `specialchars` | A **dialog-style** button: opens a `Modal` grid of ~140 HTML entities, uses `core.saveRange()` / `restoreRange()`, then `insertSpecialChar(entity)`. |
| `databasicPlugin` | `databasic` | A direct node insert: builds a `<table class="table table-bordered note-data-basic">` via `insertNode`. |

```tsx
import { SummernoteEditor, helloPlugin, specialcharsPlugin, databasicPlugin } from '@eaeao/summernote-react';

<SummernoteEditor
  plugins={[helloPlugin, specialcharsPlugin, databasicPlugin]}
  toolbar={[['insert', ['hello', 'specialchars', 'databasic']]]}
/>;
```

---

## Themes

The `theme` prop selects one of four skins, **per-instance** — multiple editors with different themes coexist on one page. The prop only sets a root class (`note-theme-${theme}`); all themes share the same `.note-*` markup and icon webfont.

```ts
theme?: 'lite' | 'bs3' | 'bs4' | 'bs5'   // default 'lite'
// also exported: type ThemeName = 'lite' | 'bs3' | 'bs4' | 'bs5'
```

CSS is **not** auto-injected — import it yourself. Subpath exports:

| Import specifier | Skin |
|---|---|
| `@eaeao/summernote-react/styles.css` | base / lite skin (**required**) |
| `@eaeao/summernote-react/icons.css` | shared icon webfont (**required**) |
| `@eaeao/summernote-react/themes/bs3.css` | Bootstrap 3 skin |
| `@eaeao/summernote-react/themes/bs4.css` | Bootstrap 4 skin |
| `@eaeao/summernote-react/themes/bs5.css` | Bootstrap 5 skin |

```tsx
import '@eaeao/summernote-react/styles.css';     // base skin (required)
import '@eaeao/summernote-react/icons.css';      // icon webfont (required)
import '@eaeao/summernote-react/themes/bs5.css'; // optional: Bootstrap-5 skin

<SummernoteEditor theme="bs5" />;
```

`styles.css` + `icons.css` are the baseline; the `themes/bs{3,4,5}.css` files layer on top, matched to the `theme` prop via the `note-theme-*` root class.

---

## Internationalization (i18n)

The `lang` prop accepts a `LangPartial` deep-merged over en-US. Missing keys fall back to English via `resolveLang`. The default (no `lang`) is `langEnUS`.

```ts
type LangPartial = Record<string, Record<string, string> | undefined>;
function resolveLang(partial: LangPartial): Lang; // deep-merges over langEnUS per group
```

**46 bundled locales** are available as `locales` (a `Record<string, LangPartial>`); their codes are `localeCodes`:

```
ar-AR, az-AZ, bg-BG, bn-BD, ca-ES, cs-CZ, da-DK, de-CH, de-DE, el-GR,
es-ES, es-EU, fa-IR, fi-FI, fr-FR, gl-ES, he-IL, hr-HR, hu-HU, id-ID,
it-IT, ja-JP, ko-KR, lt-LT, lt-LV, mn-MN, nb-NO, nl-NL, pl-PL, pt-BR,
pt-PT, ro-RO, ru-RU, sk-SK, sl-SI, sr-RS, sr-RS-Latin, sv-SE, ta-IN,
th-TH, tr-TR, uk-UA, uz-UZ, vi-VN, zh-CN, zh-TW
```

(en-US is the always-present base, not in `locales`.)

```tsx
// Option A: pull from the bundled set
import { SummernoteEditor, locales } from '@eaeao/summernote-react';
<SummernoteEditor lang={locales['ko-KR']} />;

// Option B: ad-hoc partial override (missing keys fall back to English)
<SummernoteEditor lang={{ link: { insert: '링크 삽입' } }} />;
```

> Unlike legacy summernote, there is no `$.summernote.lang` global and no requirement to load a language pack before init — pass the locale object as a prop. Locale modules are tree-shakeable.

---

## Security

Two layers of protection, both engine-side:

- **Link URL filtering.** `createLink` rejects empty and unsafe URLs (`javascript:`, `vbscript:`, `data:` schemes) before creating or updating an `<a>`. `newWindow: true` adds `rel="noopener noreferrer"` alongside `target="_blank"`.
- **Codeview sanitization.** When you leave codeview, the textarea HTML (which an attacker can influence) is passed through `purifyCodeview(...)` before `core.setHTML(...)` — matching the legacy `codeviewFilter: true` default. `purifyCodeview` is exported from the package root if you want to sanitize HTML yourself.

> As with any rich-text editor, **front-end filtering is not sufficient on its own** — always re-validate and sanitize submitted HTML on the server before storing or rendering it.

---

## Extension-safe selection

Browser extensions (dictionaries, translators, Grammarly) and page-translation features can collapse or hijack the editable's selection. The port hardens against this:

- The editable opts out of Grammarly (`data-gramm="false"`, `data-gramm_editor="false"`, `data-enable-grammarly="false"`) and page translation (`translate="no"`, the `notranslate` class).
- The selection survives extensions that collapse it on toolbar mousedown. In your own toolbar/plugin buttons, always `onMouseDown={(e) => e.preventDefault()}` so the editable keeps focus, and prefer `useCommand()` (which dispatches while preserving the selection) over calling `core.command` from a raw click handler.

---

## See also

- [Getting started](./getting-started.md) — install, first editor, layout, and basics.
- The package root re-exports the entire engine, so `createEditorCore`, `defaultOptions`, `langEnUS`, `resolveLang`, `purifyCodeview`, `locales`, and the `EditorState` / `EditorCoreOptions` / `Lang` / `LangPartial` / `ThemeName` types are all importable from `@eaeao/summernote-react`.
