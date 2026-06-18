import { EXAMPLES, EXAMPLE_KO, type Example } from '../examples';
import { useScrollSpy } from '../components/useScrollSpy';
import { useLocale } from '../components/useLocale';
import { t } from '../components/ui-strings';

const GROUPS = EXAMPLES.reduce<Record<string, Example[]>>((acc, ex) => {
  (acc[ex.group] ||= []).push(ex);
  return acc;
}, {});

export function Playground(): JSX.Element {
  const locale = useLocale();
  const s = t(locale).pg;
  const activeId = useScrollSpy(EXAMPLES.map((e) => e.id)) || EXAMPLES[0].id;

  const exTitle = (ex: Example): string => (locale === 'ko' && EXAMPLE_KO[ex.id] ? EXAMPLE_KO[ex.id].title : ex.title);
  const exBlurb = (ex: Example): string => (locale === 'ko' && EXAMPLE_KO[ex.id] ? EXAMPLE_KO[ex.id].blurb : ex.blurb);
  const groupLabel = (g: string): string => s.groups[g] ?? g;

  // Same shell as the docs pages: a left sidebar (the examples nav, grouped) + the content column.
  return (
    <div className="docs-shell">
      <aside className="docs-sidebar">
        <div className="docs-sidebar-head">{s.examplesHeading}</div>
        <nav>
          {Object.entries(GROUPS).map(([group, items]) => (
            <div key={group} className="docs-nav-group">
              <div className="docs-nav-section">{groupLabel(group)}</div>
              {items.map((ex) => (
                <a key={ex.id} href={`#${ex.id}`} className={`docs-nav-link${ex.id === activeId ? ' active' : ''}`}>
                  {exTitle(ex)}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="pg-main">
        <header className="pg-head">
          <h1 className="pg-title">
            {s.titlePre}
            <span className="grad">·</span>
            {s.titlePost}
          </h1>
          <p className="pg-tag">{s.tag}</p>
        </header>

        <main className="sections">
          {EXAMPLES.map((ex) => (
            <section key={ex.id} id={ex.id} className="ex-section">
              <div className="ex-head">
                <h1>
                  <a className="anchor" href={`#${ex.id}`} aria-label={`Link to ${ex.title}`}>
                    #
                  </a>
                  {ex.emoji} {exTitle(ex)}
                </h1>
                <p>{exBlurb(ex)}</p>
              </div>
              <ex.Component />
            </section>
          ))}
        </main>

        <footer className="foot">
          MIT · a port of <a href="https://summernote.org">summernote</a> · <code>@eaeao/summernote-react</code>
        </footer>
      </div>
    </div>
  );
}
