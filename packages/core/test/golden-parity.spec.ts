import { describe, it, expect, afterEach } from 'vitest';
import { createEditorCore } from '../src/EditorCore';
import { mount, resetDom } from '../../../test/util';
import golden from '../../../test/golden/commands.json';

/**
 * Golden parity gate: replay the legacy-recorded corpus through the new own-command engine
 * and assert the output reproduces the legacy oracle.
 *
 * Scope here = Tier-A block commands (justify/lists) implemented via the ported editing
 * engine (Style.stylePara / Bullet). Inline-format toggles (Style.styleNodes-based, with a
 * deterministic-markup re-baseline) are gated in a follow-up.
 */
const BLOCK_METHODS = new Set([
  'justifyLeft',
  'justifyCenter',
  'justifyRight',
  'justifyFull',
  'insertOrderedList',
  'insertUnorderedList',
]);

function selectAll(editable: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(editable);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

afterEach(() => {
  resetDom();
});

describe('golden parity — Tier-A block commands (multi-engine)', () => {
  const cases = golden.records.filter(
    (r) => r.action !== null && r.select === 'all' && BLOCK_METHODS.has(r.action.method.replace(/^editor\./, '')),
  );

  it('covers the recorded block commands', () => {
    // justifyRight + insertOrderedList + insertUnorderedList
    expect(cases.length).toBeGreaterThanOrEqual(3);
  });

  for (const rec of cases) {
    const method = rec.action!.method.replace(/^editor\./, '');
    it(`reproduces legacy ${rec.name}`, () => {
      const el = mount('<div></div>');
      const core = createEditorCore(el, { value: rec.initialHTML });
      selectAll(el);
      core.command(method);
      expect(core.getHTML()).equalsIgnoreCase(rec.resultHTML);
      core.destroy();
    });
  }
});
