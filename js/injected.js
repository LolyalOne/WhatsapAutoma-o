// js/injected.js
// VERSÃO: Fila de Processamento (Queue Pattern)

console.log("[MinhaExtensão] %c Script Injetado Iniciado", "color: green; font-weight: bold; font-size: 14px");

// --- Estado Global ---
window.DebugExtensão = { logs: [] };
const messageQueue = []; // Fila de envio
let isProcessing = false; // Flag de processamento

// Configuração Padrão (Pode ser sobrescrita pelo React)
let globalConfig = {
    minDelay: 3,
    maxDelay: 10,
    isHuman: true
};

// --- Utilitários ---
function log(msg, data = null) {
    const logMsg = `[MinhaExtensão] ${msg}`;
    if (data) console.log(logMsg, data);
    else console.log(logMsg);
}

function error(msg, err) {
    console.error(`[MinhaExtensão] ❌ ERRO: ${msg}`, err);
    replyToExtension("ERROR_LOG", { msg: msg, details: err ? err.toString() : '' });
}

function replyToExtension(action, data) {
    window.postMessage({ type: "MY_EXTENSION_RESP", payload: { action, ...data } }, "*");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay() {
    const min = globalConfig.minDelay * 1000;
    const max = globalConfig.maxDelay * 1000;
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// --- WORKER: Processador da Fila ---
setInterval(async () => {
    // Só processa se houver itens, não estiver processando e o WPP estiver pronto
    if (messageQueue.length > 0 && !isProcessing && window.WPP && window.WPP.isReady) {
        isProcessing = true;
        const task = messageQueue.shift(); // Pega o primeiro da fila
        
        replyToExtension("QUEUE_UPDATED", { size: messageQueue.length }); // Avisa a UI

        try {
            await processMessageTask(task);
        } catch (err) {
            error(`Erro ao processar item da fila: ${task.phone}`, err);
        }
        
        // Delay Dinâmico
        if (messageQueue.length > 0) {
            const delay = randomDelay();
            log(`⏳ Aguardando ${delay/1000}s (Config: ${globalConfig.minDelay}-${globalConfig.maxDelay}s)...`);
            await sleep(delay);
        }
        
        isProcessing = false;
        
        // Se a fila zerou
        if (messageQueue.length === 0) {
            replyToExtension("QUEUE_UPDATED", { size: 0 });
            replyToExtension("BATCH_COMPLETE", {});
        }
    }
}, 1000);

// --- Lógica de Envio Individual ---
async function processMessageTask(task) {
    try {
        let cleanPhone = task.phone.replace(/\D/g, '');
        if (!cleanPhone) throw new Error("Número vazio");
        
        const originalId = cleanPhone.includes('@') ? cleanPhone : cleanPhone + '@c.us';
        let targetId = originalId;

        // Verifica existência
        const check = await window.WPP.contact.queryExists(originalId);
        if (check && check.wid) {
            targetId = check.lid ? check.lid._serialized : check.wid._serialized;
        } else {
            throw new Error("Número inválido ou sem WhatsApp");
        }

        // Simulação Humana (Condicional)
        if (globalConfig.isHuman) {
            await window.WPP.chat.markIsComposing(targetId, 1500);
            await sleep(1500);
        }

        // Variáveis Dinâmicas
        // Substitui {nome} pelo nome fornecido na task, ou vazio se não houver
        let textToSend = task.message;
        if (task.name) {
            textToSend = textToSend.replace(/{nome}/gi, task.name);
        } else {
            // Se não tem nome, remove a tag {nome} para não ficar feio
            textToSend = textToSend.replace(/{nome}/gi, '');
        }

        const result = await window.WPP.chat.sendTextMessage(targetId, textToSend);

        if (result && (result.id || result.ack > 0 || result === true)) {
            replyToExtension("ITEM_SUCCESS", { phone: task.phone });
        } else {
            throw new Error("Sem confirmação de entrega");
        }

    } catch (err) {
        replyToExtension("ITEM_ERROR", { phone: task.phone, error: err.message });
    }
}

// --- Listener Principal ---
window.addEventListener("message", async (event) => {
    if (event.source !== window || event.data.type !== "MY_EXTENSION_CMD") return;

    const { command, payload } = event.data;
    log(`Comando recebido: ${command}`, payload);

    try {
        switch (command) {
            case "UPDATE_CONFIG":
                // Atualiza configuração global
                if (payload) {
                    globalConfig = { ...globalConfig, ...payload };
                    log("Configurações atualizadas:", globalConfig);
                }
                break;

            case "ADD_TO_QUEUE":
                if (Array.isArray(payload.numbers)) {
                    // Agora aceita objetos {number, name} ou strings
                    payload.numbers.forEach(item => {
                        const phone = typeof item === 'string' ? item : item.number;
                        const name = typeof item === 'object' ? item.name : null;
                        messageQueue.push({ phone, name, message: payload.message });
                    });
                    log(`Adicionados ${payload.numbers.length} itens à fila.`);
                    replyToExtension("QUEUE_UPDATED", { size: messageQueue.length });
                }
                break;


            case "SEND_AUDIO":
                await sendAudioMessage(payload.phone, payload.base64, payload.fileName);
                break;

            case "GET_CONTACTS":
                await getContacts();
                break;
        }
    } catch (err) {
        error(`Erro no comando ${command}`, err);
    }
});

// --- Outras Funções (Áudio, Contatos) ---

async function sendAudioMessage(phone, base64, fileName) {
    if (!window.WPP || !window.WPP.chat) return error("WPP Indisponível");
    try {
        let cleanPhone = phone.replace(/\D/g, '');
        const id = cleanPhone.includes('@') ? cleanPhone : cleanPhone + '@c.us';
        const blob = await (await fetch(base64)).blob();
        
        await window.WPP.chat.markIsRecording(id, 2000); // Simula gravando
        await sleep(2000);

        const result = await window.WPP.chat.sendFileMessage(id, blob, {
            type: 'audio', isPtt: true, filename: fileName || 'audio.mp3'
        });
        if (result.id) replyToExtension("ITEM_SUCCESS", { phone });
    } catch (err) {
        replyToExtension("ITEM_ERROR", { phone, error: err.message });
    }
}

async function getContacts() {
    if (!window.WPP || !window.WPP.contact) return;
    const contacts = await window.WPP.contact.list();
    const valid = contacts.filter(c => (c.isMyContact || c.isGroup) && !c.isMe);
    const mapped = valid.map(c => ({
        id: c.id._serialized,
        name: c.name || c.pushname || c.formattedName || "Sem Nome",
        number: c.id.user,
        isGroup: c.isGroup,
        avatar: c.profilePicThumbObj ? c.profilePicThumbObj.img : null 
    }));
    replyToExtension("CONTACTS_LIST", { contacts: mapped });
}

// Inicialização
const init = setInterval(() => {
    if (window.WPP && window.WPP.isReady) {
        clearInterval(init);
        log("✅ Sistema Pronto. Fila Ativa.");
    } else if (window.WPP && window.WPP.webpack) {
        window.WPP.webpack.wait();
    }
}, 1000);