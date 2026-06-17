import { describe, it, expect, afterEach } from 'vitest';
import { createEditorCore } from '../src/engine/EditorCore';
import { mount, resetDom } from './util';

afterEach(() => {
  resetDom();
});

/** select the full contents of a node (non-collapsed). */
function selectContents(node: Node): void {
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** place a collapsed caret inside a node. */
function caretAt(node: Node, offset: number): void {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** force the core to recompute EditorState from the live selection (mirrors selectionchange). */
function refresh(): void {
  document.dispatchEvent(new Event('selectionchange'));
}

describe('EditorState structural active-state (multi-engine)', () => {
  it('reports a clean paragraph as p / left / no formats', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p>hello</p>' });
    caretAt((el.querySelector('p') as HTMLElement).firstChild as Node, 1);
    refresh();

    const s = core.getSnapshot();
    expect(s.bold).toBe(false);
    expect(s.italic).toBe(false);
    expect(s.underline).toBe(false);
    expect(s.strikethrough).toBe(false);
    expect(s.superscript).toBe(false);
    expect(s.subscript).toBe(false);
    expect(s.orderedList).toBe(false);
    expect(s.unorderedList).toBe(false);
    expect(s.link).toBe(false);
    expect(s.align).toBe('left');
    expect(s.formatBlock).toBe('p');
    core.destroy();
  });

  it('detects each inline format structurally', () => {
    const cases: Array<[string, keyof ReturnType<ReturnType<typeof createEditorCore>['getSnapshot']>]> = [
      ['<p><b>x</b></p>', 'bold'],
      ['<p><strong>x</strong></p>', 'bold'],
      ['<p><i>x</i></p>', 'italic'],
      ['<p><em>x</em></p>', 'italic'],
      ['<p><u>x</u></p>', 'underline'],
      ['<p><s>x</s></p>', 'strikethrough'],
      ['<p><strike>x</strike></p>', 'strikethrough'],
      ['<p><sup>x</sup></p>', 'superscript'],
      ['<p><sub>x</sub></p>', 'subscript'],
    ];
    for (const [html, key] of cases) {
      const el = mount('<div></div>');
      const core = createEditorCore(el, { value: html });
      const inner = el.querySelector('p')!.firstChild as HTMLElement;
      caretAt(inner.firstChild as Node, 0);
      refresh();
      expect(core.getSnapshot()[key], `${html} -> ${String(key)}`).toBe(true);
      core.destroy();
      resetDom();
    }
  });

  it('reports alignment from inline style', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p style="text-align:center;">hi</p>' });
    caretAt((el.querySelector('p') as HTMLElement).firstChild as Node, 0);
    refresh();
    expect(core.getSnapshot().align).toBe('center');
    core.destroy();
  });

  it('reports unordered vs ordered lists', () => {
    const ul = mount('<div></div>');
    const ulCore = createEditorCore(ul, { value: '<ul><li>a</li></ul>' });
    caretAt((ul.querySelector('li') as HTMLElement).firstChild as Node, 0);
    refresh();
    expect(ulCore.getSnapshot().unorderedList).toBe(true);
    expect(ulCore.getSnapshot().orderedList).toBe(false);
    ulCore.destroy();
    resetDom();

    const ol = mount('<div></div>');
    const olCore = createEditorCore(ol, { value: '<ol><li>a</li></ol>' });
    caretAt((ol.querySelector('li') as HTMLElement).firstChild as Node, 0);
    refresh();
    expect(olCore.getSnapshot().orderedList).toBe(true);
    expect(olCore.getSnapshot().unorderedList).toBe(false);
    olCore.destroy();
  });

  it('reports the format block tag (h2, blockquote)', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<h2>title</h2>' });
    caretAt((el.querySelector('h2') as HTMLElement).firstChild as Node, 0);
    refresh();
    expect(core.getSnapshot().formatBlock).toBe('h2');
    core.destroy();
    resetDom();

    const bq = mount('<div></div>');
    const bqCore = createEditorCore(bq, { value: '<blockquote>q</blockquote>' });
    caretAt((bq.querySelector('blockquote') as HTMLElement).firstChild as Node, 0);
    refresh();
    expect(bqCore.getSnapshot().formatBlock).toBe('blockquote');
    bqCore.destroy();
  });

  it('reports link when the caret is inside an anchor', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p><a href="https://summernote.org">x</a></p>' });
    caretAt((el.querySelector('a') as HTMLElement).firstChild as Node, 0);
    refresh();
    expect(core.getSnapshot().link).toBe(true);
    core.destroy();
  });

  it('flips the active-state through a toggle command (end-to-end)', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p>hello</p>' });
    selectContents(el.querySelector('p') as HTMLElement);
    expect(core.getSnapshot().bold).toBe(false);

    core.command('bold');
    expect(core.getSnapshot().bold).toBe(true);
    expect(core.getSnapshot().canUndo).toBe(true);
    core.destroy();
  });

  it('reports font-size + unit from inline style (pt preserved)', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p><span style="font-size: 18pt;">x</span></p>' });
    const span = el.querySelector('span') as HTMLElement;
    caretAt(span.firstChild as Node, 0);
    refresh();
    expect(core.getSnapshot().fontSize).toBe('18');
    expect(core.getSnapshot().fontSizeUnit).toBe('pt');
    core.destroy();
  });

  it('reports font-family (first family, dequoted)', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: `<p><span style="font-family: 'Courier New', monospace;">x</span></p>` });
    caretAt((el.querySelector('span') as HTMLElement).firstChild as Node, 0);
    refresh();
    expect(core.getSnapshot().fontName).toBe('Courier New');
    core.destroy();
  });

  it('reports line-height ratio from inline style', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p style="line-height: 2;">hi</p>' });
    caretAt((el.querySelector('p') as HTMLElement).firstChild as Node, 0);
    refresh();
    expect(core.getSnapshot().lineHeight).toBe('2');
    core.destroy();
  });

  it('reports empty value-state when the selection is outside the editor', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p>hello</p>' });
    const outside = mount('<p>outside</p>');
    caretAt(outside.firstChild as Node, 0);
    refresh();
    expect(core.getSnapshot().fontName).toBe('');
    expect(core.getSnapshot().fontSize).toBe('');
    core.destroy();
  });

  it('reports nothing active when the selection is outside the editor', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p>hello</p>' });
    const outside = mount('<p>outside</p>');
    caretAt(outside.firstChild as Node, 0);
    refresh();

    const s = core.getSnapshot();
    expect(s.bold).toBe(false);
    expect(s.align).toBeNull();
    expect(s.formatBlock).toBeNull();
    expect(s.link).toBe(false);
    core.destroy();
  });
});
