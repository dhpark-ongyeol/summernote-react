import { useEffect, useState } from 'react';
import { EXAMPLES, type Example } from './examples';

const GROUPS = EXAMPLES.reduce<Record<string, Example[]>>((acc, ex) => {
  (acc[ex.group] ||= []).push(ex);
  return acc;
}, {});

export function App(): JSX.Element {
  const [activeId, setActiveId] = useState(EXAMPLES[0].id);
  const [dark, setDark] = useState(false);
  const active = EXAMPLES.find((e) => e.id === activeId) ?? EXAMPLES[0];

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">✦</div>
          <div>
            <div className="brand-name">summernote&#8209;react</div>
            <div className="brand-sub">@eaeao · v1.0</div>
          </div>
        </div>
        <nav className="nav">
          {Object.entries(GROUPS).map(([group, items]) => (
            <div key={group}>
              <div className="nav-group">{group}</div>
              {items.map((ex) => (
                <button
                  key={ex.id}
                  className={`nav-item${ex.id === activeId ? ' active' : ''}`}
                  onClick={() => setActiveId(ex.id)}
                >
                  <span className="emoji">{ex.emoji}</span>
                  {ex.title}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main">
        <div className="topbar">
          <span className="pill">npm i @eaeao/summernote-react</span>
          <span className="spacer" />
          <a className="iconbtn" href="https://www.npmjs.com/package/@eaeao/summernote-react" title="npm" target="_blank" rel="noreferrer">
            📦
          </a>
          <a className="iconbtn" href="https://github.com/eaeao/summernote-react" title="GitHub" target="_blank" rel="noreferrer">
            🐙
          </a>
          <button className="iconbtn" onClick={() => setDark((d) => !d)} title="Toggle light / dark" aria-label="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        <main className="content">
          <div className="ex-head">
            <h1>
              {active.emoji} {active.title}
            </h1>
            <p>{active.blurb}</p>
          </div>
          <div key={active.id}>
            <active.Component />
          </div>
        </main>
      </div>
    </div>
  );
}
