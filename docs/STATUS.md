# 포팅 현황 (STATUS) — react-ts-port 브랜치

> jQuery summernote → React + TypeScript 자체엔진 포팅의 **현재 상태 + 실행법 + 다음 단계**.
> 설계 SSOT는 [PORTING-PLAN.md](PORTING-PLAN.md), 코드 지도는 루트 [CLAUDE.md](../CLAUDE.md).

## 한눈에

- 브랜치 `react-ts-port` (main에서 +42 커밋, **미푸시**).
- **🎉 Phase 3 + Phase 4 완료 (v1 범위).** 29 spec 파일 전부 green (chromium + webkit), **615 테스트 실행 0 실패**, typecheck strict 클린. **core·react 둘 다 tsup 빌드 성공(ESM+CJS+.d.ts)**.
- **외부 editor/runtime 의존 0, jQuery 0, `document.execCommand` 0.**
- **Phase 3 (v0.5, lite 풀패리티)**: 툴바 + 드롭다운(style/font/size/unit/lineheight/para/color/table) · 다이얼로그(link/image/video/help) · 팝오버(link/image/table) + 이미지 리사이즈 handle · fullscreen/codeview/statusbar/placeholder · 키보드 단축키 · 플러그인 API + imperative handle.
- **어드버서리얼 리뷰(24 에이전트) → 확인된 15 결함 전부 수정**: **codeview XSS 게이트(codeviewFilter 이식 — §9 하드요구)**, link scheme allowlist, createLink 텍스트편집/blockquote 역변환, ownsRange 가드, ZWNBSP 누수, env FxiOS, 팝오버 위치 추적 등.
- **Phase 4 (v1)**: bs3/bs4/bs5 테마(per-instance, 공존) · **46 로케일**(생성 스크립트로 레거시 이식) + lang prop · specialchars/databasic 플러그인 · **air mode**(선택영역 플로팅 툴바, visualViewport 좌표, 모바일 below) · Pointer Events 터치(statusbar/handle).
- 테마 CSS: lite `@summernote/react/styles.css` + `themes/{bs3,bs4,bs5}.css`.

## 실행법

```bash
yarn install                              # Yarn v1 workspaces
yarn workspace @summernote/core typecheck # + @summernote/react typecheck
yarn lint:no-jquery && yarn check:deps    # jQuery-ban + zero-dep 게이트
node_modules/.bin/vitest run              # 전체 테스트 (chromium + webkit)
node scripts/extract-golden.mjs           # 골든 코퍼스 재기록 (레거시 빌드 필요)
```

> ⚠️ 전체 `vitest run`이 하네스에서 자동 백그라운드 전환되며 출력이 비는 글리치가 있음 — 그 경우 `TaskStop` 후 포그라운드 재실행(warm 캐시라 빠름).

## 구조

```
packages/core   @summernote/core — 헤드리스 엔진, 런타임 의존 0 (tsup ESM+CJS+dts)
  src/core/     func lists env key dom range            (1:1 이식, jQuery-free)
  src/editing/  Style Typing Bullet Table History       (1:1 이식)
  src/EditorCore.ts  자체 명령 레지스트리 + IME 상태머신 + EditorState
packages/react  @summernote/react — useSummernote() + <SummernoteEditor> (react peer)
test/           jQuery-free 하네스(util/setup/매처) + 골든 oracle(commands.json) + freeze-guard
scripts/        check-no-jquery · check-no-runtime-deps · extract-golden
.github/workflows/port-ci.yml  install → gates → typecheck → playwright chromium+webkit → vitest
```

## 완료 (검증됨, 양 엔진)

