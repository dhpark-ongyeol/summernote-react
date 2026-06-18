import { Outlet } from 'react-router-dom';
import { DocsSidebar } from '../components/DocsSidebar';

export function DocsLayout(): JSX.Element {
  return (
    <div className="docs-shell">
      <DocsSidebar />
      <Outlet />
    </div>
  );
}
