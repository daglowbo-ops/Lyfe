import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './store/AppProvider.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);

// Remove the obsolete offline layer from browsers that installed an earlier
// Fieldnote build. Personal records now come exclusively from Supabase.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(
    registrations
      .filter((registration) => registration.active?.scriptURL.endsWith('/sw.js'))
      .map((registration) => registration.unregister()),
  )).catch(() => undefined);
}
if ('caches' in window) {
  caches.keys().then((keys) => Promise.all(
    keys.filter((cacheKey) => cacheKey.startsWith('fieldnote-shell-')).map((cacheKey) => caches.delete(cacheKey)),
  )).catch(() => undefined);
}
