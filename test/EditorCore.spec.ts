import { describe, it, expect, afterEach } from 'vitest';
import { createEditorCore, type EditorCoreOptions } from '../src/engine/EditorCore';
import { mount, resetDom, dispatchComposition, dispatchInput } from './util';

afterEach(() => {
  resetDom();
});

function makeEditor(value?: string, options: EditorCoreOptions = {}) {
  const el = mount('<div></div>');
  const core = createEditorCore(el, { ...options, ...(value !== undefined ? { value } : {}) });
  return { el, core };
}

function selectContents(node: Node): void {
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function caretAt(node: Node, offset: number): void {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

describe('EditorCore (thin slice, multi-engine)', () => {
  it('seeds an empty paragraph when no value is given', () => {
    const { core } = makeEditor();
    expect(core.getHTML()).toBe('<p><br></p>');
  });

  it('insertText inserts at the caret, records undo, and undo reverts', () => {
    const { el, core } = makeEditor('<p>ac</p>');
    const textNode = el.querySelector('p')!.firstChild!;
    caretAt(textNode, 1);

    expect(core.command('insertText', 'b')).toBe(true);
    expect(core.getHTML()).toBe('<p>abc</p>');
    expect(core.getSnapshot().canUndo).toBe(true);

    expect(core.command('undo')).toBe(true);
    expect(core.getHTML()).toBe('<p>ac</p>');
    expect(core.getSnapshot().canUndo).toBe(false);
  });

  it('bold wraps the selection, reflects active state, and undo reverts', () => {
    const { el, core } = makeEditor('<p>hello</p>');
    selectContents(el.querySelector('p')!);

    expect(core.command('bold')).toBe(true);
    expect(core.getHTML()).toBe('<p><b>hello</b></p>');
    expect(core.getSnapshot().bold).toBe(true);

    expect(core.command('undo')).toBe(true);
    expect(core.getHTML()).toBe('<p>hello</p>');
  });

  it('bold toggles off when the selection is already bold', () => {
    const { el, core } = makeEditor('<p><b>hello</b></p>');
    selectContents(el.querySelector('b')!);

    expect(core.command('bold')).toBe(true);
    expect(core.getHTML()).toBe('<p>hello</p>');
  });

  it('publishes a referentially-stable snapshot and notifies on change', () => {
    const { el, core } = makeEditor('<p>hello</p>');
    let notifications = 0;
    core.subscribe(() => {
      notifications += 1;
    });

    const before = core.getSnapshot();
    expect(core.getSnapshot()).toBe(before); // stable when nothing changed

    selectContents(el.querySelector('p')!);
    core.command('bold');
    expect(notifications).toBeGreaterThan(0);
    expect(core.getSnapshot().bold).toBe(true);
    expect(core.getSnapshot()).not.toBe(before);
  });

  describe('IME composition state machine', () => {
    it('is observe-only during composition and reconciles once after compositionend + settle', async () => {
      let changes = 0;
      const { el, core } = makeEditor('<p></p>', { onChange: () => (changes += 1) });
      const p = el.querySelector('p')!;
      caretAt(p, 0);

      // Hangul "한" composed: start -> (browser mutates DOM + fires input WHILE composing) -> update -> end
      dispatchComposition(el, 'compositionstart', '');
      expect(core.isComposing()).toBe(true);

      p.textContent = 'ㅎ';
      dispatchInput(el, 'input', { inputType: 'insertCompositionText', data: 'ㅎ' });
      dispatchComposition(el, 'compositionupdate', 'ㅎ');
      p.textContent = '한';
      dispatchInput(el, 'input', { inputType: 'insertCompositionText', data: '한' });

      // mid-composition: NOTHING recorded, NO change fired (would corrupt Hangul otherwise)
      expect(changes).toBe(0);
      expect(core.getSnapshot().canUndo).toBe(false);

      dispatchComposition(el, 'compositionend', '한');
      expect(core.isComposing()).toBe(false);
      // still nothing until the settle window elapses
      expect(changes).toBe(0);

      await new Promise((resolve) => setTimeout(resolve, 160));

      // exactly ONE reconcile: one change, one undo step, committed content intact
      expect(changes).toBe(1);
      expect(core.getSnapshot().canUndo).toBe(true);
      expect(core.getHTML()).toContain('한');
    });

    it('blocks setHTML while composing (no clobber of in-flight Hangul)', () => {
      const { el, core } = makeEditor('<p>ko</p>');
      dispatchComposition(el, 'compositionstart', '');
      core.setHTML('<p>clobbered</p>');
      expect(core.getHTML()).toBe('<p>ko</p>'); // ignored while composing
      dispatchComposition(el, 'compositionend', 'ko');
    });
  });
});
