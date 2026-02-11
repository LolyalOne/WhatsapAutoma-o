// content.js

// 1. Injeção dos Scripts de Lógica (Main World)
function injectScript(file_path) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(file_path);
    script.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
}

// Inicialização
injectScript('js/wppconnect-wa.js');
setTimeout(() => { 
    injectScript('js/db.js'); // Banco de Dados (Dependência)
    setTimeout(() => {
        injectScript('js/injected.js'); // Lógica Principal
    }, 500); 
    // O CSS agora é injetado APENAS no Shadow DOM via main.jsx
}, 1000);

// 2. Ouvir Popup -> Enviar para Página (Main World)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Repassa qualquer ação para o injected.js via postMessage
    window.postMessage({
        type: "MY_EXTENSION_CMD",
        command: request.action,
        payload: request
    }, "*");
    
    // Opcional: mantem canal aberto
    sendResponse({received: true});
});

// 3. Ouvir Página (Main World) -> Enviar para Popup
window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data.type || event.data.type !== "MY_EXTENSION_RESP") return;

    try {
        const promise = chrome.runtime.sendMessage(event.data.payload);
        if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {});
        }
    } catch (e) {}
});