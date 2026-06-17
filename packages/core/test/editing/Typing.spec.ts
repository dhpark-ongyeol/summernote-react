/**
 * Typing.spec.ts
 * Ported 1:1 from test/base/editing/Typing.spec.js. jQuery DOM construction replaced with native
 * DOM (document.createElement + innerHTML). The custom matchers are jest-style in this repo:
 * expect(x).equalsIgnoreCase(y).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import range from '../../src/core/range';
import { Typing } from '../../src/editing/Typing';

function fromHTML(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild as HTMLElement;
}

describe('base:editing.Style', () => {
  function typing(level: number): Typing {
    return new Typing({ blockquoteBreakingLevel: level });
  }

  describe('base:editing.Typing', () => {
    describe('insertParagraph', () => {
      describe('blockquote breaking support', () => {
        let editable: HTMLElement;

        function check(html: string): void {
          expect(editable.innerHTML).equalsIgnoreCase(html);
        }

        beforeEach(() => {
          editable = fromHTML(
            '<div class="note-editable"><blockquote id="1">Part1<blockquote id="2">Part2.1<br>Part2.2</blockquote>Part3</blockquote></div>',
          );
          document.body.appendChild(editable);
        });

        it('should not break blockquote if blockquoteBreakingLevel=0', () => {
          typing(0).insertParagraph(editable, range.create(editable.querySelector('[id="2"]')!.firstChild, 1));

          check(
            '<blockquote id="1">Part1<blockquote id="2"><p>P</p><p>art2.1<br>Part2.2</p></blockquote>Part3</blockquote>',
          );
        });

        it('should break the first blockquote if blockquoteBreakingLevel=1', () => {
          typing(1).insertParagraph(editable, range.create(editable.querySelector('[id="2"]')!.firstChild, 1));

          check(
            '<blockquote id="1">Part1<blockquote id="2"><p>P</p></blockquote><p><br></p><blockquote id="2"><p>art2.1<br>Part2.2</p></blockquote>Part3</blockquote>',
          );
        });

        it('should break all blockquotes if blockquoteBreakingLevel=2', () => {
          typing(2).insertParagraph(editable, range.create(editable.querySelector('[id="2"]')!.firstChild, 1));

          check(
            '<blockquote id="1">Part1<blockquote id="2"><p>P</p></blockquote></blockquote><p><br></p><blockquote id="1"><blockquote id="2"><p>art2.1<br>Part2.2</p></blockquote>Part3</blockquote>',
          );
        });

        it('should remove leading BR from split, when breaking is on the right edge of a line', () => {
          typing(1).insertParagraph(editable, range.create(editable.querySelector('[id="2"]')!.firstChild, 7));

          check(
            '<blockquote id="1">Part1<blockquote id="2"><p>Part2.1</p></blockquote><p><br></p><blockquote id="2"><p>Part2.2</p></blockquote>Part3</blockquote>',
          );
        });

        it('should insert new paragraph after the blockquote, if break happens at the end of the blockquote', () => {
          typing(2).insertParagraph(editable, range.create(editable.querySelector('[id="1"]')!.lastChild, 5));

          check(
            '<blockquote id="1"><p>Part1<blockquote id="2">Part2.1<br>Part2.2</blockquote>Part3</p></blockquote><p><br></p>',
          );
        });

        it('should insert new paragraph before the blockquote, if break happens at the beginning of the blockquote', () => {
          typing(2).insertParagraph(editable, range.create(editable.querySelector('[id="1"]')!.firstChild, 0));

          check(
            '<p><br></p><blockquote id="1"><p>Part1<blockquote id="2">Part2.1<br>Part2.2</blockquote>Part3</p></blockquote>',
          );
        });
      });
    });
  });
});
