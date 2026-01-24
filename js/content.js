// content.js

// 1. Injeção dos Scripts
function injectScript(file_path) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(file_path);
    script.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
}

injectScript('js/wppconnect-wa.js');
setTimeout(() => { injectScript('js/injected.js'); }, 1000);

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
    // Segurança: só aceita mensagens da própria janela e do nosso tipo
    if (event.source !== window || !event.data.type || event.data.type !== "MY_EXTENSION_RESP") return;

    // Envia para o Popup (background/runtime)
    try {
        chrome.runtime.sendMessage(event.data.payload);
    } catch (e) {
        // O popup pode estar fechado, ignorar erro
    }
});