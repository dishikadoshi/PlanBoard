/* =========================================================
   App entry point
   Loads the global styles, then mounts <App /> into the
   #root element of index.html.
   ========================================================= */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';

/* ---------- Styles ---------- */
// Order matters: global tokens first, then layout, then feature styles

import './styles/globals.css';
import './styles/layout.css';
import './styles/board.css';
import './styles/dashboard.css';
import './styles/dependencies.css';
import './styles/activity.css';
import './styles/modal.css';

/* ---------- Mount ---------- */

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
