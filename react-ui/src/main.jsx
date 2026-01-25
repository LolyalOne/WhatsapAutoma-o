import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Importa o CSS como string bruta para injetar no Shadow DOM
import styles from './styles/App.css?inline'

const ROOT_ID = 'minha-automacao-host';

function injectApp() {
    if (document.getElementById(ROOT_ID)) return;

    // 1. Host
    const host = document.createElement('div');
    host.id = ROOT_ID;
    document.body.appendChild(host);

    // 2. Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // 3. Injeção de Estilos (Isolamento Real)
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    shadow.appendChild(styleTag);

    // 4. Mount Point
    const root = document.createElement('div');
    root.id = 'react-root';
    shadow.appendChild(root);
    
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
}

const interval = setInterval(() => {
    if (document.body) {
        injectApp();
        clearInterval(interval);
    }
}, 1000);