---
"@eaeao/summernote-react": patch
---

Ship version-pinned AI-agent docs in the npm tarball: `AGENTS.md` (a dense, self-contained API reference) and `SKILL.md` (an Anthropic Agent Skill entry). Both stay in sync with the package version via `scripts/sync-version.mjs` and are gated by `scripts/check-version.mjs`.
