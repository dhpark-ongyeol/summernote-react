import { useState } from 'react';
import { EXAMPLES, type Example } from '../examples';
import { useScrollSpy } from '../components/useScrollSpy';

const GROUPS = EXAMPLES.reduce<Record<string, Example[]>>((acc, ex) => {
  (acc[ex.group] ||= []).push(ex);
  return acc;
}, {});

const isWide = (): boolean => typeof window !== 'undefined' && window.innerWidth >= 1040;

export function Playground(): JSX.Element {
  const [open, setOpen] = useState(isWide);
  const activeId = useScrollSpy(EXAMPLES.map((e) => e.id)) || EXAMPLES[0].id;

  const closeOnNarrow = (): void => {
    if (!isWide()) setOpen(false);
  };

  return (
    <div className="page">
      <div className="page-col">
        <header className="pg-head">
          <h1 className="pg-title">
            Playground <span className="grad">·</span> live examples
          </h1>
          <p className="pg-tag">
            Every recipe below is a real <code>&lt;SummernoteEditor&gt;</code> running on the source engine — edit any of
            them right here. Copy the snippet under each card.
          </p>
        </header>

        <main className="sections">
          {EXAMPLES.map((ex) => (
            <section key={ex.id} id={ex.id} className="ex-section">
              <div className="ex-head">
                <h1>
                  <a className="anchor" href={`#${ex.id}`} aria-label={`Link to ${ex.title}`}>
                    #
                  </a>
                  {ex.emoji} {ex.title}
                </h1>
                <p>{ex.blurb}</p>
              </div>
              <ex.Component />
            </section>
          ))}
        </main>

        <footer className="foot">
          MIT · a port of <a href="https://summernote.org">summernote</a> · <code>@eaeao/summernote-react</code>
        </footer>
      </div>

      {/* bookmark rail — pinned to the right edge of .page, follows the scroll (sticky) */}
      <nav className={`bookmark${open ? ' open' : ''}`}>
        <div className="bookmark-bar">
          <span className="bookmark-heading">📑 Examples</span>
          <button className="iconbtn sm" onClick={() => setOpen((o) => !o)} aria-label="Toggle examples menu">
            {open ? '×' : '≡'}
          </button>
        </div>
        {open ? (
          <div className="bookmark-list">
            {Object.entries(GROUPS).map(([group, items]) => (
              <div key={group}>
                <div className="bookmark-group">{group}</div>
                {items.map((ex) => (
                  <a
                    key={ex.id}
                    href={`#${ex.id}`}
                    className={`bookmark-link${ex.id === activeId ? ' active' : ''}`}
                    onClick={closeOnNarrow}
                  >
                    <span className="emoji">{ex.emoji}</span>
                    {ex.title}
                  </a>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </nav>
    </div>
  );
}
