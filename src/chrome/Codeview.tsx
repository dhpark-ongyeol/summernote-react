export interface CodeviewProps {
  value: string;
  onChange: (html: string) => void;
}

/**
 * Codeview textarea (the lite `codable`). Shows raw HTML for direct editing; SummernoteEditor
 * PURIFIES it (purifyCodeview — codeviewFilter:true, matching the legacy default) before syncing it
 * back into the engine on toggle-off — the codeview XSS gate. Preserves the .note-codable class.
 */
export function Codeview({ value, onChange }: CodeviewProps): JSX.Element {
  return (
    <textarea
      className="note-codable"
      aria-label="Code View"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  );
}
