import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const ROOT_ID = 'minha-automacao-host';

function injectApp() {
    if (document.getElementById(ROOT_ID)) return;

    // 1. Create Host Element
    const host = document.createElement('div');
    host.id = ROOT_ID;
    document.body.appendChild(host);

    // 2. Create Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // 3. Mount Point inside Shadow DOM
    const root = document.createElement('div');
    root.id = 'react-root';
    shadow.appendChild(root);

    // 4. Inject Styles (if we had external CSS files, we would link them here)
    // For now, App.jsx uses inline styles, so this is clean.
    // If we build CSS, we might need to fetch it and inject it here.
    // Since we are using Vite to build a single JS file (mostly), 
    // styles imported in JS will be injected into the head by Vite's CSS loader usually.
    // BUT, inside Shadow DOM, head styles don't apply. 
    // For this setup (Inline Styles in App.jsx), it works out of the box.
    
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
}

// Retry injection until body is ready
const interval = setInterval(() => {
    if (document.body) {
        injectApp();
        clearInterval(interval);
    }
}, 1000);
