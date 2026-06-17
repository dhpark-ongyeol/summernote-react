# Summernote → React + TypeScript 포팅 계획서

> jQuery 기반 vanilla summernote(현 코드베이스, 루트 `CLAUDE.md` 참조)를 **문서 모델 기반 React + TypeScript 에디터**로 전면 재구축하는 체계적 계획. 13개 설계 에이전트(코어 아키텍처 3제안 + 심사 + 서브시스템 8 + 로드맵 종합)의 결과를 종합했다.

## 0. 확정된 제약 (사용자 결정, 2026-06-17)

| 축 | 결정 |
|---|---|
| 편집 코어 | contentEditable + `document.execCommand` 직접 수술 폐기 → **문서 모델 기반 재구축** |
| jQuery | **완전 제거** (0 의존) |
| 언어 | **TypeScript strict** |
| 공개 API | **프레임워크 비종속 헤드리스 코어 + `useSummernote()` 훅 + controlled `<SummernoteEditor>` 컴포넌트** |
| v1 범위 | **완전 패리티** — 4테마(lite/bs3/bs4/bs5) + 22모듈 전 기능 + 플러그인 + i18n 50+ 로케일 |

## 1. 핵심 아키텍처 결정 — ProseMirror 기반 엔진

### 1.1 수렴된 결론

3개 코어엔진 제안(ProseMirror / Lexical / from-scratch)을 독립 설계 후 심사한 결과:

- **from-scratch는 세 제안 모두 기각.** IME/selection/composition은 가장 버그가 잦은 영역으로, 10~20k LOC를 새로 써서 v1 안에 패리티 안정성에 도달하기 불가능.
- 진짜 갈림길은 **ProseMirror vs Lexical**. **ProseMirror 채택** — 결정타는 **테이블**. summernote의 `TableResultAction`(virtual-cell 매퍼)은 가장 취약한 모듈인데, `prosemirror-tables`가 colspan/rowspan + CellSelection을 가장 검증된 형태로 제공한다. `@lexical/table`은 이 지점이 약하다.
- IME/beforeinput/paste/selection 매핑/invertible undo는 두 엔진 모두 충분히 잘 해결.

**채택 스택**: `prosemirror-model` / `-state` / `-transform` / `-view` / `-history` / `-commands` / `-keymap` / `-inputrules` / `-gapcursor` + `prosemirror-tables` + `prosemirror-schema-list`. **published 패키지를 pin해서 의존**(vendoring/fork 안 함). **Tiptap은 채택 안 함**(Tiptap이 React API를 강제하므로 — 우리는 자체 React 레이어를 설계).

### 1.2 근본 패러다임 전환

