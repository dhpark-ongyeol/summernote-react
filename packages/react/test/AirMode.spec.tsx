import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { SummernoteEditor } from '../src/SummernoteEditor';

afterEach(() => {
  cleanup();
});

function selectContents(node: Node): void {
  act(() => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
}

function collapse(node: Node): void {
  act(() => {
    const range = document.createRange();
    range.setStart(node, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
}

describe('Air mode (multi-engine)', () => {
  it('renders no fixed toolbar/statusbar in air mode', () => {
    const { container } = render(<SummernoteEditor defaultValue="<p>hi</p>" airMode />);
    expect(container.querySelector('.note-toolbar')).toBeNull();
    expect(container.querySelector('.note-statusbar')).toBeNull();
    expect(container.querySelector('.note-airframe')).not.toBeNull();
  });

  it('shows the air popover on a non-collapsed selection, hides it when collapsed', () => {
    const { container } = render(<SummernoteEditor defaultValue="<p>hello</p>" airMode />);
    const editable = container.querySelector('.note-editable') as HTMLElement;

    selectContents(editable.querySelector('p') as HTMLElement);
    expect(container.querySelector('.note-air-popover')).not.toBeNull();

    collapse(editable.querySelector('p')!.firstChild as Node);
    expect(container.querySelector('.note-air-popover')).toBeNull();
  });

  it('the air toolbar applies a command (Bold)', () => {
    const { container, getByRole } = render(<SummernoteEditor defaultValue="<p>hello</p>" airMode />);
    const editable = container.querySelector('.note-editable') as HTMLElement;
    selectContents(editable.querySelector('p') as HTMLElement);

    fireEvent.click(getByRole('button', { name: 'Bold' }));
    expect(editable.innerHTML).toBe('<p><b>hello</b></p>');
  });

  it('a non-air editor still renders the fixed toolbar', () => {
    const { container } = render(<SummernoteEditor defaultValue="<p>hi</p>" />);
    expect(container.querySelector('.note-toolbar')).not.toBeNull();
    expect(container.querySelector('.note-air-popover')).toBeNull();
  });
});
