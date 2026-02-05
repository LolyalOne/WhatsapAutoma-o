import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

console.log("[MinhaUI] Inicializando script da UI...");

const HOST_ID = 'z-automacao-host-v1';
const INNER_ROOT_ID = 'z-automacao-root';

function injectApp() {
    console.log("[MinhaUI] Tentando injetar App...");
    try {
        if (document.getElementById(HOST_ID)) {
            console.log("[MinhaUI] Host já existe.");
            return;
        }

        // 1. Host Container (Fica no DOM principal)
        const host = document.createElement('div');
        host.id = HOST_ID;
        host.style.position = 'fixed';
        host.style.zIndex = '99999';
        host.style.top = '0';
        host.style.left = '0';
        host.style.width = '0'; // Garante que não bloqueie nada visualmente
        host.style.height = '0';
        host.style.overflow = 'visible'; // Permite que o shadow content saia
        document.body.appendChild(host);

        // 2. Shadow DOM (Isolamento de Estilo e DOM)
        const shadow = host.attachShadow({ mode: 'open' }); // Mudei para closed para tentar evitar detecção, mas React precisa de open para eventos as vezes. Vamos manter open e mudar abordagem se falhar.

        // 3. Injeção do CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        try {
            link.href = chrome.runtime.getURL('ui/index.css');
        } catch (e) {
            link.href = './index.css'; 
        }
        shadow.appendChild(link);

        // 4. Ponto de Montagem do React (Dentro do Shadow)
        const root = document.createElement('div');
        root.id = INNER_ROOT_ID;
        shadow.appendChild(root);
        
        console.log("[MinhaUI] Criando React Root...");
        // Renderização
        ReactDOM.createRoot(root).render(<App />);
        console.log("[MinhaUI] App renderizado!");
        
    } catch (err) {
        console.error("[MinhaAutomacao] Falha ao injetar UI:", err);
    }
}

// Tenta injetar assim que possível
const interval = setInterval(() => {
    if (document.body) {
        injectApp();
        clearInterval(interval);
    }
}, 1000);