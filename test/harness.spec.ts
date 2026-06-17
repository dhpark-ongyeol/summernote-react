import { describe, it, expect, afterEach } from 'vitest';
import {
  h,
  mount,
  findEl,
  resetDom,
  dispatchKey,
  dispatchInput,
  dispatchComposition,
  dispatchPaste,
} from './util';

afterEach(() => {
  resetDom();
});

describe('test harness (multi-engine)', () => {
  it('equalsIgnoreCase compares HTML case-insensitively', () => {
    expect('<P>Hi<BR></P>').equalsIgnoreCase('<p>hi<br></p>');
    expect('<p>a</p>').not.equalsIgnoreCase('<p>b</p>');
  });

  it('equalsStyle self-normalizes computed CSS per engine', () => {
    const el = mount('<div style="color: red"></div>');
    expect(el).equalsStyle('red', 'color');
    expect(el).not.equalsStyle('blue', 'color');
  });

  it('h() parses an HTML string into its first element', () => {
    const el = h('<p class="x">hi</p>');
    expect(el.tagName).toBe('P');
    expect(el.className).toBe('x');
  });

  it('mount/findEl attach to and query within the document', () => {
    const root = mount('<div><span class="t">x</span></div>');
    expect(findEl(root, '.t').textContent).toBe('x');
    expect(document.body.contains(root)).toBe(true);
  });

  it('dispatchKey / dispatchInput fire native events with the right fields', () => {
    const el = mount('<div contenteditable="true"></div>');
    let key = '';
    let inputType = '';
    el.addEventListener('keydown', (e) => {
      key = (e as KeyboardEvent).key;
    });
    el.addEventListener('beforeinput', (e) => {
      inputType = (e as InputEvent).inputType;
    });
    dispatchKey(el, 'keydown', { key: 'Enter' });
    dispatchInput(el, 'beforeinput', { inputType: 'insertParagraph' });
    expect(key).toBe('Enter');
    expect(inputType).toBe('insertParagraph');
  });

  it('dispatchComposition replays a Hangul composition sequence', () => {
    const el = mount('<div contenteditable="true"></div>');
    const seq: string[] = [];
    (['compositionstart', 'compositionupdate', 'compositionend'] as const).forEach((t) => {
      el.addEventListener(t, (e) => seq.push(`${t}:${(e as CompositionEvent).data}`));
    });
    dispatchComposition(el, 'compositionstart', '');
    dispatchComposition(el, 'compositionupdate', '핞'); // 한 (intermediate)
    dispatchComposition(el, 'compositionend', '한'); // 한 (committed)
    expect(seq).toEqual(['compositionstart:', 'compositionupdate:핞', 'compositionend:한']);
  });

  it('dispatchPaste carries html and text via DataTransfer (Chromium + WebKit)', () => {
    const el = mount('<div contenteditable="true"></div>');
    let html = '';
    let text = '';
    el.addEventListener('paste', (e) => {
      const dt = (e as ClipboardEvent).clipboardData;
      html = dt?.getData('text/html') ?? '';
      text = dt?.getData('text/plain') ?? '';
    });
    dispatchPaste(el, { html: '<b>x</b>', text: 'x' });
    expect(html).toBe('<b>x</b>');
    expect(text).toBe('x');
  });
});
