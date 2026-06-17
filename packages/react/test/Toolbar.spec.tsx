import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { SummernoteEditor } from '../src/SummernoteEditor';

afterEach(() => {
  cleanup();
});

function selectContents(node: Node): void {
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

describe('Toolbar (config-driven, multi-engine)', () => {
  it('renders the default button set with accessible names + class contract', () => {
    const { container, getByRole } = render(<SummernoteEditor defaultValue="<p>hi</p>" />);
    for (const name of ['Bold', 'Italic', 'Underline', 'Unordered list', 'Align center', 'Undo', 'Redo']) {
      expect(getByRole('button', { name })).not.toBeNull();
    }
    // class contract preserved for theme CSS
    expect(container.querySelector('.note-toolbar')).not.toBeNull();
    expect(container.querySelector('.note-btn-group.note-font')).not.toBeNull();
    expect(container.querySelector('.note-btn.note-btn-bold')).not.toBeNull();
    expect(container.querySelector('.note-btn-bold .note-icon-bold')).not.toBeNull();
  });

  it('Italic button toggles markup and reflects pressed state', () => {
    const { container, getByRole } = render(<SummernoteEditor defaultValue="<p>hi</p>" />);
    const editable = container.querySelector('.note-editable') as HTMLElement;
    selectContents(editable.querySelector('p') as HTMLElement);

    const italic = getByRole('button', { name: 'Italic' });
    fireEvent.click(italic);
    expect(editable.innerHTML).toBe('<p><i>hi</i></p>');
    expect(italic.getAttribute('aria-pressed')).toBe('true');
  });

  it('Align center marks the center button active', () => {
    const { container, getByRole } = render(<SummernoteEditor defaultValue="<p>hi</p>" />);
    const editable = container.querySelector('.note-editable') as HTMLElement;
    selectContents(editable.querySelector('p') as HTMLElement);

    fireEvent.click(getByRole('button', { name: 'Align center' }));
    expect(getByRole('button', { name: 'Align center' }).getAttribute('aria-pressed')).toBe('true');
    expect(getByRole('button', { name: 'Align left' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('Undo is disabled at rest and enabled after an edit', () => {
    const { container, getByRole } = render(<SummernoteEditor defaultValue="<p>hi</p>" />);
    const undo = getByRole('button', { name: 'Undo' });
    expect(undo.hasAttribute('disabled')).toBe(true);

    const editable = container.querySelector('.note-editable') as HTMLElement;
    selectContents(editable.querySelector('p') as HTMLElement);
    fireEvent.click(getByRole('button', { name: 'Bold' }));

    expect(getByRole('button', { name: 'Undo' }).hasAttribute('disabled')).toBe(false);
  });

  it('honors a custom toolbar config (renders only the requested buttons)', () => {
    const { getByRole, queryByRole } = render(
      <SummernoteEditor defaultValue="<p>hi</p>" toolbar={[['font', ['bold', 'italic']]]} />,
    );
    expect(getByRole('button', { name: 'Bold' })).not.toBeNull();
    expect(getByRole('button', { name: 'Italic' })).not.toBeNull();
    expect(queryByRole('button', { name: 'Undo' })).toBeNull();
    expect(queryByRole('button', { name: 'Align center' })).toBeNull();
  });
});
