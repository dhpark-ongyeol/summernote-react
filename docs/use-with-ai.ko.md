# AI로 사용하기

`@eaeao/summernote-react`는 AI 코딩 어시스턴트(Cursor, Claude Code, GitHub Copilot 등)가 API를 추측하지 않고 통합할 수 있도록 기계가 읽을 수 있는 안내를 동봉합니다. 이 페이지는 무엇이 제공되는지, 그리고 어떻게 연결하는지를 정리합니다.

> 정확한 시그니처의 출처는 패키지에 동봉된 TypeScript 선언입니다. 아래 내용은 그 위에 얹는 길잡이입니다.

---

## Shipped in the npm package

에이전트용 두 파일이 배포 tarball(과 저장소)에 동봉됩니다:

- **[`AGENTS.md`](https://github.com/eaeao/summernote-react/blob/main/AGENTS.md)** — 밀도 높은 자립형 레퍼런스: props, 50개 `command()` 이름, 툴바 아이템, headless/plugin API, `EditorState`, 보안 모델, 그리고 jQuery → React 마이그레이션 표. 크로스툴 표준 [AGENTS.md](https://agents.md/) 규약을 따릅니다.
- **[`SKILL.md`](https://github.com/eaeao/summernote-react/blob/main/SKILL.md)** — `AGENTS.md`와 문서를 가리키는 [Anthropic Agent Skill](https://code.claude.com/docs/en/skills) 항목(YAML frontmatter)입니다.

둘 다 릴리스 버전에 고정됩니다. 패키지 안에 동봉되므로, `@eaeao/summernote-react`에 의존하는 프로젝트에서 작업하는 에이전트는 `node_modules`에서 바로 읽을 수 있습니다.

## Up-to-date docs via Context7

[Context7](https://context7.com/eaeao/summernote-react)는 이 문서를 AI 도구에 **요청 시(on demand)·버전 고정**으로 제공합니다 — 어시스턴트가 오래된 학습 데이터 대신 *현재* API를 컨텍스트로 끌어옵니다. 도구에 Context7 MCP 서버를 한 번 추가한 뒤, 프롬프트에 `use context7`을 덧붙이거나(또는 상시 규칙으로 추가) 사용하세요.

**Claude Code:**

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

**Cursor / VS Code / Windsurf** — MCP 설정(`.cursor/mcp.json`, `.vscode/mcp.json` 등)에 추가:

```json
{
  "mcpServers": {
    "context7": { "url": "https://mcp.context7.com/mcp" }
  }
}
```

그런 다음 예를 들어: *"커스텀 툴바를 가진 `@eaeao/summernote-react` 에디터를 추가해줘. use context7."*

## Drop these rules into your agent

프로젝트의 에이전트 규칙 파일(`AGENTS.md`, `.cursor/rules/*.mdc`, `CLAUDE.md`, `.github/copilot-instructions.md`)에 몇 줄을 추가해, 어시스턴트가 묻지 않아도 올바른 API를 쓰도록 하세요:

```text
@eaeao/summernote-react is a React component, not a jQuery plugin: render
<SummernoteEditor value onChange />, never $('.x').summernote(...).
- Import the CSS yourself: "@eaeao/summernote-react/styles.css" and "/icons.css".
- Dispatch edits by flat command name — ref.current.command('bold') or useCommand() —
  not a 'module.method' string. The 50 names are the exported CommandName union.
- Controlled value/onChange is caret-safe; do not force-resync on every keystroke.
- theme is per-instance (lite|bs3|bs4|bs5); lang deep-merges over en-US.
- onImageUpload(file) returns/resolves the image src; otherwise images embed as base64.
```

(규칙은 에이전트가 읽는 영어로 두는 것을 권장합니다.)

## Machine-readable docs (llms.txt)

문서 사이트는 문서를 모델에 붙여넣는 도구를 위해 [llms.txt](https://llmstxt.org/) 규약을 게시합니다:

- **[`/llms.txt`](https://eaeao.github.io/summernote-react/llms.txt)** — 모든 문서 페이지의 큐레이션된 인덱스.
- **[`/llms-full.txt`](https://eaeao.github.io/summernote-react/llms-full.txt)** — 전체 문서를 한 파일로 이어붙인 것.
- 모든 페이지는 원본 Markdown으로도 제공됩니다 — 문서 페이지 상단의 **Copy page** 버튼을 쓰거나, URL 끝에 `.md`를 붙이세요.

> 정직한 참고: 현재 주요 AI 벤더 중 `llms.txt`를 자동으로 *크롤링*하는 곳은 없습니다. 따라서 이 파일들은 SEO나 자동 발견 기능이 아니라, 여러분(또는 도구)이 필요할 때 붙여넣거나 가져오는 연료로 취급하세요.

---

## See also

- [Getting started](./getting-started.md) — 설치와 첫 에디터.
- [Headless & plugin API](./reference-api.md) — `useSummernote`, `createEditorCore`, `definePlugin`.
- [Migrating from jQuery](./migrating.md) — 에이전트에게 필요한 레거시 → React 매핑.
