import { lazy, Suspense, type ReactElement } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout';
import { Home } from './pages/Home';

// Home stays eager: it renders a live editor, so the summernote engine belongs in the initial chunk
// (Playground reuses the same shared engine). The docs subtree owns the heavy markdown + highlight.js
// stack and the playground owns the 12 example wrappers — lazy-load both so neither weighs down '/'.
const DocsLayout = lazy(() => import('./pages/DocsLayout').then((m) => ({ default: m.DocsLayout })));
const DocsPage = lazy(() => import('./pages/DocsPage').then((m) => ({ default: m.DocsPage })));
const Playground = lazy(() => import('./pages/Playground').then((m) => ({ default: m.Playground })));

const lazyEl = (node: ReactElement): ReactElement => (
  <Suspense fallback={<div className="route-fallback" />}>{node}</Suspense>
);

// The site routes, locale-agnostic. They are mounted twice: once unprefixed (English, the default)
// and once under '/ko'. The active locale is derived from the URL via useLocale(); each page loads
// its own localized content, so the same elements serve both trees.
const inner: RouteObject[] = [
  { index: true, element: <Home /> },
  {
    path: 'docs',
    element: lazyEl(<DocsLayout />),
    children: [
      { index: true, element: lazyEl(<DocsPage slug="readme" />) },
      { path: ':slug', element: lazyEl(<DocsPage />) },
    ],
  },
  { path: 'playground', element: lazyEl(<Playground />) },
];

// BASE_URL is '/summernote-react/' in a production build, '/' in dev. The router basename must
// track it (so a forked/renamed Pages path keeps working) — strip the trailing slash for v6.
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter(
  [
    {
      element: <SiteLayout />,
      children: [
        ...inner,
        { path: 'ko', children: [...inner, { path: '*', element: <Navigate to="/ko" replace /> }] },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: BASENAME },
);
