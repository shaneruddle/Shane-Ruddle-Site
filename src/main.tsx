import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { preloaded } from './lib/preload';

const mount = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

// On article pages, load the article code first so the prerendered article stays on screen
// until the app can draw the same layout in its place.
if (/^\/articles(\/|$)/.test(window.location.pathname)) {
  import('./components/BlogPage')
    .then((m) => { preloaded.BlogPage = m.default; })
    .catch(() => {})
    .finally(mount);
} else {
  mount();
}
