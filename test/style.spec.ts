/**
 * style.spec.ts
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 *
 * Ported 1:1 from test/base/editing/style.spec.js. jQuery DOM construction replaced
 * with native DOM (document.createElement + innerHTML). describe/it titles and every
 * expected HTML literal are byte-identical to the legacy spec.
 */

import { describe, it, expect } from 'vitest';
import range from '../src/engine/core/range';
import { Style } from '../src/engine/editing/Style';

function fromHTML(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild as HTMLElement;
}

describe('base:editing.Style', () => {
  const style = new Style();

  describe('styleNodes', () => {
    it('should wrap selected text with span', () => {
      const cont = fromHTML('<div class="note-editable"><p>text</p></div>');
      const p = cont.querySelector('p') as HTMLElement;
      const rng = range.create(p.firstChild, 0, p.firstChild, 4)!;
      style.styleNodes(rng);

      expect(cont.innerHTML).to.deep.equal('<p><span>text</span></p>');
    });

    it('should split text and wrap selected text with span', () => {
      const cont = fromHTML('<div class="note-editable"><p>text</p></div>');
      const p = cont.querySelector('p') as HTMLElement;
      const rng = range.create(p.firstChild, 1, p.firstChild, 3)!;
      style.styleNodes(rng);

      expect(cont.innerHTML).to.deep.equal('<p>t<span>ex</span>t</p>');
    });

    it('should split text and insert span', () => {
      const cont = fromHTML('<div class="note-editable"><p>text</p></div>');
      const p = cont.querySelector('p') as HTMLElement;
      const rng = range.create(p.firstChild, 2, p.firstChild, 2)!;
      style.styleNodes(rng);

      expect(cont.innerHTML).to.deep.equal('<p>te<span></span>xt</p>');
    });

    it('should just return a parent span', () => {
      const cont = fromHTML('<div class="note-editable"><p><span>text</span></p></div>');
      const span = cont.querySelector('span') as HTMLElement;
      const rng = range.create(span.firstChild, 0, span.firstChild, 4)!;
      style.styleNodes(rng);

      expect(cont.innerHTML).to.deep.equal('<p><span>text</span></p>');
    });

    it('should wrap each texts with span', () => {
      const cont = fromHTML('<div class="note-editable"><p><b>bold</b><span>span</span></p></div>');
      const b = cont.querySelector('b') as HTMLElement;
      const span = cont.querySelector('span') as HTMLElement;
      const rng = range.create(b.firstChild, 2, span.firstChild, 2)!;
      style.styleNodes(rng);

      expect(cont.innerHTML).to.deep.equal('<p><b>bo<span>ld</span></b><span><span>sp</span>an</span></p>');
    });

    it('should wrap each texts with span except not a single blood line', () => {
      const cont = fromHTML('<div class="note-editable"><p><b>bold</b><span>span</span></p></div>');
      const b = cont.querySelector('b') as HTMLElement;
      const span = cont.querySelector('span') as HTMLElement;
      const rng = range.create(b.firstChild, 2, span.firstChild, 4)!;
      style.styleNodes(rng);

      expect(cont.innerHTML).to.deep.equal('<p><b>bo<span>ld</span></b><span>span</span></p>');
    });

    it('should expand b tag when providing the expandClosestSibling option', () => {
      const cont = fromHTML('<div class="note-editable"><p>text<b>bold</b></p></div>');
      const p = cont.querySelector('p') as HTMLElement;
      const rng = range.create(p.firstChild, 0, p.firstChild, 4)!;
      style.styleNodes(rng, { nodeName: 'B', expandClosestSibling: true });

      expect(cont.innerHTML).to.deep.equal('<p><b>textbold</b></p>');
    });

    it('should not expand b tag when providing the onlyPartialContains option', () => {
      const cont = fromHTML('<div class="note-editable"><p>text<b>bold</b></p></div>');
      const p = cont.querySelector('p') as HTMLElement;
      const rng = range.create(p.firstChild, 0, p.firstChild, 4)!;
      style.styleNodes(rng, {
        nodeName: 'B',
        expandClosestSibling: true,
        onlyPartialContains: true,
      });

      expect(cont.innerHTML).to.deep.equal('<p><b>text</b><b>bold</b></p>');
    });
  });
});