| 현재 (jQuery summernote) | 포팅 후 (ProseMirror 코어) |
|---|---|
| contentEditable HTML이 SSOT | **선언적 Schema + 불변 doc 트리가 SSOT** |
| `dom.js` 60+ predicate (`isPara`/`isCell`…) | **노드/마크 타입 동일성 검사** |
| `range.js` `WrappedRange{sc,so,ec,eo}` + offset-path bookmark | **정수 position 기반 model selection** (Text/Node/Cell/GapCursor) |
| `dom.splitTree`/`splitNode` 직접 수술 | `prosemirror-transform`의 invertible **Step** |
| `document.execCommand` | `(state,dispatch,view)=>boolean` **command** |
| `History.js` HTML 스냅샷 + bookmark | `prosemirror-history` (역(inverse) Step) → stale-bookmark 류 버그 구조적 제거 (#4720/#4780 부류) |
| `context.invoke('module.method')` | `core.command(name, ...args)` **command registry** (resolution order 동일 보존) |
| ZERO_WIDTH_NBSP bogus-span(커서 포맷) | **storedMarks** |
| 한국어 조합 스냅샷 hack + `isLimited` | `filterTransaction`(composition-safe `maxTextLength`) |
| React가 contentEditable 내부를 렌더 (충돌) | **PM이 editable 서브트리를 소유**, React는 그것을 **opaque leaf**로 취급 (절대 재렌더 안 함) |

### 1.3 3개 GRAFT (summernote 고유성 보존)

PM 표준을 그대로 쓰면 깨지는 3가지를 다른 제안의 강점으로 보완:

1. **GRAFT 1 — span-faithful 직렬화** (Lexical 제안에서): PM의 range-mark 모델은 명령/선택엔 옳지만 summernote의 정확한 `<span>` 중첩을 그대로 내보내지 않는다. → **직렬화 경계에서만** 커스텀 `DOMSerializer`를 작성해 `Style.styleNodes`의 span 출력을 재현(인접 동일 마크 병합 + 결정적 마크 중첩 순서: link 최외곽 → strong/em/u/s/sup/sub → fontFamily>fontSize>color>backgroundColor 최내곽). 모델은 range-marks 유지(깔끔한 `toggleMark`/`storedMarks`), **바이트 출력만 summernote 모양에 pin**. → `code()` 바이트 안정성 확보(=controlled 컴포넌트 clobber 방지의 전제).
2. **GRAFT 2 — permissive schema + `raw_html` passthrough** (from-scratch 제안에서): strict schema가 "허용되던 레거시 HTML을 로드 시 청소"하는 소비자 가시 동작변경을 막기 위해, **sanitize됐지만 해석 불가한 마크업을 보존하는 `raw_html` 노드**를 둔다. → `code(html)` setter가 마크업을 조용히 버리지 않음. Sanitize(`codeviewFilter` regex + iframe whitelist)는 **parseDOM 이전 pre-pass**로 실행 — 보안 계약 불변.
3. **GRAFT 3 — React-atom-as-opaque-leaf NodeView** (from-scratch 제안에서, A보다 날카롭게): image/video/table chrome(8 resize handle, float 컨트롤, 팝오버)는 **detached root의 React 컴포넌트**로 렌더하고 PM NodeView 안에 마운트 — PM은 내부를 black box로 취급. → **모든 UI를 React 단일 기술로** 유지하되 React는 텍스트 hot path를 절대 건드리지 않음. placeholder/hint/팝오버 위치는 PM `Decorations` + `view.coordsAtPos`로 (`rect2bnd`/`getBoundingClientRect` 수학 대체).

## 2. 문서 모델 스키마 (SSOT 초안)

> 단일 `schema.ts`(`new Schema({nodes, marks})`)가 `dom.js`의 60+ predicate를 대체한다.

**블록 노드**
- `doc` (content `block+`)
- `paragraph` — attrs `{align?, lineHeight?, marginLeft?}` → 단일 `style=` 문자열로 직렬화 (= `isPurePara`/`stylePara`)
- `heading` — attrs `{level 1..6, align?, lineHeight?, marginLeft?}` (= styleTags h1-h6, formatH1..6)
- `blockquote` — content `block+`, 중첩 가능 (`blockquoteBreakingLevel` 0/1/2 구동)
- `code_block` — content `text*`, `marks:''` (`<pre>`, 인라인 서식 없음)
- `horizontal_rule` (leaf)
- `bullet_list` / `ordered_list`(attrs `{start}`) / `list_item`(content `paragraph block*`, attrs `{align?, marginLeft?}`) — `prosemirror-schema-list`
- `table` / `table_row` / `table_cell` / `table_header` — `prosemirror-tables` (cell attrs `colspan/rowspan/colwidth`) → `editing/Table.js` + `TableResultAction` 통째 대체
- `raw_html` (atom block, attrs `{html}`) — **GRAFT 2 passthrough**

**인라인 노드**: `text`, `hard_break`(BR; `<p><br></p>`는 schema/view fill이지 저장 콘텐츠 아님), `image`(inline atom; attrs `src/alt/width/style/data-filename/float`; `note-float-left/right`), `video`(inline atom; parseDOM에서 `codeviewIframeWhitelistSrc` 강제)

**마크** (range-applied; 커스텀 serializer가 span 중첩 pin): `strong`/`em`/`underline`/`strikethrough`/`superscript`↔`subscript`(상호배타)/`link`(href,target,rel) + 파라미터화 스타일 마크 `fontFamily`/`fontSize`(value,unit px|pt)/`color`/`backgroundColor` → `<span style>`

> **핵심 원칙**: block-level `text-align`/`line-height`/`margin-left`는 **마크가 아니라 노드 attr**(inline style로 직렬화). `code()` 바이트 비교 가능성을 위해 의도적으로 일반 style 노드를 쓰지 않음.

## 3. 모노레포 / 패키지 구조

> pnpm workspaces + Turborepo, TypeScript strict(composite project refs). 현 단일 `summernote` IIFE 4번들 → 독립 버저닝되는 tree-shakable ESM+CJS+types 패키지로 분할.

```
packages/
  core/         @summernote/core — PM 엔진. schema/(nodes,marks,blockStyleAttrs,index)
                serialize/summernoteDOMSerializer(GRAFT1), parse/(sanitize,parseDOM GRAFT2)
                commands/(registry+inlineMarks/styleMarks/blocks/lists/enter/tables/link/media/structure)
                inputrules, keymap, SummernoteCore(host), options(deepmerge), events(typed EventEmitter)
                state/chromeStatePlugin(useSyncExternalStore snapshot), plugin/(types/assemble/context/
                command-registry/react-node-view), i18n/(I18n + en-US SSOT). tsup dual, sideEffects:false
  react/        @summernote/react — SummernoteEditor.tsx(controlled/uncontrolled+imperative handle),
                useSummernote.ts, SummernoteContext.tsx(per-instance {core,theme,i18n}),
                hooks/, primitives/(Button/Dropdown/ColorPalette/TableDimensionPicker/Modal/Popover/…),
                buttons/(registry+~40 builtins), components/(ToolbarRenderer+dialogs/+popovers/), ssr.ts.
                peerDeps react/react-dom/@summernote/core
  core-utils/   env, async(native Promise), fn(combinators+deepmerge/debounce/clusterBy/rect2bnd),
                dom-helpers(chrome bounds/parseFragment), keymap-codes. 0 runtime deps, ESLint 'jquery' ban
  icons/        @summernote/icons — scripts/build-fonts.js(prebuild) → woff2/woff(+ttf/eot) + icons.css
  theme-core/   공통 SCSS(common/elements) → css, depends icons
  theme-{lite,bs3,bs4,bs5}/  per-theme SCSS→style.css/.min.css + React chrome 컴포넌트셋
  i18n/         50+ typed LocaleModule(codegen from public/lang/*) + per-locale subpath exports + manifest
  plugin-{hello,databasic,specialchars}/  typed plugin descriptor (peerDep core)
  standalone/   UMD/IIFE CDN 번들(core+react+react-dom+theme-lite) + release zip
test/
  golden/       레거시 빌드에서 추출한 불변 oracle 코퍼스(JSON) + parity-allowlist.json
  {unit,view,react,e2e,parity}/ + setup/matchers.ts  — 5-tier + parity runner + normalize.ts
root: pnpm-workspace.yaml, turbo.json, tsconfig.base.json, vitest.workspace.ts,
      playwright.config.ts, .changeset/, scripts/{banner.ts,extract-golden.js,i18n-migrate.mjs,parity-gate.js}
```

## 4. 서브시스템별 포팅 전략

### 4.1 문서 모델 스키마 + 명령 세트 (XL) — 편집 엔진의 심장
`Editor.js` + `editing/*` + `dom/range` 수술을 대체. ~60개 타입드 command, 커스텀 span serializer, sanitizer, keymap, inputrules.

| 현재 | 대체 |
|---|---|
| `editing/Table.js` + `TableResultAction` | **DROP** → `prosemirror-tables` (최대 리스크 감소) |
| `editing/Bullet.js` | `wrapInList`/`liftListItem`/`sinkListItem` + 비리스트 para는 `marginLeft` attr |
| `editing/Typing.js` `insertParagraph` | `commands/enter.ts` chainCommands (blockquote breaking, li-escape) |
| `editing/Style.js` styleNodes/current | 마크(`toggleMark`) + 블록 attr + GRAFT1 serializer; `queryCommandState` → EditorState에서 읽기 |
| `editing/History.js` | `prosemirror-history` (`newGroupDelay`≈recordEveryKeystroke, depth≈historyLimit) |
| execCommand bold/italic/justify… | `toggleMark`/`setBlockType`/`setMark`; bogus-span → storedMarks; isLimited → filterTransaction |
| `Codeview.purify` regex | **REUSE-as-TS** → `parse/sanitize.ts` (parseDOM 전 pre-pass) |
| `settings.js` keyMap / styleTags / colors… | **데이터로 그대로 소비** |
| `dom.js`/`range.js` 편집 두뇌 | **DROP** (schema 동일성 + PM position/transaction이 흡수) |

키맵: `keyMap.pc/mac`를 `prosemirror-keymap`이 직접 소비. ENTER = chainCommands[empty-li escape, blockquote break(level), splitListItem, heading/pre→p, splitBlock]. TAB = 셀 네비 vs indent 컨텍스트 디스패치. `options.shortcuts===false`면 keymap plugin 생략.

### 4.2 React 통합 (XL) — 헤드리스 코어 + 훅 + 컴포넌트
`summernote.js`($.fn) + `Context.js`를 3계층으로:
- **Layer 1 헤드리스 `SummernoteCore`** (0 React, 0 jQuery): Schema/EditorView/plugin set/CommandRegistry 소유. `core.command(name,...args)`가 `Context.invoke` resolution order를 정확히 재현(bare→core methods 우선, 그다음 editor group, 그다음 `module.method` 키). `getHTML`/`setHTML`이 **`code()` 계약 보존**(codeview 분기, host textarea 미러, `onChange` fire, codeview-open getter 모호성까지). `deepmerge`가 `$.extend` 대체 + **top-level shallow merge footgun 수정**(callbacks/keyMap/popover deep merge, `mergeStrategy` escape hatch).
- **Layer 2 `useSummernote(options)`**: `useLayoutEffect`로 client-only mount, `useSyncExternalStore(core.subscribe, core.getSnapshot)`로 **chrome만 재렌더 / editable DOM은 절대 재렌더 안 함**. 비구조적 옵션 변경은 `core.updateOptions()`(remount 없이).
- **Layer 3 `<SummernoteEditor value onChange options theme disabled lang>`**: controlled는 incoming value를 `core.getHTML()`과 **정규화 동일성**으로 비교(raw string 아님)해 진짜 다를 때만 적용 → **controlled-contentEditable clobber 방지**. uncontrolled는 `defaultValue` 1회. `forwardRef` + `useImperativeHandle`로 타입드 handle(`getHTML/setHTML/focus/enable/disable/reset/command(...)`).

**구조적 수정**: 전역 `$.summernote.ui` 폐기 → **테마는 per-instance React context** → 서로 다른 테마의 N개 에디터 공존(현 "last-theme-wins" 깨짐 해결). 콜백 `this=$note[0]` 바인딩은 **의도적 제거**(strict, 타입드 payload). `AutoSync`는 별도 모듈 없이 `setHTML`/`onChange` host-mirror에 흡수. SSR: sanitized 정적 placeholder + `useLayoutEffect` client mount(host는 leaf, `suppressHydrationWarning`).

### 4.3 React UI 컴포넌트 라이브러리 (XL) — chrome
`renderer.js` + `ui_template`(25메서드) + 4 테마 팩토리 + lite의 DropdownUI/ModalUI/TooltipUI를 React 컴포넌트로. **요구**: ① `.note-*` DOM/class 계약 그대로 재현(기존 SCSS·아이콘 webfont 무수정 동작) ② 모든 액션을 `core.command()`로 ③ format 상태를 `useSyncExternalStore`로 EditorState에서 reactive하게 읽기(`updateCurrentStyle` 폴링 제거) ④ per-instance 테마 ⑤ `[group,[buttons]]` config 공개 API 유지. ~40 버튼 + 13 primitive + 4 테마 맵 + 8 다이얼로그/팝오버. 다이얼로그는 `core.openDialog(<Comp/>):Promise`(saveRange/restoreRange → state.selection 스냅샷). 표준 Modal/Tooltip은 **Bootstrap JS 없이** 동작.

### 4.4 jQuery 제거 맵 + core-utils (M)
`core/*`를 4가지 운명으로 분류:
- **SUPERSEDED-BY-MODEL (삭제)**: `range.js` 전체(WrappedRange, IE TextRange, bookmark, splitText/deleteContents/insertNode/pasteHTML, getWord*Range), `dom.js` tree-surgery + boundary-point(splitNode/splitTree, prev/nextPoint, makeOffsetPath…). → PM position/Selection/Step.
- **RELOCATED-TO-SERIALIZATION (런타임 삭제, 지식은 이동)**: 노드 분류 predicate(isPara/isInline/isList/isCell…), blankHTML/emptyPara → schema parseDOM 규칙 + GRAFT1 serializer.
- **KEPT-AS-TS**: `env.ts`(IME/font probing; `inputEventName`/`isW3CRangeSupport` 삭제), `key.js`→`keymap-codes.ts`(code↔name만), `async.ts`(native Promise), `func.js`→`fn.ts`(combinators + uniqueId/debounce/deepmerge/isValidUrl/clusterBy/rect2bnd).
- **DROPPED-FOR-STDLIB**: `lists.js` head/tail/find/all/contains… → `Array.prototype`/`Set`. `clusterBy`만 유지.

jQuery idiom→native 표: `$.fn.summernote`→React/Core, `$.extend(true)`→`deepmerge`, `$.each`→`for...of`, `$.Deferred`→`Promise`, `$(el).on/off/trigger`→`addEventListener`+`AbortController` & 코어 EventEmitter, PM editable 이벤트는 `handleDOMEvents`/`handleKeyDown`/`handlePaste`로(→ `inputEventName` IME workaround 삭제), `offset()`/`rect2bnd`→`coordsAtPos`/`getBoundingClientRect`. **신규 패키지에 `import 'jquery'` 0개 — ESLint `no-restricted-imports` + CI grep 게이트로 1일차부터 강제.**

### 4.5 플러그인 시스템 (L)
전역 `$.summernote.plugins` + module 레지스트리 + `context.memo` + `$.Deferred` 다이얼로그 → **타입드 선언적 `SummernotePlugin` descriptor**(per-instance `options.plugins`, 전역 없음). 기여 슬롯: `schema`(노드/마크) / `commands` / `keymap` / `inputRules` / `pmPlugins` / `nodeViews`(React-atom) / `ui`(toolbar/popover/dialog React) / `i18n` / `options` / `lifecycle`. `PluginContext`(jQuery-free): `{core, command(), getHTML/setHTML, state, on(), openDialog(reactNode):Promise<T>, t(), options, view}`. databasic의 `<data>` raw DOM 노드 → **진짜 schema 노드 + React node view**. 충돌 정책: 빌트인 먼저 등록, 빌트인 override는 `override:true` 명시(현 "조용한 덮어쓰기" footgun 수정). 빌트인 코어 모듈을 같은 descriptor로 dogfood해 충분성 검증. 마이그레이션 가이드 + databasic 완전 샘플.

### 4.6 i18n (M)
전역 `$.summernote.lang` + `$.extend(true)` → 타입드 per-instance code-split i18n. en-US가 `as const` SSOT, `Messages = DeepReadonly<typeof enUS>`, `PartialMessages = DeepPartial`(부분 로케일 허용, 오타는 컴파일 에러). `resolveCatalog(enUS, locale, ...plugin)` deep-merge로 **en-US fallback-base 계약 재현**(ko-KR 등 부분 로케일 back-fill). 로케일은 `import()` code-split(각 ~3KB chunk). 호출부 `this.lang.link.url` dotted access는 **무수정 유지**(패리티). **codemod**(`i18n-migrate.mjs`)가 `$`/`jQuery` stub으로 47개 레거시 IIFE를 타입드 ESM 모듈로 일괄 변환 + manifest 생성. 골든 테스트: 각 로케일 `resolveCatalog` 출력이 레거시 `$.extend(true)` 출력과 deep-equal.

### 4.7 빌드 / 패키징 / 배포 (L)
Vite lib(SCSS 테마) + tsup(core/react/i18n/plugins, dual ESM+CJS+dts) + `vite-plugin-dts`. **jQuery external → react/react-dom/@summernote/core external + prosemirror-*는 일반 dep**(번들러 dedupe, externalize 안 함 — dual-package hazard 주의). `sideEffects:false`(테마 CSS만 `['*.css']`). webfont 파이프라인(`build-fonts.js`)은 거의 그대로 `@summernote/icons`로 이전. types-first conditional exports map. Changesets로 독립 버저닝/배포. standalone UMD 번들 + release zip 유지(기존 CDN 사용자). attw + publint + tree-shaking smoke test를 CI 게이트로.

### 4.8 테스트 / 패리티 검증 (XL) — 전체 포팅의 검증 백본
**5-tier 피라미드 + 골든 코퍼스 oracle**:
- **Tier 0 골든 추출**: 현 jQuery 빌드를 `test/base/**/*.spec.js`로 돌려 `{inputHTML, action, expectedHTML, expectedSelection}`를 `test/golden/*.json`(불변 oracle)으로 캡처. 추출기는 먼저 레거시 spec을 self-check해 신뢰 확보.
- **Tier 1 순수 유닛(Node)**: schema round-trip, serializer span-grouping(style.spec 시드), Step invertibility(property-based), command outcomes, tables cell-mapper(Table.spec 시드), sanitizer(Codeview.purify 시드), raw_html.
- **Tier 2 view/contentEditable(Vitest browser, Chrome)**: EditorView mount, beforeinput, selection 매핑, coordsAtPos, **IME/composition**(한글/CJF dup/drop 0, 1 undo/composition), **paste sanitization**, **undo correctness**, maxTextLength mid-composition.
- **Tier 3 React(RTL)**: controlled no-clobber, useSyncExternalStore(chrome 재렌더/editable 안정), multi-theme 공존, SSR hydration.
- **Tier 4 E2E + 시각(Playwright)**: 키보드 여정 골든 대조, 4테마 스크린샷 baseline(현 빌드 캡처) 픽셀-diff.

**수락 게이트**(`parity-gate.js`): 골든 레코드 100% 통과 **또는** 리뷰된 `parity-allowlist.json`에 정당화와 함께 등재(미리뷰 diff 0). 레거시가 인코딩한 구현 세부(bogus-span fontSize HTML)는 'parity'가 아닌 '의도적 동작변경'으로 재분류 후 새 기댓값 명시.

## 5. 단계별 로드맵

| Phase | 제목 | 목표 | 종료 기준(요약) | 의존 |
|:--:|---|---|---|:--:|
| **0** | 모노레포 골격 + 골든 oracle + thin 수직 슬라이스 | strict-TS workspace, **신규 코드 작성 전** 레거시 동작을 불변 oracle로 동결, 가장 위험한 코어 경로(EditorView mount→type→serialize→IME) end-to-end 증명 | `turbo build typecheck lint` green, jQuery import lint 통과; 골든 추출기 self-check 통과; 슬라이스가 실브라우저에서 타이핑·bold/italic round-trip·한글 조합 무손실; attw/publint clean | none |
| **1** | Schema SSOT + span-faithful serializer + sanitizer (**패리티 백본**) | 전체 Schema 완성, `code()` 바이트 충실도를 serializer에 pin(GRAFT1), 보안 계약을 pre-parse sanitizer에 pin(GRAFT2) | 골든 parse→serialize 바이트 동일(또는 allowlist, 미리뷰 0); sanitizer가 모든 purify fixture 재현 + 모든 ingress 경로에서 pre-parse 증명; 모든 노드/마크 parseDOM↔toDOM round-trip | 0 |
| **2** | 명령 레지스트리 + keymap + inputrules + history (**편집 엔진**) | ~60 command, settings.js keyMap 바인딩, history/inputrules — Editor.js+editing/* 대체 | 모든 keyMap 엔트리가 command로 해결+레거시 동작; 골든 editor/typing/table/links 통과; undo가 정확한 이전 HTML+selection 복원, IME 조합=1 undo; bogus-span 류 assertion은 의도적 변경으로 재분류 | 1 |
| **3** | 헤드리스 코어 API + options + events + i18n 엔진 | `SummernoteCore` 공개 계약(code/enable/disable/reset/destroy/focus, 18-콜백) + per-instance i18n | getHTML/setHTML이 `Context.code()` 정확 재현(codeview 모호성·textarea 미러·change); 18콜백 정확 발화; deepmerge가 레거시 `$.extend(true)` 일치(의도적 top-level 변경 제외); 47 로케일 마이그레이션+strict 통과 | 2 |
| **4** | React chrome primitive + per-instance 테마 + 훅/컴포넌트 | 컴포넌트 라이브러리(primitive/~40버튼/ToolbarRenderer/다이얼로그/팝오버) + controlled `<Summernote>` + `useSummernote()` | 4테마 byte-equiv `.note-*` DOM(골든 스냅샷); 다른 테마 2 에디터 공존(last-theme-wins 회귀 통과); controlled no-clobber + editable 안정; 전 툴바/팔레트/다이얼로그/팝오버/resize handle 동작; Bootstrap JS 없이 modal/tooltip | 3 |
| **5** | 플러그인 + node-view + 패키징/배포 + 완전 패리티 게이트 | 타입드 plugin API(빌트인 dogfood), image/video/table React node-view(GRAFT3), 멀티패키지 배포, v1.0 수락 게이트 | 3 레퍼런스 플러그인이 jQuery/execCommand 없이 표현; 골든 100% 통과(또는 allowlist); 4테마 시각 baseline; 전 패키지 attw/publint/tree-shaking clean; Changesets 배포 — **v1.0 게이트 통과** | 4 |

### 마일스톤 게이트
- **v0.1 (Phase 2 종료)**: 헤드리스 코어가 전체 schema로 실브라우저 mount, 전 keyMap 바인딩, bold/heading/list/link/table/blockquote/undo 동작, 골든 parse→serialize 바이트 동일, sanitizer 검증, IME+maxTextLength 무손실. **React·테마 없음 — 편집 심장이 모델 레벨에서 패리티 증명.**
- **v0.5 (Phase 4 종료)**: 공개 React 표면 사용 가능 — controlled `<Summernote>` + 훅 + imperative handle, 18콜백, per-instance i18n(47 로케일), 4테마 byte-equiv, 전 툴바/팔레트/다이얼로그/팝오버/resize, 다른 테마 공존, no-clobber. **React 앱이 주류 용도로 레거시 summernote 대체 가능.**
- **v1.0 (Phase 5 종료)**: 완전 패리티 — 플러그인 시스템(3 레퍼런스+dogfood+가이드), image/video/table node-view, 멀티패키지 배포(clean attw/publint/tree-shaking), Changesets. 골든 100% 통과(미리뷰 diff 0), 시각 baseline, 전 IME/paste/undo 통과, 게이트가 회귀 차단.

## 6. 의존성 / 순서 제약 (핵심)
- **Schema(Phase 1)는 전 상류 의존** — command/serializer/parser/node-view/plugin/getHTML 전부가 노드/마크 spec 참조. schema·toDOM/parseDOM 동결 전엔 하류 안정 불가.
- **골든 oracle(Phase 0)은 신규 코드 존재 전에 추출** — 아니면 불변 기준이 없어 패리티 주장이 순환. 추출기는 레거시 spec self-check 필수.
- **GRAFT 1(serializer)은 Phase 1에 골든 diff 테스트와 함께 착지** — 이후 모든 패리티 단언이 바이트 안정 parse→serialize에 의존.
- **Sanitize(GRAFT 2)는 parseDOM 이전, 모든 ingress 경로(setHTML/pasteHTML/video parse)** — 한 경로라도 빠지면 script/iframe 주입 재오픈. Phase 1 보안 불변식.
- **command resolution order는 Phase 2에 한 번 고정** 후 core.command/imperative handle/plugin command가 동일 소비.
- **prosemirror-*는 일반 dep(externalize 금지)** — dual-package hazard(두 prosemirror-model 인스턴스 instanceof 깨짐)를 Phase 0부터 attw/publint로 게이트.

## 7. 리스크 레지스터

| 리스크 | 영향/확률 | 완화 |
|---|---|---|
| GRAFT1 바이트 충실도: PM range-mark가 span 중첩 미재현 → code() 드리프트 → controlled clobber | 高/高 | Phase 1에 serializer + 골든 diff를 hard gate; controlled에서 canonical PM doc 비교(문자열 아님); allowlist cap+sign-off |
| strict schema가 로드 시 레거시 HTML 청소(동작변경) | 高/中 | `raw_html` passthrough(GRAFT2); 의도적 정규화 break 문서화; 코퍼스에 raw_html round-trip |
| IME/composition + maxTextLength(filterTransaction) = 레거시 최취약부 | 高/中 | Phase 0 슬라이스+Phase 2 전용 IME 스위트; Vitest browser flaky 시 Playwright 결정적 스크립팅; 1-undo/composition 단언 |
| 레거시 spec이 폐기된 구현 세부(ZERO_WIDTH_NBSP) 인코딩 → 의도변경/회귀 혼동 | 中/高 | Phase 2에 'parity'→'의도적 변경' 명시 재분류, 정당화 allowlist |
| ProseMirror dual ESM+CJS: dual-package hazard / CJS named-export interop | 高/中 | prosemirror-* dedupe dep; Phase 0부터 attw+publint; CJS 수요 낮으면 ESM-only core |
| per-instance React 테마가 전역 `$.summernote.ui` + ui_template 폐기(소비자 hard break) + 4테마 `.note-*` DOM 패리티 면적 | 中/高 | 레거시 `ui_template().render()` 골든 DOM 스냅샷; CSS는 전역 유지/컴포넌트셋만 per-instance 문서화 |
| 기존 UMD 플러그인 미로드(생태계 churn), strict schema가 custom-DOM 플러그인 거부 | 中/高 | 타입드 descriptor + databasic 완전 샘플 + 매핑 표; compat shim은 v1 범위 밖 명시 |
| 교차테마 시각 스냅샷 brittle / 추출기 충실도 | 中/中 | 픽셀-diff threshold + 동적영역 마스킹 + CI Chrome pin; 추출기 self-check 선행 |
| `dom.js`/`range.js`의 수년치 contentEditable quirk 수정 누락 위험 | 高/中 | 망라적 골든 HTML+selection 코퍼스; per-symbol 운명 인벤토리(무손실); jQuery import lint 차단 하에 lazy 마이그레이션 |

## 8. 첫 2주 (즉시 착수)
1. 리포를 pnpm workspace로 전환: `pnpm-workspace.yaml`, root `package.json` + `turbo.json`(build dependsOn ^build), `tsconfig.base.json`(strict, composite, exactOptionalPropertyTypes), 공유 eslint/prettier; **`jquery` import 금지 ESLint + CI grep 게이트를 commit 1부터.**
2. `scripts/banner.ts`(banners + version를 vite.config.js에서 이전); 레거시 `summernote@0.9.1` 빌드를 추출기용으로 in-repo pin.
3. `scripts/extract-golden.js`: 현 jQuery summernote + lite를 로드해 `test/base/{module/Editor,editing/style,editing/Typing,editing/Table,module/Codeview}.spec.js`의 단언을 replay → `{inputHTML,action,expectedHTML,expectedSelectionPath}` JSON; **레거시 spec self-check 선행**.
4. `@summernote/core-utils` 포팅(env/async/fn/keymap-codes/dom-helpers) + tier-1 유닛; deepmerge가 langInfo/icons에서 레거시 `$.extend(true)` 일치 단언.
5. `@summernote/core`에 prosemirror-* 추가; **최소 schema**(doc/paragraph/text/strong/em/hard_break) + first-cut `summernoteDOMSerializer` + 실 EditorView를 mount하는 `SummernoteCore`; dual-format attw/publint clean 확인.
6. **thin 수직 슬라이스**: client-only `<Summernote>` 렌더, 타이핑·bold/italic 토글·getHTML round-trip 단언; `vitest.workspace.ts`(unit-node+browser+react) 와이어.
7. **Phase-0 IME smoke 스위트**: 스크립트된 한글 compositionstart/update/end, dup/drop 0 단언 — 최고 리스크 표면을 아키텍처 확정 전에 front-load.
8. `parity-runner.spec.ts` + `normalize.ts`(안정 attr 순서, PM-fill `<p><br></p>` 규칙, lowercase tag) stub을 최소 슬라이스에 돌려 oracle→replay→정규화 동일성 루프를 코퍼스 확대 전 증명.

## 9. 사용자 비준 필요 결정 (착수 전)

1. **ProseMirror 채택 vs from-scratch vs Lexical** — 권고: **ProseMirror**(from-scratch는 전 제안 기각; tables가 결정타). *“문서 모델 재구축”을 ProseMirror 기반으로 해석함 — 자체 엔진을 원했다면 재논의 필요.*
2. **`code()` 바이트 패리티가 v1 hard 요구인가, 정규화/의미 동일성으로 충분한가** — 이 답이 노력을 크게 좌우(바이트 = 커스텀 serializer + 골든 코퍼스 강제 / 의미 = 완화). 권고: 마크 모델은 range-marks, 바이트는 serializer에 pin.
3. **`code()` fidelity 정책**: permissive schema + `raw_html` passthrough(로드 시 조용한 청소 방지). 로드 시 일부 정규화 허용 여부 비준.
4. **React 경계**: React=chrome only, PM=editable opaque leaf, image/video/table chrome은 PM NodeView 안 React. React가 editable contentEditable을 절대 렌더 안 함 비준.
5. **플러그인 호환**: 기존 UMD `$.summernote.plugins`는 무수정 미동작. 새 plugin 계약 + compat shim/migration guide의 v1 범위 여부 비준.
6. **테마 아키텍처**: per-instance React context(전역 `$.summernote.ui` 싱글톤 폐기). multi-editor 깨짐 수정하나 테마가 ui_template 팩토리가 아닌 React 컴포넌트셋이 됨 — 이 break 비준.
7. **의존 자세**: prosemirror-* published pin 소비(~10 패키지) vs 유지보수 자율성. Tiptap 비채택 비준.

## 10. 미해결 질문 (설계 진행하며 해소)
- byte-for-byte `code()` 패리티가 hard 요구인가? (노력 최대 레버)
- v1이 기존 커뮤니티 UMD 플러그인을 무수정 실행해야 하나, 문서화된 마이그레이션으로 충분한가?
- 실제 소비자가 블록에 넣는 inline CSS가 얼마나 임의적인가? (text-align/line-height/margin-left 넘어서면 node-attr 확장 또는 raw_html 필요)
- Air mode 완전 패리티가 v1 범위인가? coordsAtPos 팝오버 위치 타이밍이 현 UX와 맞는가?
- Codeview 에디터: CodeMirror 유지(현재)하고 PM view와 swap + close 시 re-parse — flush-on-read/onChangeCodeview 시맨틱 정확 일치 확인.
- controlled-value 정규화 동일성의 canonical normal form(공백 차이로 인한 cursor-jump 방지)?
- SSR 범위: 정적 HTML placeholder + client-only mount로 충분한가, Node-side 모델 직렬화가 필요한가?
- i18n: 50+ 로케일이 React chrome label + command/help 텍스트를 구동 — 타입드 TS 모듈 이관 + exact-key 로드(no partial match, en-US fallback) 확인.

---
*이 계획서는 13개 설계 에이전트(코어 3제안 + 심사 + 서브시스템 8 + 로드맵)의 종합 산출물이다. 현 코드베이스 지도는 루트 [CLAUDE.md](../CLAUDE.md).*
