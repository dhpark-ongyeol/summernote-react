# Use with AI

`@eaeao/summernote-react` ships machine-readable guidance so AI coding assistants (Cursor, Claude Code, GitHub Copilot, …) can integrate it without guessing the API. This page lists what is available and how to wire it up.

> The package's TypeScript declarations are the source of truth for exact signatures. Everything below is orientation layered on top of them.

---

## Shipped in the npm package

Two agent-facing files are bundled in the published tarball (and live in the repo):

- **[`AGENTS.md`](https://github.com/eaeao/summernote-react/blob/main/AGENTS.md)** — a dense, self-contained reference: props, the 50 `command()` names, toolbar items, headless/plugin APIs, `EditorState`, the security model, and a jQuery → React migration table. It follows the cross-tool [AGENTS.md](https://agents.md/) convention.
- **[`SKILL.md`](https://github.com/eaeao/summernote-react/blob/main/SKILL.md)** — an [Anthropic Agent Skill](https://code.claude.com/docs/en/skills) entry (YAML frontmatter) that points at `AGENTS.md` and the docs.

Both are version-pinned to the release. Because they ship inside the package, an agent working in any project that depends on `@eaeao/summernote-react` can read them straight from `node_modules`.

## Up-to-date docs via Context7

[Context7](https://context7.com/eaeao/summernote-react) serves these docs to AI tools on demand, version-pinned — so the assistant pulls the *current* API into its context instead of relying on stale training data. Add the Context7 MCP server to your tool once, then mention `use context7` in a prompt (or add a standing rule).

**Claude Code:**

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

**Cursor / VS Code / Windsurf** — add to your MCP config (`.cursor/mcp.json`, `.vscode/mcp.json`, …):

```json
{
  "mcpServers": {
    "context7": { "url": "https://mcp.context7.com/mcp" }
  }
}
```

Then ask, for example: *"Add a `@eaeao/summernote-react` editor with a custom toolbar. use context7."*

## Drop these rules into your agent

Add a few lines to your project's agent rules — `AGENTS.md`, `.cursor/rules/*.mdc`, `CLAUDE.md`, or `.github/copilot-instructions.md` — so the assistant reaches for the right API unprompted:

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

## Machine-readable docs (llms.txt)

The docs site publishes the [llms.txt](https://llmstxt.org/) convention for tools that paste documentation into a model:

- **[`/llms.txt`](https://eaeao.github.io/summernote-react/llms.txt)** — a curated index of every docs page.
- **[`/llms-full.txt`](https://eaeao.github.io/summernote-react/llms-full.txt)** — the whole documentation concatenated into one file.
- Every page is also available as raw Markdown — use the **Copy page** button at the top of any docs page, or append `.md` to its URL.

> Honest note: no major AI vendor currently *crawls* `llms.txt` automatically, so treat these as fuel you (or your tools) paste/fetch on demand — not an SEO or auto-discovery feature.

---

## See also

- [Getting started](./getting-started.md) — install and a first editor.
- [Headless & plugin API](./reference-api.md) — `useSummernote`, `createEditorCore`, `definePlugin`.
- [Migrating from jQuery](./migrating.md) — the legacy → React mapping an agent needs.
