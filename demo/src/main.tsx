import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

// editor stylesheets (relative to the source styles — the demo runs against ../src)
import '../../src/styles/summernote-lite.css';
import '../../src/styles/summernote-icons.css';
import '../../src/styles/themes/bs3.css';
import '../../src/styles/themes/bs4.css';
import '../../src/styles/themes/bs5.css';
import './demo.css';
import './docs.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
