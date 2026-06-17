import { describe, it, expect, afterEach } from 'vitest';
import { purifyCodeview, isSafeLinkUrl } from '../src/engine/security/purify';
import { createEditorCore } from '../src/engine/EditorCore';
import { mount, resetDom } from './util';

afterEach(() => {
  resetDom();
});

function selectContents(node: Node): void {
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

describe('purifyCodeview — codeview XSS gate (ported legacy filter)', () => {
  it('strips script/style/object/embed/meta tags', () => {
    const dirty = '<p>ok</p><script>alert(1)</script><style>x{}</style><object></object><embed><meta>';
    const clean = purifyCodeview(dirty);
    expect(clean).not.toMatch(/<script|<style|<object|<embed|<meta/i);
    expect(clean).toContain('<p>ok</p>');
  });

  it('removes non-whitelisted iframes but keeps youtube embeds', () => {
    expect(purifyCodeview('<iframe src="https://evil.com/x"></iframe>')).not.toContain('iframe');
    expect(purifyCodeview('<iframe src="//www.youtube.com/embed/abc"></iframe>')).toContain('youtube.com');
  });

  it('is a no-op when codeviewFilter is disabled', () => {
    expect(purifyCodeview('<script>x</script>', { codeviewFilter: false })).toContain('<script>');
  });
});

describe('isSafeLinkUrl — link scheme allowlist', () => {
  it('rejects javascript:/vbscript:/data: and allows http/https/mailto/relative', () => {
    expect(isSafeLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeLinkUrl('  JavaScript:alert(1)')).toBe(false);
    expect(isSafeLinkUrl('vbscript:x')).toBe(false);
    expect(isSafeLinkUrl('data:text/html,x')).toBe(false);
    expect(isSafeLinkUrl('https://x.com')).toBe(true);
    expect(isSafeLinkUrl('mailto:a@b.c')).toBe(true);
    expect(isSafeLinkUrl('/relative')).toBe(true);
    expect(isSafeLinkUrl('#anchor')).toBe(true);
  });
});

describe('EditorCore review-fix regressions (multi-engine)', () => {
  it('createLink honors edited display text on a non-collapsed selection', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p>hello</p>' });
    selectContents(el.querySelector('p') as HTMLElement);
    core.command('createLink', { url: 'https://x.com', text: 'world' });
    const a = el.querySelector('a') as HTMLAnchorElement;
    expect(a.textContent).toBe('world');
    expect(a.getAttribute('href')).toBe('https://x.com');
    core.destroy();
  });

  it('createLink rejects a javascript: href', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p>hello</p>' });
    selectContents(el.querySelector('p') as HTMLElement);
    expect(core.command('createLink', { url: 'javascript:alert(1)' })).toBe(false);
    expect(el.querySelector('a')).toBeNull();
    core.destroy();
  });

  it('formatBlock converts OUT of blockquote back to p (round-trip)', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<blockquote>q</blockquote>' });
    selectContents(el.querySelector('blockquote') as HTMLElement);
    core.command('formatBlock', 'p');
    expect(el.querySelector('blockquote')).toBeNull();
    expect(el.querySelector('p')).not.toBeNull();
    core.destroy();
  });

  it('a command refuses to run when the selection is outside the editor', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p>hello</p>' });
    const outside = mount('<p>outside text</p>');
    selectContents(outside as HTMLElement);
    expect(core.command('bold')).toBe(false);
    expect(outside.querySelector('b')).toBeNull(); // did NOT mutate the outside DOM
    core.destroy();
  });

  it('collapsed-caret inline style does not leave a ZWNBSP after typing replaces it', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p>hi</p>' });
    const t = el.querySelector('p')!.firstChild as Text;
    const r = document.createRange();
    r.setStart(t, 2);
    r.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(r);
    core.command('fontName', 'Arial');
    // the bogus char is SELECTED (not collapsed-past), so the live selection spans it for replacement
    const span = el.querySelector('span') as HTMLElement;
    expect(span).not.toBeNull();
    expect(window.getSelection()!.toString()).toBe(span.textContent); // selection covers the bogus content
    core.destroy();
  });
});
