// content.js

// 1. Injeção dos Scripts de Lógica (Main World)
function injectScript(file_path) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(file_path);
    script.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
}

// Injeta o CSS da UI
function injectCSS(file_path) {
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL(file_path);
    link.type = 'text/css';
    link.rel = 'stylesheet';
    (document.head || document.documentElement).appendChild(link);
}

// Inicialização
injectScript('js/wppconnect-wa.js');
setTimeout(() => { 
    injectScript('js/db.js'); // Banco de Dados (Dependência)
    setTimeout(() => {
        injectScript('js/injected.js'); // Lógica Principal
    }, 500); 
    injectCSS('ui/index.css'); 
}, 1000);

// Cria o Container para o React (Se o ui/index.js não criar, nós criamos)
// Nota: Como ui/index.js é um content script, ele roda no ISOLATED world,
// mas ele precisa de um elemento no DOM para se "pendurar".
// Vamos deixar o próprio React criar, mas garantir que o CSS esteja lá.

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

    // Tenta enviar para o Popup/Background se houver, mas silencia o erro se não houver ninguém ouvindo
    try {
        const promise = chrome.runtime.sendMessage(event.data.payload);
        // No Manifest V3, sendMessage retorna uma Promise.
        // Precisamos capturar o erro da Promise para não sujar o console.
        if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {
                // Silenciosamente ignora o erro "Receiving end does not exist"
            });
        }
    } catch (e) {
        // Ignora erros síncronos
    }
});