| 영역 | 내용 |
|---|---|
| **Phase 0** 인프라 | 모노레포 · vitest3+Playwright(chromium+webkit) 멀티엔진 게이트 · jQuery-free 매처 · jQuery-ban/zero-dep CI · **골든 oracle**(레거시 execCommand 출력 동결) + freeze-guard |
| **Phase 1** 코어 | func/lists/env/key/**dom(1225줄)**/**range(WrappedRange)** 1:1 이식 + 레거시 spec 그대로 이식 |
| **Phase 1** 슬라이스 | EditorCore + **IME composition 상태머신**(observe-only+settle+reconcile) + React 경계(uncontrolled editable, reconciler-exclusion) → **v0.1** |
| **Phase 2a** 편집엔진 | Style/Typing/Bullet/Table/History 1:1 이식 (style/Table/Typing spec) |
| **Phase 2b** 자체명령 | **execCommand 완전 제거.** insertText · 인라인토글6(`Style.styleNodes`) · removeFormat · justify(`stylePara`) · lists(`Bullet`) · formatBlock(`dom.replace`) · createLink · unlink · hr · **table(insertTable/addRow/addCol/deleteRow/deleteCol/deleteTable)** · undo/redo(faithful `History`) |
| **Phase 3a** 상태발행 | `EditorState` 전체 active-state(인라인6·list·align·formatBlock·link·undo/redo·IME) **구조적 검출**(queryCommandState 미사용). `INLINE_TOGGLES` 단일출처 → 토글↔하이라이트 무드리프트 |
| **Phase 3b**(진행) 툴바 | config 기반 `<Toolbar>` — `BUTTONS` 레지스트리(command+isActive/isDisabled가 EditorState 바인딩) + `DEFAULT_TOOLBAR`([group,keys], summernote shape) + `.note-toolbar/.note-btn-group/.note-btn/note-icon-*` 클래스 계약. 현재 명령 전부(인라인6+clear·ul/ol·justify4·undo/redo) 아이콘버튼 연결. `<SummernoteEditor toolbar=...>` prop |

**골든 parity 게이트**(`golden-parity.spec`): 레거시가 execCommand로 만든 출력을 자체 명령 엔진이 **38 케이스 재현**(왕복+블록+인라인). 인라인은 결정적 마크업(strike→`<s>`) 재기준선. ⇒ "execCommand 없이 레거시 동등" 증명.

## 알려진 갭 / 기술부채 (Phase 5 + 하드닝)

- **아이콘 webfont 미이식**: SVG→webfont 빌드(scripts/build-fonts.js)는 레거시 전용 — `note-icon-*` 글리프가 없음(구조·클래스는 동작, 드롭다운은 텍스트 폴백). Phase 5에서 webfont 빌드 이식 또는 별도 `@summernote/icons` 패키지.
- **인라인 토글 부분/중첩/혼합 선택 하드닝** 미완(full-run은 골든 검증) — execCommand 제거 #1 long-tail. collapsed-cursor storedMarks도 미구현(현재 bogus-span만).
- **Tier-4/Tier-5 실기기·수동-IME 게이트 미실행**(BrowserStack 시크릿 + sign-off 소유자 미배정) — 릴리스 전 필수(§13.7). 현재는 chromium+webkit 자동(Playwright) + env 9-UA 유닛만.
- **교차테마 byte-equiv 시각 게이트** 미구현(클래스 계약은 Themes.spec으로 검증, computed-style 동등은 미게이트).
- `insertHorizontalRule` 골든 미게이트(기능은 `commands-link-hr.spec`). `Style.current`(queryCommandState)는 1:1 보존하되 미사용(EditorCore는 구조적 검출).
- 그래뉼러 패키지(icons/themes-css 분리), changesets, exports-map 검증, publish dry-run = Phase 5.
- CRLF 경고는 무해(LF 커밋) — 원하면 `.gitattributes` 정규화.

## 다음 단계 — Phase 5 (패키징·배포)

Phase 3+4 완료(v1 기능 범위). 남은 건 릴리스 엔지니어링:
1. **아이콘 webfont** 이식/패키징(글리프) — 시각 완성.
2. **Tier-4 실기기(BrowserStack) + Tier-5 수동-IME sign-off** — 릴리스 게이트(§13.7).
3. 교차테마 computed-style 시각 게이트 + 인라인 토글 엣지케이스 하드닝.
4. 그래뉼러 패키지 그래프 + changesets + exports-map + publish dry-run → **v1.0**.
