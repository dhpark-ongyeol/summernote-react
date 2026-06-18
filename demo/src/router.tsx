import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout';
import { Home } from './pages/Home';
import { DocsLayout } from './pages/DocsLayout';
import { DocsPage } from './pages/DocsPage';
import { Playground } from './pages/Playground';

// BASE_URL is '/summernote-react/' in a production build, '/' in dev. The router basename must
// track it (so a forked/renamed Pages path keeps working) — strip the trailing slash for v6.
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter(
  [
    {
      element: <SiteLayout />,
      children: [
        { index: true, element: <Home /> },
        {
          path: 'docs',
          element: <DocsLayout />,
          children: [
            { index: true, element: <DocsPage slug="readme" /> },
            { path: ':slug', element: <DocsPage /> },
          ],
        },
        { path: 'playground', element: <Playground /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: BASENAME },
);
