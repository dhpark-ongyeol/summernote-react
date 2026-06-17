import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SummernoteEditor } from '../src/SummernoteEditor';
// load the shipped stylesheets so getComputedStyle reflects the real cascade
import '../src/styles/summernote-icons.css';
import '../src/styles/summernote-lite.css';
import '../src/styles/themes/bs5.css';

afterEach(() => {
  cleanup();
});

describe('cross-theme visual gate (computed styles, chromium)', () => {
  it('icon CSS maps a glyph to note-icon-* ::before content', () => {
    const { container } = render(<SummernoteEditor defaultValue="<p>x</p>" />);
    const boldIcon = container.querySelector('.note-btn-bold .note-icon-bold') as HTMLElement;
    expect(boldIcon).not.toBeNull();
    const content = getComputedStyle(boldIcon, '::before').content;
    // a glyph is set (not the default 'none'/'normal') — proves the @font-face glyph map applies
    expect(content).not.toBe('none');
    expect(content).not.toBe('normal');
    expect(content.length).toBeGreaterThan(0);
  });

  it('the lite base styles apply (toolbar has a background)', () => {
    const { container } = render(<SummernoteEditor defaultValue="<p>x</p>" />);
    const toolbar = container.querySelector('.note-toolbar') as HTMLElement;
    const bg = getComputedStyle(toolbar).backgroundColor;
    expect(bg).not.toBe('rgba(0, 0, 0, 0)'); // not transparent — a theme rule applied
  });

  it('a bs5-themed editor computes different styles than a lite one (theme = data)', () => {
    const { container } = render(
      <div>
        <SummernoteEditor defaultValue="<p>a</p>" theme="lite" />
        <SummernoteEditor defaultValue="<p>b</p>" theme="bs5" />
      </div>,
    );
    const liteBtn = container.querySelector('.note-theme-lite .note-btn-group.note-font .note-btn') as HTMLElement;
    const bs5Btn = container.querySelector('.note-theme-bs5 .note-btn-group.note-font .note-btn') as HTMLElement;
    expect(liteBtn).not.toBeNull();
    expect(bs5Btn).not.toBeNull();
    // bs5 overrides the first-child border-radius (0.375rem=6px) vs lite (3px) -> different cascade
    const liteRadius = getComputedStyle(liteBtn).borderTopLeftRadius;
    const bs5Radius = getComputedStyle(bs5Btn).borderTopLeftRadius;
    expect(bs5Radius).not.toBe(liteRadius);
    // and the bs5 editor border differs from lite
    const liteEditor = container.querySelector('.note-theme-lite') as HTMLElement;
    const bs5Editor = container.querySelector('.note-theme-bs5') as HTMLElement;
    expect(getComputedStyle(bs5Editor).borderTopLeftRadius).not.toBe(getComputedStyle(liteEditor).borderTopLeftRadius);
  });
});
