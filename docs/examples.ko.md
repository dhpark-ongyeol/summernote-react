# 예제

`@eaeao/summernote-react`를 위한 실행 가능한 TSX 레시피 모음입니다. 이 패키지는 **런타임 의존성이 전혀 없고 jQuery도 사용하지 않는** summernote의 React + TypeScript 포트입니다. 각 레시피는 [summernote.org/examples](https://summernote.org/examples/)의 데모를 그대로 옮긴 것이지만, 우리의 React 컴포넌트 API에 맞게 완전히 변환했습니다.

> 처음이신가요? 먼저 [Getting Started](./getting-started.md)에서 설치와 기본 사항을 익힌 뒤 이 레시피로 돌아오세요. 전체 prop / 핸들 / 명령 / 옵션 계약은 [API reference](./reference-component.md)를 참고하세요.

## Contents

- [설정 (CSS 임포트)](#setup-css-imports)
- [기본 에디터](#basic-editor)
- [controlled 값 + 실시간 HTML](#controlled-value--live-html)
- [uncontrolled + 명령형 ref](#uncontrolled--imperative-ref)
- [Air 모드](#air-mode)
- [테마](#themes)
- [지역화 (i18n)](#localization-i18n)
- [이미지 업로드 (비동기 `onImageUpload`)](#image-upload-async-onimageupload)
- [커스텀 툴바](#custom-toolbar)
- [클릭하여 편집](#click-to-edit)
- [다중 에디터](#multiple-editors)
- [커스텀 플러그인](#custom-plugin)
- [레퍼런스](#reference)

---

## Setup (CSS imports)

CSS는 **자동으로 주입되지 않으므로** 직접 임포트해야 합니다. 기본 스킨(`styles.css`)과 아이콘 웹폰트(`icons.css`)는 항상 필요하며, Bootstrap 스킨은 선택 사항으로 그 위에 덧입혀집니다.

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

아래 레시피에서는 간결함을 위해 CSS 임포트를 생략했습니다. 앱 진입점에 한 번만 추가하세요.

---

## Basic editor

가장 단순한 경우로, 초기 값을 가진 uncontrolled 에디터입니다. 마운트 이후 콘텐츠는 엔진이 소유하며, ref를 통해 다시 읽거나([uncontrolled + 명령형 ref](#uncontrolled--imperative-ref) 참고) `onChange`로 수신합니다.

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

- `defaultValue`는 마운트 시 콘텐츠를 **한 번만** 시드합니다(uncontrolled).
- `placeholder`는 편집 영역이 비어 있고 codeview가 닫혀 있을 때만 표시됩니다.

---

## Controlled value + live HTML

`value` + `onChange`를 전달하면 에디터가 controlled 상태가 됩니다. 이 컴포넌트는 캐럿 안전(caret-safe)합니다. 외부 `value`는 마지막으로 발생한 변경 및 현재 DOM 모두와 실제로 다를 때에만 엔진에 다시 적용되므로, 툴바/상태 리렌더링이 캐럿을 절대 흐트러뜨리지 않습니다.

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

- `onChange(html: string)`은 변경이 커밋될 때마다 새로운 편집 영역 HTML을 받습니다.
- `value`(controlled)는 항상 `defaultValue`보다 우선합니다.

---

## Uncontrolled + imperative ref

폼 형태의 사용에서는 에디터를 uncontrolled로 두고 `SummernoteEditorHandle` ref를 통해 접근할 수 있습니다. 이 핸들은 `getCode` / `setCode` / `command` / `focus` / `undo` / `redo`와 원시 `core` 탈출구(escape hatch)를 노출합니다.

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

`command(name, ...args)`는 모든 엔진 또는 플러그인 명령을 디스패치하고 실행 여부를 반환합니다. 자주 쓰는 명령으로는 `bold`, `italic`, `underline`, `insertText`, `formatH1`–`formatH6`, `insertOrderedList`, `insertImage`, `createLink`가 있습니다. 전체 목록은 [command catalog](./reference-commands.md)를 참고하세요.

---

## Air mode

Air 모드는 고정 툴바와 상태바를 제거하고, 대신 선택(selection) 위치에 떠 있는 플로팅 툴바를 표시합니다. `airMode` prop으로 활성화합니다. 플로팅 툴바의 구성은 엔진의 `popover.air` 설정에서 가져옵니다.

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

- 루트 요소에 `note-airframe` 클래스가 추가됩니다.
- Air 모드에서는 상태바/리사이즈 바가 (`disableResize` 여부와 무관하게) 절대 렌더링되지 않습니다.
- 기본 air 팝오버는 색상, 굵게/밑줄/지우기, ul/문단, 표, 링크/그림, 전체화면/codeview를 제공합니다.

---

## Themes

`theme` prop은 네 가지 시각 스킨 중 하나를 선택합니다 — `lite`(기본값), `bs3`, `bs4`, `bs5`. 테마는 **인스턴스별(per-instance)**로 적용되므로, 서로 다른 테마를 가진 여러 에디터가 한 페이지에 공존할 수 있습니다. 일치하는 CSS 스킨을 임포트하는 것을 잊지 마세요.

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

`theme` prop은 루트의 `note-theme-${theme}` 클래스만 설정합니다. 모든 테마는 동일한 `.note-*` 마크업과 공유 아이콘 웹폰트를 사용합니다. UI가 전역이었고 페이지당 테마 혼용이 지원되지 않던 레거시 jQuery 빌드와 달리, 이 포트는 테마를 인스턴스별로 해석합니다.

내보낸 `ThemeName` 타입으로 테마 이름을 타입 지정할 수도 있습니다.

```tsx
import type { ThemeName } from '@eaeao/summernote-react';
const theme: ThemeName = 'bs4';
```

---

## Localization (i18n)

로케일을 `lang` prop으로 전달합니다. 번들된 46개 로케일은 `locales` 맵으로 내보내지며, 각각은 en-US 위에 깊게 병합되는 부분 오버라이드입니다(누락된 키는 영어로 폴백됩니다). 기본값(`lang` prop 없음)은 en-US입니다.

```tsx
import { SummernoteEditor, locales } from '@eaeao/summernote-react';

export function KoreanEditor() {
  return <SummernoteEditor lang={locales['ko-KR']} defaultValue="<p>안녕하세요.</p>" />;
}
```

임시 부분 오버라이드를 전달할 수도 있으며, 누락된 키는 모두 영어로 폴백됩니다.

```tsx
<SummernoteEditor lang={{ link: { insert: '링크 삽입' } }} />
```

`locales`의 각 로케일은 자체 모듈이므로 `locales` 맵은 트리 셰이킹이 가능합니다. 이를 지원하는 번들러는 참조하지 않은 로케일을 제거합니다. 하나만 필요하다면 맵 전체를 펼치지 말고 구조 분해(또는 별칭 지정)하세요.

```tsx
import { SummernoteEditor, locales } from '@eaeao/summernote-react';

const koKR = locales['ko-KR'];
<SummernoteEditor lang={koKR} />;
```

번들된 46개 로케일 코드는 [i18n reference](./reference-options.md#internationalization-i18n)에 나열되어 있습니다. (en-US는 항상 존재하는 기준입니다.)

---

## Image upload (async `onImageUpload`)

기본적으로 선택한 이미지는 base64 데이터 URL로 임베드됩니다. `onImageUpload` 핸들러를 제공하면 파일을 원하는 방식(자체 서버, S3 등)으로 업로드하고 삽입할 `src`를 반환할 수 있습니다. 시그니처는 `(file: File) => string | Promise<string>`이며, 프로미스가 대기 중인 동안 에디터는 해당 위치에 스피너를 표시하고, 거부(rejection) 시에는 저장된 값이나 undo 스택을 전혀 건드리지 않고 플레이스홀더를 제거합니다.

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

- 선택한 **파일마다 한 번씩** 호출됩니다(그림 다이얼로그의 파일 입력은 단일 파일입니다).
- 호스팅된 URL **또는** base64 데이터 URL을 반환하세요 — 둘 다 유효한 `src` 값입니다.
- 그림 다이얼로그는 이 훅과 무관하게 **URL**로 직접 삽입하는 것도 지원합니다.

---

## Custom toolbar

`toolbar` prop은 `[groupName, [itemName, …]]` 튜플의 배열입니다 — 레거시 jQuery 빌드와 동일한 튜플 형식이지만, 옵션 객체 대신 prop으로 전달됩니다. 그룹 이름은 CSS 그룹화 레이블일 뿐이며, 아이템 이름은 인식 가능한 툴바 아이템이어야 합니다.

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

툴바를 완전히 숨기려면 빈 배열을 전달하세요.

```tsx
<SummernoteEditor toolbar={[]} />
```

### Recognized toolbar item names

내장 아이템은 세 가지 집합으로 나뉩니다: **드롭다운**(`style`, `fontname`, `fontsize`, `fontsizeunit`, `height`, `color`, `paragraph`, `table`), **포맷 버튼**(`bold`, `italic`, `underline`, `strikethrough`, `superscript`, `subscript`, `clear`, `ul`, `ol`, `hr`, `undo`, `redo`), **액션 버튼**(`link`, `picture`, `video`, `fullscreen`, `codeview`, `help`). 그 외의 이름은 커스텀/플러그인 버튼으로 해석됩니다([커스텀 플러그인](#custom-plugin) 참고).

전체 아이템 이름 표(바인딩된 명령과 활성/비활성 상태 포함)와 기본 툴바 레이아웃은 [toolbar reference](./reference-options.md#toolbar--popover-item-names)에 있습니다.

---

## Click to edit

jQuery 버전은 "edit" 시 초기화하고 "save" 시 정리(teardown)하며 `code`를 읽어 들이는 방식으로, 읽기 전용 표시와 라이브 에디터 사이를 전환합니다. React에서는 이것이 단순한 조건부 마운팅입니다 — 컴포넌트를 언마운트하는 것이 정리에 해당하고, 언마운트하기 전에 ref를 통해 콘텐츠를 다시 읽으면 됩니다.

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

- `<SummernoteEditor>`를 마운트하면 엔진이 구성됩니다(summernote 초기화에 해당). 언마운트하면 `core.destroy()`가 실행됩니다(`'destroy'`에 해당).
- 언마운트하기 **전에** `ref.current?.getCode()`(`code` 게터)로 콘텐츠를 읽으세요.

---

## Multiple editors

각 `<SummernoteEditor>`는 완전히 독립적이므로, 원하는 만큼 렌더링하면 됩니다. 테마가 인스턴스별이기 때문에 같은 페이지에서 테마를 혼용할 수도 있습니다.

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

각 에디터는 자체 상태, undo 히스토리, 테마, 로케일을 유지합니다. 덮어쓸 수 있는 공유 전역이 없습니다.

---

## Custom plugin

플러그인은 레거시 `$.extend($.summernote.plugins, …)` 전역을 인스턴스별로 대체하는 수단입니다. `definePlugin({ name, commands?, buttons? })`로 정의합니다: `commands`는 `core.registerCommand`를 통해 라이브 `EditorCore`에 등록되고, `buttons`는 그 키가 `toolbar` 설정에 나타나는 위치에 렌더링되는 React 컴포넌트입니다.

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

- 명령은 `(core, ...args) => boolean` 형태입니다. 콘텐츠를 변경했다면 `true`를 반환하고(그러면 엔진이 undo 단계를 하나 커밋하고 `onChange`를 발생시킵니다), 아무 동작도 하지 않으려면 `false`를 반환하세요.
- 명령은 `core.ownsRange(range)`로 가드하여 자신의 편집 영역 내부에서만 동작하도록 하세요.
- 버튼 컴포넌트는 `useChrome()`(`core`, `state`, `lang`, `options`, `ui`, `codeviewActive`, `onImageUpload` 등을 위함)과 `useCommand()`(선택을 보존하는 디스패처)를 사용할 수 있습니다. 둘 다 `<SummernoteEditor>` 외부에서 렌더링되면 throw합니다.

전체 플러그인 계약, `useChrome` / `useCommand` 헬퍼, 그리고 세 가지 레퍼런스 플러그인(`helloPlugin`, `specialcharsPlugin`, `databasicPlugin`)은 [plugin API](./reference-api.md#plugins--defineplugin)를 참고하세요.

---

## Reference

이 레시피들은 몇 가지 prop과 명령형 핸들을 사용합니다. 모든 `<SummernoteEditor>` prop, `SummernoteEditorHandle` 멤버, 전체 `command(name, …)` 카탈로그, 모든 엔진 옵션 등 완전한 계약은 레퍼런스를 참고하세요.

- Props → [Props reference](./reference-component.md#props-reference)
- 명령형 ref → [`SummernoteEditorHandle`](./reference-component.md#imperative-ref--summernoteeditorhandle)
- Commands → [Commands](./reference-commands.md)
- Options → [Options & toolbar](./reference-options.md)
- 헤드리스 훅 → [`useSummernote`](./reference-api.md#headless-usesummernote--createeditorcore)

---

## See also

- [Getting Started](./getting-started.md) — 설치 + 첫 에디터
- [Component & state](./reference-component.md#props-reference) — props, 핸들, `EditorState`, 콜백
- [Headless & plugin API](./reference-api.md#plugins--defineplugin) — `definePlugin`과 레퍼런스 플러그인
- [summernote.org/examples](https://summernote.org/examples/) — 이 레시피들이 옮긴 원본 jQuery 데모
