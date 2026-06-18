# @eaeao/summernote-react

> summernote를 React + TypeScript로 포팅 — 자체 엔진, 런타임 의존성 0, jQuery 없음.

`@eaeao/summernote-react`는 summernote WYSIWYG 에디터를 React 18+의 진짜 컴포넌트로 가져온 단일 npm 패키지입니다. 편집 엔진(range 명령, 히스토리, 표, 리스트, 구조적 상태 검출)과 React 바인딩이 함께 들어 있어 **런타임 의존성이 없습니다** — `react`/`react-dom`(>=18)은 peer 의존성이고 엔진은 번들에 포함됩니다. React 방식 그대로 사용합니다: `<SummernoteEditor value={html} onChange={setHtml} />`를 렌더하고, `SummernoteEditorHandle` ref로 명령형 제어하고, `definePlugin(...)`으로 확장하고, 인스턴스별로 테마를 적용하고, 번들된 `locales`로 현지화합니다. Chromium + WebKit에서 검증되었습니다.

## 설치

```bash
npm install @eaeao/summernote-react
```

```bash
yarn add @eaeao/summernote-react
```

`react`와 `react-dom`(>=18)이 앱에 이미 있어야 합니다 — peer 의존성입니다.

## 최소 예제

```tsx
import { useState } from 'react';
import { SummernoteEditor } from '@eaeao/summernote-react';

// CSS는 자동 주입되지 않습니다 — 베이스 스킨 + 아이콘 웹폰트를 직접 import 하세요.
import '@eaeao/summernote-react/styles.css';
import '@eaeao/summernote-react/icons.css';

export function Editor() {
  const [html, setHtml] = useState('<p>Hello <b>Summernote</b></p>');

  return <SummernoteEditor value={html} onChange={setHtml} />;
}
```

이게 전체 계약입니다: `value`가 HTML의 단일 진실 공급원이고 `onChange(html: string)`가 편집을 보고합니다. 엔진이 `contentEditable` 서브트리를 소유하고, React는 주변 크롬(툴바·드롭다운·다이얼로그·팝오버·상태바)만 렌더하므로 리렌더가 커서를 흔들지 않습니다.

### Uncontrolled + 명령형 ref

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

`SummernoteEditorHandle`은 `getCode()`, `setCode(html)`, `command(name, ...args)`, `focus()`, `undo()`, `redo()`, 그리고 `core`(원시 `EditorCore` 엔진 인스턴스, 마운트 전엔 `null`)를 제공합니다.

## 문서

**튜토리얼** — [시작하기](./getting-started.md): 설치, CSS import, 가이드형 첫 에디터.

**사용법** — [예제](./examples.md): 복붙 가능한 레시피(에어 모드, 테마, i18n, 이미지 업로드, 커스텀 툴바, 플러그인 …).

**레퍼런스**

| 페이지 | 내용 |
|---|---|
| [Component & state](./reference-component.md) | 모든 `<SummernoteEditor>` prop, `SummernoteEditorHandle` ref, 발행되는 `EditorState`, `onChange` / `onImageUpload` 콜백. |
| [Commands](./reference-commands.md) | 전체 `command(name, ...)` 카탈로그(인라인·블록·리스트·표·미디어·히스토리). |
| [Options & toolbar](./reference-options.md) | 엔진 `options`, `toolbar` / `popover` 튜플 형식과 아이템명, 폰트, 색상, 줄간격, `keyMap`, 테마, 46개 번들 로케일. |
| [Headless & plugin API](./reference-api.md) | `useSummernote`, `createEditorCore`, `EditorCore` 메서드, `definePlugin` / `useChrome` / `useCommand` 계약. |

**설명**

| 페이지 | 내용 |
|---|---|
| [작동 원리](./concepts.md) | 아키텍처(엔진 vs 크롬), controlled caret-safe 계약, 보안 모델, extension-safe selection. |
| [jQuery에서 이전](./migrating.md) | 레거시 `$('.x').summernote(...)` / `$.summernote.plugins` → React 컴포넌트·props·ref·`definePlugin` 매핑. |

## 핵심 사실

- **jQuery 없음.** 엔진이 커서의 조상 체인을 따라 구조적으로 상태를 계산하고 자체 Range 명령으로 편집합니다.
- **런타임 의존성 0.** `react` / `react-dom`(>=18) peer만; 엔진은 번들 포함(ESM + CJS + `.d.ts`).
- **인스턴스별 테마.** `theme="lite | bs3 | bs4 | bs5"` + 해당 CSS — 서로 다른 테마의 에디터가 한 페이지에 공존합니다.
- **46개 번들 로케일.** `import { locales } from '@eaeao/summernote-react'` 후 `lang={locales['ko-KR']}`; 누락된 키는 en-US로 폴백됩니다.
- **교체 가능한 이미지 업로드.** `onImageUpload={(file) => string | Promise<string>}`로 기본 base64 임베드를 자체 호스팅 `src`로 교체합니다.

## 링크

- **라이브 데모:** <https://eaeao.github.io/summernote-react/>
- **npm:** <https://www.npmjs.com/package/@eaeao/summernote-react>

## 라이선스

MIT.
