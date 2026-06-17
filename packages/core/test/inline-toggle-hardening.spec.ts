import { describe, it, expect, afterEach } from 'vitest';
import { createEditorCore } from '../src/EditorCore';
import { mount, resetDom } from '../../../test/util';

afterEach(() => {
  resetDom();
});

/** select within a single text node by character offsets. */
function selectRange(node: Node, start: number, end: number): void {
  const r = document.createRange();
  r.setStart(node, start);
  r.setEnd(node, end);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(r);
}

function selectContents(node: Node): void {
  const r = document.createRange();
  r.selectNodeContents(node);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(r);
}

describe('inline toggle — partial / nested / mixed selection (multi-engine)', () => {
  it('partial removal: toggling bold on the middle of <b>hello</b> splits the bold', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p><b>hello</b></p>' });
    const t = el.querySelector('b')!.firstChild as Text;
    selectRange(t, 1, 4); // "ell"
    core.command('bold');
    // only "ell" loses bold; "h" and "o" stay bold
    expect(el.querySelector('p')!.innerHTML).equalsIgnoreCase('<b>h</b>ell<b>o</b>');
    core.destroy();
  });

  it('full removal: toggling bold over all of <b>hello</b> unwraps it', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p><b>hello</b></p>' });
    selectContents(el.querySelector('b') as HTMLElement);
    core.command('bold');
    expect(el.querySelector('p')!.innerHTML).equalsIgnoreCase('hello');
    expect(el.querySelector('b')).toBeNull();
    core.destroy();
  });

  it('mixed selection: applying bold over <b>he</b>llo makes the whole run bold', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p><b>he</b>llo</p>' });
    selectContents(el.querySelector('p') as HTMLElement);
    core.command('bold');
    // all text is bold; no un-bolded text remains directly under <p>
    const p = el.querySelector('p') as HTMLElement;
    const boldText = Array.from(p.querySelectorAll('b'))
      .map((b) => b.textContent)
      .join('');
    expect(boldText).toBe('hello');
    expect((p.textContent ?? '').length).toBe(5);
    // no direct (un-bolded) text node child of <p>
    const directText = Array.from(p.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== '');
    expect(directText).toBe(false);
    core.destroy();
  });

  it('nested: toggling the OUTER format removes only it (<i><b>x</b></i> -> italic off -> <b>x</b>)', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p><i><b>x</b></i></p>' });
    selectContents(el.querySelector('b') as HTMLElement);
    core.command('italic');
    expect(el.querySelector('i')).toBeNull();
    expect(el.querySelector('b')).not.toBeNull();
    expect(el.querySelector('b')!.textContent).toBe('x');
    core.destroy();
  });

  it('partial removal at the start edge: <b>hello</b>, select "he" -> <b>he</b>... no, removes he', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p><b>hello</b></p>' });
    const t = el.querySelector('b')!.firstChild as Text;
    selectRange(t, 0, 2); // "he"
    core.command('bold');
    expect(el.querySelector('p')!.innerHTML).equalsIgnoreCase('he<b>llo</b>');
    core.destroy();
  });

  it('round-trips: apply then remove bold on a partial selection returns to plain', () => {
    const el = mount('<div></div>');
    const core = createEditorCore(el, { value: '<p>hello</p>' });
    const t = el.querySelector('p')!.firstChild as Text;
    selectRange(t, 1, 4);
    core.command('bold'); // -> h<b>ell</b>o
    expect(el.querySelector('b')!.textContent).toBe('ell');
    // reselect the now-bold "ell" and toggle off
    selectContents(el.querySelector('b') as HTMLElement);
    core.command('bold');
    expect(el.querySelector('b')).toBeNull();
    expect(el.querySelector('p')!.textContent).toBe('hello');
    core.destroy();
  });
});
