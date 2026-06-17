import type { EditorCore, EditorState } from '@summernote/core';
import { BUTTONS, DEFAULT_TOOLBAR, type ButtonSpec, type ToolbarGroup } from './buttons';

export interface ToolbarProps {
  /** the live engine (null until mounted); clicks no-op while null. */
  core: EditorCore | null;
  /** published active-state that drives pressed/disabled. */
  state: EditorState;
  /** `[group, buttonKeys]` config; defaults to every wired command. */
  config?: readonly ToolbarGroup[];
}

function ToolbarButton({
  spec,
  core,
  state,
}: {
  spec: ButtonSpec;
  core: EditorCore | null;
  state: EditorState;
}): JSX.Element {
  const active = spec.isActive ? spec.isActive(state) : false;
  const disabled = spec.isDisabled ? spec.isDisabled(state) : false;
  return (
    <button
      type="button"
      className={`note-btn note-btn-${spec.key}${active ? ' active' : ''}`}
      title={spec.title}
      aria-label={spec.title}
      aria-pressed={spec.isActive ? active : undefined}
      disabled={disabled}
      // keep the selection: a toolbar mousedown must not blur the editable
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => core?.command(spec.command)}
    >
      <i className={spec.icon} aria-hidden="true" />
    </button>
  );
}

/**
 * Renders the toolbar from a `[group, buttonKeys]` config. Stateless and fully driven by the
 * published EditorState — chrome re-renders here never touch the engine-owned editable subtree.
 * Preserves summernote's `.note-toolbar` / `.note-btn-group` / `.note-btn` class contract.
 */
export function Toolbar({ core, state, config = DEFAULT_TOOLBAR }: ToolbarProps): JSX.Element {
  return (
    <div className="note-toolbar" role="toolbar">
      {config.map(([group, keys]) => (
        <div key={group} className={`note-btn-group note-${group}`}>
          {keys.map((key) => {
            const spec = BUTTONS[key];
            return spec ? <ToolbarButton key={key} spec={spec} core={core} state={state} /> : null;
          })}
        </div>
      ))}
    </div>
  );
}
