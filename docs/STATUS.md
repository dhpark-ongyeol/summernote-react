# 포팅 현황 (STATUS)

> jQuery summernote → React + TypeScript 자체엔진 포팅의 **현재 상태 + 실행법**.
> 설계 배경은 [PORTING-PLAN.md](PORTING-PLAN.md), 코드 지도는 루트 [CLAUDE.md](../CLAUDE.md),
> 레거시 chrome 스펙은 [CHROME-SPECS.md](CHROME-SPECS.md).

## 한눈에

- **🎉 v1.0 완료 — 단일 패키지 `@eaeao/summernote-react`** (엔진 + React 바인딩이 한 패키지; `src/engine`은 `@engine` alias로 dist에 번들 포함). 설치: `npm i @eaeao/summernote-react`.
- **외부 editor/runtime 의존 0 · jQuery 0 · `document.execCommand` 0.** react/react-dom은 peer.
- typecheck strict 클린, `yarn verify`(jQuery-ban + zero-dep + typecheck) green, tsup dual 빌드(ESM+CJS+.d.ts, 엔진 번들 → 44 exports), `npm pack` 16파일.
- **릴리스 상태**: `main` = v1.0.0 (tag `v1.0.0`, 미푸시). `publishConfig.access=public`. 실제 publish는 **npm 2FA 켠 뒤** `npm publish --otp=<코드>` (스코프 `@eaeao` 정상, 2FA만 필요). push/publish는 사용자.
- ⚠️ **테스트 실행 정책**: chromium+webkit 동시 실행이 PC를 멈춤(브라우저 프로세스 누적). 개발 중엔 **chromium 단일 spec + 실행 후 프로세스 정리**; 풀 스위트는 CI(port-ci.yml)가 push마다 양엔진. ([[test-resource-policy]])

## 무엇이 들어있나 (v1.0 범위)

- **엔진**(`src/engine`): 자체 Range 명령 레지스트리(execCommand 0, 결정적 마크업) · 구조적 EditorState(전 active-state + 값-기반 font/size/color/lineHeight) · 키보드 단축키(keyMap) · IME composition 상태머신 · faithful bookmark History · `purifyCodeview`/`isSafeLinkUrl` 보안 · `createVideoNode`(전 provider) · 엔진정확 `env`/`detectEnv`.
- **React chrome**(`src/`): `<SummernoteEditor>`(controlled/uncontrolled + forwardRef imperative handle) · `useSummernote()` 훅 · 툴바 + 드롭다운(style/font/size/unit/lineheight/para/color/table) · 다이얼로그(link/image/video/help) · 팝오버(link/image/table) + 이미지 리사이즈 handle(Pointer Events) · fullscreen/codeview/statusbar/placeholder · **air mode**(선택영역 플로팅 툴바, visualViewport, 모바일 below).
- **테마**: lite + bs3/bs4/bs5 (per-instance, 공존). CSS: `@eaeao/summernote-react/{styles,icons}.css` + `themes/{bs3,bs4,bs5}.css`. 아이콘 webfont 포함(56 글리프).
- **i18n**: 46 로케일(`locales` 레지스트리) + `lang` prop, en-US 폴백.
- **플러그인**: `definePlugin` + per-instance command/button. 레퍼런스 hello/specialchars/databasic.
- **검증**: 33 spec(엔진 유닛 + 골든 parity + React chrome + 시각게이트), chromium+webkit 게이트. 인라인토글 부분/중첩/혼합 선택 하드닝 양엔진. 어드버서리얼 리뷰 15결함 수정(codeview XSS 게이트 포함).

## 실행법

```bash
yarn install
yarn verify                                              # jQuery-ban + zero-dep 게이트 + typecheck
yarn build                                               # 단일 dist (ESM+CJS+dts, 엔진 번들 포함)
node_modules/.bin/vitest run <spec> --project=chromium   # 개발 중 권장(단일 엔진) + 실행 후 프로세스 정리
yarn test                                                # 전체 (chromium+webkit) — ⚠️ 무겁다, CI에 위임
```

## 구조 (단일 패키지)

```
src/index.ts        @eaeao/summernote-react 배럴 — React API + export * from './engine'
src/SummernoteEditor.tsx useSummernote.ts plugin.ts plugins/ toolbar/ chrome/ styles/
src/engine/         헤드리스 엔진(구 core) — chrome은 @engine alias로 import, tsup이 dist에 번들
  EditorCore.ts options.ts  core/(dom·range·func·lists·env·key)  editing/(Style·Typing·Bullet·Table·History)  lang/(en-US+46locales)  media/  security/purify
test/               평탄화 *.spec.{ts,tsx} + setup·util·golden (vitest browser, @engine alias)
scripts/            check-no-jquery · check-no-runtime-deps (src/ + 루트 manifest 스캔)
.github/workflows/port-ci.yml  install → gates → typecheck → playwright chromium+webkit → vitest
```

## 골든 parity 게이트

`golden-parity.spec` — 레거시가 execCommand로 만든 출력을 자체 명령 엔진이 **재현**(왕복+블록+인라인). 인라인은 결정적 마크업(strike→`<s>`)으로 재기준선. ⇒ "execCommand 없이 레거시 동등"의 증명. (골든 코퍼스 `test/golden/commands.json`은 커밋돼 있어 레거시 소스 없이 게이트 가능.)

## 남은 일 (자율수행 불가 / 환경 의존)

1. **실제 npm publish** — 사용자 `npm login`(eaeao) + **2FA 켜고** `npm publish --otp=<코드>` (또는 automation 토큰). `git push origin main && git push origin v1.0.0`.
2. **Tier-4 실기기(BrowserStack) + Tier-5 수동-IME sign-off**(§13.7) — 시크릿·sign-off 소유자 배정 필요. 현재는 chromium+webkit 자동 + env 9-UA 유닛만.
3. (refinement) 로케일 per-module tree-shake(tsup multi-entry), collapsed-cursor storedMarks, 교차테마 byte-equiv 시각게이트, `.gitattributes` 줄끝 정규화.
