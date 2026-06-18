# Commands

`core.command(name, ...args): boolean` (그리고 핸들의 [`command(...)`](./reference-component.md#imperative-ref--summernoteeditorhandle))은 엔진의 명령 레지스트리로 디스패치합니다. 플러그인이 `registerCommand`로 등록한 커스텀 명령은 같은 이름의 내장 명령보다 우선합니다. 명령이 변경을 보고하면 `true`를 반환합니다.

`undo`, `redo`, `resizeImage`, `floatImage`, `removeMedia`처럼 선택(selection)이 필요 없는 명령을 **제외한** 모든 명령은 활성 상태이거나 복구 가능한 에디터 내부 선택(selection)을 요구하며, 그렇지 않으면 아무 동작도 하지 않고 `false`를 반환합니다.

---

## Inline format

| Command | Args | Effect |
|---|---|---|
| `bold` | — | 볼드를 토글합니다 (표준 `<b>`). |
| `italic` | — | 이탤릭을 토글합니다 (표준 `<i>`). |
| `underline` | — | `<u>`를 토글합니다. |
| `strikethrough` | — | 취소선을 토글합니다 (표준 `<s>`). |
| `superscript` | — | `<sup>`를 토글합니다. |
| `subscript` | — | `<sub>`를 토글합니다. |
| `removeFormat` | — | 커서 위치의 모든 인라인 포맷 태그(`B,STRONG,I,EM,U,S,STRIKE,SUP,SUB,SPAN`)를 벗겨냅니다. |
| `fontName` | `(name: string)` | `font-family`를 적용합니다 (사용 가능 여부 검증). |
| `fontSize` | `(size: number \| string)` | `font-size` = `size + currentUnit`을 적용합니다 (단위는 상태에서 가져오며 기본값은 `px`). |
| `fontSizeUnit` | `(unit: string)` | 현재 크기를 새 단위(`px`/`pt`/…)로 다시 적용합니다. |
| `foreColor` | `(color: string)` | `color`를 적용합니다. |
| `backColor` | `(color: string)` | `background-color`를 적용합니다. |
| `color` | `({ foreColor?, backColor? })` | 전경색 및/또는 배경색을 한 번의 호출로 적용합니다. |
| `insertText` | `(text: string)` | 선택(selection)을 텍스트 노드로 교체하고, 그 뒤에 커서를 모읍니다. |

## Block format / alignment

| Command | Args | Effect |
|---|---|---|
| `justifyLeft` | — | 단락을 `text-align: left`로 설정합니다. |
| `justifyCenter` | — | `text-align: center`. |
| `justifyRight` | — | `text-align: right`. |
| `justifyFull` | — | `text-align: justify`. |
| `formatPara` | — | 블록을 `<p>`로 변환합니다. |
| `formatH1` … `formatH6` | — | 블록을 `<h1>` … `<h6>`으로 변환합니다. |
| `formatBlock` | `(tag: string)` | 범용 블록 변환(기본 `'p'`) — 스타일 드롭다운(p/blockquote/pre/h1..h6)을 구동합니다. |
| `lineHeight` | `(ratio: number \| string)` | 선택된 단락에 `line-height`를 적용합니다. |
| `indent` | — | 들여쓰기합니다. |
| `outdent` | — | 내어쓰기합니다. |
| `tab` | — | 커서가 모인 표 셀 안에서는 다음 셀로 이동하고, 그 외에는 4개의 NBSP를 삽입합니다. |
| `untab` | — | 커서가 모인 표 셀 안에서는 이전 셀로 이동하고, 그 외에는 아무 동작도 하지 않습니다. |

## List

| Command | Args | Effect |
|---|---|---|
| `insertOrderedList` | — | `<ol>`을 토글/삽입합니다. |
| `insertUnorderedList` | — | `<ul>`을 토글/삽입합니다. |

## Table

| Command | Args | Effect |
|---|---|---|
| `insertTable` | `(dimStr: string)` | `"COLxROW"` 형식(예: `'3x2'`, 기본 `'1x1'`)으로 `table table-bordered` 클래스를 가진 표를 삽입합니다. |
| `addRow` | `(where?: 'top' \| 'bottom')` | 행을 추가합니다 (기본 `'bottom'`). |
| `addCol` | `(where?: 'left' \| 'right')` | 열을 추가합니다 (기본 `'right'`). |
| `deleteRow` | — | 현재 행을 삭제합니다. |
| `deleteCol` | — | 현재 열을 삭제합니다. |
| `deleteTable` | — | 감싸고 있는 표를 삭제합니다. |

## Media / link

| Command | Args | Effect |
|---|---|---|
| `createLink` | `({ url, text?, newWindow? })` | `<a>`를 생성하거나 업데이트합니다. 빈 값 / 안전하지 않은(`javascript:`/`vbscript:`/`data:`) URL은 거부합니다. `newWindow: true`는 `target="_blank"` + `rel="noopener noreferrer"`를 설정합니다. 기존 앵커는 제자리에서 편집합니다. |
| `unlink` | — | 감싸고 있는 앵커를 벗겨냅니다. |
| `insertImage` | `(src: string, filename?: string)` | `<img src>`(+ 선택적 `data-filename`)를 삽입하고, 그 뒤에 커서를 둡니다. |
| `insertVideo` | `(url: string)` | 제공자 URL을 임베드 노드로 파싱하여 삽입합니다. |
| `insertHorizontalRule` | — | `<hr>`을 삽입합니다. |
| `insertNode` | `(node: Node)` | 임의의 DOM 노드(커스텀 임베드)를 삽입하고, 그 뒤에 커서를 둡니다. |
| `resizeImage` | `(img: HTMLImageElement, value)` | `img`의 너비를 `parseFloat(value)*100%`로 설정합니다. `''`/`'none'`은 너비를 제거합니다. (선택(selection) 불필요.) |
| `floatImage` | `(img: HTMLImageElement, value)` | `img`의 CSS `float`을 설정합니다 (기본 `'none'`). (선택(selection) 불필요.) |
| `removeMedia` | `(img: HTMLImageElement)` | 주어진 이미지 노드를 제거합니다. (선택(selection) 불필요.) |

## History

| Command | Args | Effect |
|---|---|---|
| `undo` | — | 실행을 되돌립니다. (선택(selection) 불필요.) |
| `redo` | — | 되돌린 실행을 다시 적용합니다. (선택(selection) 불필요.) |

> **명령이 아닌 것** (다른 곳에서 처리됨): `escape`, `insertParagraph`, `linkDialog.show`는 명령 레지스트리가 아니라 `onShortcut` / 네이티브 처리로 라우팅되는 keyMap 메서드입니다. 코드뷰, 전체화면, 그리고 help/link/image/video 다이얼로그는 엔진 명령이 아니라 chrome 액션(`ChromeUI`: `openLinkDialog`, `openImageDialog`, `openVideoDialog`, `openHelpDialog`, `toggleFullscreen`, `toggleCodeview`)입니다.

---

## See also

- [Component & state](./reference-component.md) — props, `command()` 핸들, 그리고 `EditorState`.
- [Options & toolbar](./reference-options.md) — 어떤 툴바 항목 이름이 어떤 명령에 매핑되는지, 그리고 `keyMap` 단축키.
- [Headless & plugin API](./reference-api.md) — `definePlugin` / `registerCommand`로 직접 만든 명령을 등록하기.
