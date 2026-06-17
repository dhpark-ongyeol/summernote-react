import type { EditorState } from '@summernote/core';

/**
 * A single toolbar button, declaratively bound to the engine: it dispatches `command` and derives
 * its pressed/disabled state from the published EditorState. Buttons that need dropdowns, dialogs
 * or popovers (style/fontname/color/table/link/picture/video) arrive in later Phase-3b bricks.
 */
export interface ButtonSpec {
  /** registry key, also referenced from the toolbar config groups. */
  readonly key: string;
  /** command dispatched on click via `core.command(command)`. */
  readonly command: string;
  /** accessible name + native tooltip (icon-only buttons have no visible text). */
  readonly title: string;
  /** theme icon class (lite/bs* style these; faithful to summernote's `note-icon-*`). */
  readonly icon: string;
  /** derive the toggle/pressed state from the published EditorState. */
  readonly isActive?: (state: EditorState) => boolean;
  /** derive the disabled state from the published EditorState. */
  readonly isDisabled?: (state: EditorState) => boolean;
}

/** the buttons currently wired to a command in EditorCore. */
export const BUTTONS: Record<string, ButtonSpec> = {
  bold: { key: 'bold', command: 'bold', title: 'Bold', icon: 'note-icon-bold', isActive: (s) => s.bold },
  italic: { key: 'italic', command: 'italic', title: 'Italic', icon: 'note-icon-italic', isActive: (s) => s.italic },
  underline: {
    key: 'underline',
    command: 'underline',
    title: 'Underline',
    icon: 'note-icon-underline',
    isActive: (s) => s.underline,
  },
  strikethrough: {
    key: 'strikethrough',
    command: 'strikethrough',
    title: 'Strikethrough',
    icon: 'note-icon-strikethrough',
    isActive: (s) => s.strikethrough,
  },
  superscript: {
    key: 'superscript',
    command: 'superscript',
    title: 'Superscript',
    icon: 'note-icon-superscript',
    isActive: (s) => s.superscript,
  },
  subscript: {
    key: 'subscript',
    command: 'subscript',
    title: 'Subscript',
    icon: 'note-icon-subscript',
    isActive: (s) => s.subscript,
  },
  clear: { key: 'clear', command: 'removeFormat', title: 'Remove Font Style', icon: 'note-icon-eraser' },

  ul: {
    key: 'ul',
    command: 'insertUnorderedList',
    title: 'Unordered list',
    icon: 'note-icon-unorderedlist',
    isActive: (s) => s.unorderedList,
  },
  ol: {
    key: 'ol',
    command: 'insertOrderedList',
    title: 'Ordered list',
    icon: 'note-icon-orderedlist',
    isActive: (s) => s.orderedList,
  },
  justifyLeft: {
    key: 'justifyLeft',
    command: 'justifyLeft',
    title: 'Align left',
    icon: 'note-icon-align-left',
    isActive: (s) => s.align === 'left',
  },
  justifyCenter: {
    key: 'justifyCenter',
    command: 'justifyCenter',
    title: 'Align center',
    icon: 'note-icon-align-center',
    isActive: (s) => s.align === 'center',
  },
  justifyRight: {
    key: 'justifyRight',
    command: 'justifyRight',
    title: 'Align right',
    icon: 'note-icon-align-right',
    isActive: (s) => s.align === 'right',
  },
  justifyFull: {
    key: 'justifyFull',
    command: 'justifyFull',
    title: 'Justify full',
    icon: 'note-icon-align-justify',
    isActive: (s) => s.align === 'justify',
  },

  undo: {
    key: 'undo',
    command: 'undo',
    title: 'Undo',
    icon: 'note-icon-undo',
    isDisabled: (s) => !s.canUndo,
  },
  redo: {
    key: 'redo',
    command: 'redo',
    title: 'Redo',
    icon: 'note-icon-redo',
    isDisabled: (s) => !s.canRedo,
  },
};

/** `[groupName, buttonKeys]` — mirrors summernote's `options.toolbar` shape. */
export type ToolbarGroup = readonly [string, readonly string[]];

/**
 * Default toolbar covering every command currently wired in EditorCore. The full summernote
 * default (style/fontname/color/table/insert/view dropdowns + dialogs) lands as those controls
 * are built; the config shape is identical so it is a drop-in extension.
 */
export const DEFAULT_TOOLBAR: readonly ToolbarGroup[] = [
  ['font', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
  ['para', ['ul', 'ol', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull']],
  ['history', ['undo', 'redo']],
];
