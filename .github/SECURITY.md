# Security Policy

## Supported versions

Security fixes are released for the latest published `@eaeao/summernote-react`. Please upgrade to the latest version before reporting.

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

- Preferred: open a private report via **GitHub Security Advisories** (the repository's **Security → Report a vulnerability** tab).
- Or email the maintainer at **eaeao@naver.com**.

Include a description, the affected version(s), and a minimal reproduction if possible. You'll get an acknowledgement, and we'll coordinate a fix and a disclosure timeline with you.

## Scope notes

This is a rich-text editor, so the security-sensitive surface is HTML handling:

- **Code-view** content is purified before it is applied back to the editable (script / style / object / embed and non-whitelisted iframes are stripped).
- Link hrefs reject `javascript:` / `vbscript:` / `data:` schemes.
- The controlled `value`, `setCode()`, and the initial HTML are treated as **developer-supplied (trusted)** and are **not** sanitized — sanitize untrusted HTML before passing it in.

Reports about these boundaries — for example a bypass of the code-view filter or the link-scheme check — are in scope and appreciated.
