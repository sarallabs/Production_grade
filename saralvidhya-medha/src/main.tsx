import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './app-flow.css';
import './styles/catalog.css';

// Recover cleanly when a freshly deployed build invalidates cached lazy chunk hashes
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const last = Number(sessionStorage.getItem('sv_chunk_reload_at') || '0');
    if (Date.now() - last > 15_000) {
      sessionStorage.setItem('sv_chunk_reload_at', String(Date.now()));
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
