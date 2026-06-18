# 헤드리스 및 플러그인 API

`useSummernote` / `createEditorCore`로 엔진 위에 직접 크롬을 (또는 크롬 없이) 구성하고, `definePlugin`으로 인스턴스별 명령과 툴바 버튼을 추가해 어떤 에디터든 확장할 수 있습니다. 전역(global)은 없습니다.

> jQuery 플러그인을 마이그레이션하시나요? 1:1 대응 매핑은 [Migrating from jQuery](./migrating.md)를 참고하세요. 복붙으로 바로 쓸 수 있는 플러그인 레시피는 [Examples → Custom plugin](./examples.md#custom-plugin)을 참고하세요.

---

## Headless: `useSummernote` & `createEditorCore`

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

동작 원리: 코어는 마운트 시점에만 레이아웃 이펙트에서 마운트됩니다(클라이언트 전용, StrictMode 멱등 — 클린업 시 destroy 후 null 처리). 최신 옵션/콜백은 ref를 통해 전달되므로, 옵션이 바뀌어도 엔진은 **다시 마운트되지 않습니다**. `state`는 엔진 상태가 변할 때 크롬을 리렌더링하며, 이때 editable DOM은 React가 건드리지 않은 채로 유지됩니다. 마운트 전 `state`는 비활성 스냅샷입니다(모든 토글이 `false`/빈 값, `fontSizeUnit: 'px'`).

### `createEditorCore(editable, options)`

React 없이도 어떤 요소에든 엔진을 마운트할 수 있습니다.

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
| constructor | `new EditorCore(editable, options?)` | `note-editable` + `contenteditable=true`를 추가하고, HTML을 시드하고, 초기 undo를 기록하며, 이벤트와 IME 상태 머신을 바인딩합니다. |
| `createEditorCore` | `(editable, options?) => EditorCore` | 팩토리 래퍼입니다. |
| `command` | `(name, ...args) => boolean` | 명령을 디스패치합니다(커스텀 우선, 그다음 빌트인). |
| `registerCommand` | `(name, fn) => void` | 인스턴스별 명령 `(core, ...args) => boolean`을 등록합니다. |
| `ownsRange` | `(range) => boolean` | 해당 range가 이 editable 서브트리 안에 있으면 true입니다. |
| `getHTML` | `() => string` | `editable.innerHTML`을 반환합니다. |
| `setHTML` | `(html) => void` | 콘텐츠를 교체합니다(비어 있으면 → `<p><br></p>`). 조합(composing) 중에는 no-op이며, `afterCommand`를 발화합니다. |
| `insertImageUpload` | `(file, handler) => void` | 스피너 플레이스홀더 삽입 → handler 대기 → `src` 교체 + undo 단계 1개 + `onChange`. 거부 시 플레이스홀더를 제거합니다. |
| `saveRange` | `() => void` | 에디터 내부 선택(selection)을 스냅샷으로 저장합니다(포커스를 가로채는 다이얼로그용). |
| `restoreRange` | `() => void` | 저장된 선택(selection)을 복원합니다(오래된 range는 무시). |
| `getSelectedText` | `() => string` | 저장된/실시간 선택(selection)의 평문 텍스트입니다(다이얼로그 프리필용). |
| `getAnchorInfo` | `() => { url; text; newWindow } \| null` | 저장된/실시간 선택(selection) 아래의 앵커입니다(링크 다이얼로그 프리필용). |
| `focus` | `() => void` | editable에 포커스를 줍니다. |
| `isComposing` | `() => boolean` | IME 조합 플래그입니다. |
| `subscribe` | `(listener) => () => void` | 상태 리스너를 추가하고, 구독 해제 함수를 반환합니다. |
| `getSnapshot` | `() => EditorState` | 현재 상태 스냅샷입니다. |
| `undo` | `() => boolean` | undo + 알림 + `onChange`. undo할 것이 없으면 `false`입니다. |
| `redo` | `() => boolean` | redo + 알림 + `onChange`. redo할 것이 없으면 `false`입니다. |
| `destroy` | `() => void` | 타이머를 정리하고, 리스너를 제거하며, 구독자를 비웁니다. |
| `editable` | `HTMLElement` (readonly) | 내부 editable 요소입니다. |

---

## Plugins — `definePlugin`

플러그인은 레거시 전역 `$.extend($.summernote.plugins, …)`를 대체하는 인스턴스 단위 수단입니다. 살아 있는 `EditorCore`에 인스턴스별 **명령**을 등록하고/또는 툴바 설정에서 이름으로 참조되는 커스텀 툴바 **버튼**을 등록합니다. 전역은 전혀 없습니다.

```ts
import type { EditorCore } from '@eaeao/summernote-react';
import type { FC } from 'react';

export interface SummernotePlugin {
  readonly name: string;
  readonly commands?: Record<string, (core: EditorCore, ...args: unknown[]) => boolean>;
  readonly buttons?: Record<string, FC>; // keyed by the name used in the toolbar config
}

export function definePlugin(plugin: SummernotePlugin): SummernotePlugin;
```

| Field | Type | Purpose |
|---|---|---|
| `name` | `string` | 플러그인 식별자입니다(자체 관리용). |
| `commands` | `Record<string, (core, ...args) => boolean>` | 각 항목은 `core.registerCommand(name, fn)`을 통해 등록됩니다. 콘텐츠가 변경되었으면 `true`를 반환하세요(그러면 엔진이 **undo 단계 1개**를 커밋하고 `onChange`를 발화합니다). no-op이면 `false`를 반환합니다. 같은 이름의 커스텀 명령은 빌트인보다 우선합니다. |
| `buttons` | `Record<string, FC>` | 각 값은 React 컴포넌트이며, 키는 `toolbar`(또는 `popover`) 설정에 넣는 이름입니다. 컴포넌트는 `useChrome()` / `useCommand()`를 호출할 수 있습니다. |

`definePlugin`은 항등(identity) 헬퍼입니다 — 인자를 `SummernotePlugin` 타입으로 반환합니다.

### How a command runs

1. **Registration.** 마운트 시 `<SummernoteEditor>`가 `plugins`를 순회하며, `commands`의 각 항목에 대해 `core.registerCommand(name, fn)`을 호출합니다.
2. **Dispatch.** 버튼 컴포넌트에서는 `useCommand()` 훅을 사용하고, ref에서는 `ref.current?.command(name, …)`을 사용합니다.
3. **Selection gate.** 대부분의 명령은 에디터 내부에 살아 있는(또는 복원 가능한) 선택(selection)을 요구하며, 그렇지 않으면 `false`를 반환합니다. 명령 내부에서 `core.ownsRange(range)`로 가드하세요 — 해당 range가 *이* 에디터의 editable 서브트리 안에 있을 때만 true입니다.
4. **Commit.** 명령이 `true`를 반환하면 엔진이 `afterCommand()`를 실행합니다: DOM을 정규화하고, **undo 항목 1개**를 푸시하며, `onChange(html)`을 발화합니다. `false`를 반환하면 아무것도 커밋되지 않습니다.

### Authoring helpers (`useChrome` / `useCommand`)

버튼 컴포넌트는 `<SummernoteEditor>` 내부에서 실행되므로 크롬 컨텍스트를 읽을 수 있습니다.

```ts
function useChrome(): ChromeValue;  // throws if used outside <SummernoteEditor>
function useCommand(): (name: string, ...args: unknown[]) => void;
```

`useChrome()`이 반환하는 값:

| Field | Type | Use |
|---|---|---|
| `core` | `EditorCore \| null` | 살아 있는 엔진입니다 — `command`, `ownsRange`, `saveRange`, `restoreRange`, `focus`, `getHTML`, … |
| `state` | `EditorState` | 실시간 툴바 상태(`bold`, `align`, `formatBlock`, `canUndo`, …)로, active/disabled 스타일링에 사용합니다. |
| `lang` | `Lang` | 해석된 로케일 문자열입니다(툴팁/타이틀에 사용). |
| `options` | `ChromeOptions` | 기본 옵션 객체입니다. `options.icons`, `fontNames`, `colors`, … 를 포함합니다. |
| `ui` | `Partial<ChromeUI>` | 다이얼로그/뷰 토글입니다: `openLinkDialog`, `openImageDialog`, `openVideoDialog`, `openHelpDialog`, `toggleFullscreen`, `toggleCodeview`. |
| `codeviewActive` | `boolean` | codeview textarea가 보이는 동안 true입니다. |
| `onImageUpload` | `ImageUploadHandler?` | 소비자의 이미지 업로드 훅입니다(있는 경우). |

> 툴바 버튼은 반드시 `onMouseDown={(e) => e.preventDefault()}`를 호출해야 합니다. 그래야 툴바 mousedown이 editable의 선택(selection)을 블러시키지 않습니다. `useCommand()`는 그 선택(selection)을 살려둔 채 `core.command(name, ...args)`를 디스패치합니다. [Extension-safe selection](./concepts.md)을 참고하세요.

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

`options.icons`는 아이콘 클래스 맵입니다(예: `options.icons.question`, `options.icons.table`) — 공유 아이콘 웹폰트를 통해 글리프를 렌더링합니다(`@eaeao/summernote-react/icons.css`가 필요합니다).

### A dialog-style plugin (save / restore)

모달을 여는 버튼의 경우, 모달이 포커스를 가로채기 전에 선택(selection)을 캡처하고, 삽입 전에 이를 복원하세요:

```tsx
import { useState } from 'react';
import { definePlugin, Modal, useChrome, useCommand } from '@eaeao/summernote-react';

function EmojiButton() {
  const { core, options } = useChrome();
  const cmd = useCommand();
  const [open, setOpen] = useState(false);

  const openDialog = () => {
    core?.saveRange(); // capture selection before the modal steals focus
    setOpen(true);
  };
  const pick = (emoji: string) => {
    core?.restoreRange();
    cmd('insertEmoji', emoji);
    setOpen(false);
    core?.focus();
  };

  return (
    <>
      <button type="button" className="note-btn" title="Insert emoji"
        onMouseDown={(e) => e.preventDefault()} onClick={openDialog}>
        <span className={options.icons.magic} aria-hidden="true" />
      </button>
      {open && (
        <Modal title="Insert emoji" onClose={() => setOpen(false)}>
          {['😀', '🎉', '🚀', '★'].map((e) => (
            <button key={e} type="button" onClick={() => pick(e)}>{e}</button>
          ))}
        </Modal>
      )}
    </>
  );
}

export const emojiPlugin = definePlugin({
  name: 'emoji',
  commands: {
    insertEmoji: (core, emoji): boolean => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      const range = sel.getRangeAt(0);
      if (!core.ownsRange(range)) return false;
      range.deleteContents();
      range.insertNode(document.createTextNode(String(emoji)));
      range.collapse(false);
      return true;
    },
  },
  buttons: { emoji: EmojiButton },
});
```

### The three reference plugins

세 가지 모두 패키지에 기본 포함되어 있으며, 패키지 루트에서 export됩니다.

| Plugin | Button name | Demonstrates |
|---|---|---|
| `helloPlugin` | `hello` | 최소 계약을 보여줍니다: 명령 1개(`hello`, 텍스트 노드 삽입) + 버튼 1개. |
| `specialcharsPlugin` | `specialchars` | **다이얼로그 형식** 버튼입니다: 약 140개의 HTML 엔티티가 담긴 `Modal` 그리드를 열고, `core.saveRange()` / `restoreRange()`를 사용한 뒤 `insertSpecialChar(entity)`를 호출합니다. |
| `databasicPlugin` | `databasic` | 직접 노드 삽입입니다: `insertNode`로 `<table class="table table-bordered note-data-basic">`를 만듭니다. |

```tsx
import { SummernoteEditor, helloPlugin, specialcharsPlugin, databasicPlugin } from '@eaeao/summernote-react';

<SummernoteEditor
  plugins={[helloPlugin, specialcharsPlugin, databasicPlugin]}
  toolbar={[['insert', ['hello', 'specialchars', 'databasic']]]}
/>;
```

### Reading / writing content from a command

명령은 `EditorCore`를 직접 받으므로, DOM을 직접 건드리기보다 엔진 표면을 우선 사용하세요:

| Need | Use |
|---|---|
| Current HTML | `core.getHTML()` |
| Replace all content | `core.setHTML(html)` |
| Dispatch another command | `core.command(name, ...args)` |
| Insert a DOM node | `core.command('insertNode', node)` |
| Insert text | `core.command('insertText', text)` |
| Insert an image src | `core.command('insertImage', src, filename?)` |
| Plain text of the selection | `core.getSelectedText()` |
| Anchor under the caret (link dialogs) | `core.getAnchorInfo()` |
| Is a range inside this editor? | `core.ownsRange(range)` |

---

## See also

- [Component & state](./reference-component.md) — props, 명령형 `ref`, 그리고 `EditorState`.
- [Commands](./reference-commands.md) — 플러그인이 디스패치하거나 오버라이드할 수 있는 빌트인 명령 카탈로그.
- [Examples → Custom plugin](./examples.md#custom-plugin) — 복붙으로 바로 쓸 수 있는 레시피.
- [Migrating from jQuery](./migrating.md) — 레거시 `$.summernote.plugins` → `definePlugin` 매핑.
