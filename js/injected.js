// js/injected.js
// VERSÃO: 2.6 - BYPASS DE VALIDAÇÃO E FEEDBACK REAL DE ERROS

console.log("%c [MinhaExtensão] >>> RODANDO VERSÃO 2.6 <<< ", "background: #008069; color: white; font-weight: bold; font-size: 16px");

const messageQueue = [];
let isProcessing = false;
let isPaused = false; 
let globalConfig = { minDelay: 3, maxDelay: 10, isHuman: true };

function replyToExtension(action, data) {
    window.postMessage({ type: "MY_EXTENSION_RESP", payload: { action, ...data } }, "*");
}

function log(msg, data = null) {
    console.log(`[MinhaExtensão] ${msg}`, data || "");
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// --- WORKER DE FILA ---
setInterval(async () => {
    if (isPaused || !window.WPP?.isReady) return;
    if (messageQueue.length > 0 && !isProcessing) {
        isProcessing = true;
        const task = messageQueue.shift(); 
        replyToExtension("QUEUE_UPDATED", { size: messageQueue.length });
        try {
            const cleanId = task.phone.toString().replace(/\s+/g, '').trim();
            await window.WPP.chat.sendTextMessage(cleanId, task.message);
            replyToExtension("ITEM_SUCCESS", { phone: task.phone });
        } catch (err) {
            replyToExtension("ITEM_ERROR", { phone: task.phone, error: err.message });
        } finally {
            await sleep(2000);
            isProcessing = false;
        }
    }
}, 1000);

// --- MENÇÃO GERAL (Versão 2.6 - Força Bruta) ---
async function sendMentionAll(groupId, messageText) {
    if (!window.WPP) throw new Error("WPP Indisponível");

    const cleanGroupId = groupId.toString().replace(/\s+/g, '').trim();
    log(`[MentionAll] Iniciando em: ${cleanGroupId}`);

    try {
        // 1. Tenta pegar o objeto de chat direto da Store interna
        const chat = await window.WPP.chat.get(cleanGroupId);
        if (!chat) throw new Error("Chat não localizado.");

        // 2. Tenta pegar participantes por 3 caminhos diferentes (Bypass de validação)
        let participants = [];
        
        // Caminho A: Metadata do Grupo (Mais seguro contra erro "not a group")
        if (chat.groupMetadata && chat.groupMetadata.participants) {
            participants = chat.groupMetadata.participants;
            log("[MentionAll] Membros extraídos via Metadata.");
        } 
        // Caminho B: Propriedade direta
        else if (chat.participants) {
            participants = chat.participants;
            log("[MentionAll] Membros extraídos via Propriedade.");
        }
        // Caminho C: Função oficial (que costuma dar erro)
        else {
            log("[MentionAll] Tentando API oficial...");
            participants = await window.WPP.group.getParticipants(cleanGroupId);
        }

        if (!participants || participants.length === 0) {
            throw new Error("O WhatsApp ainda não carregou a lista de membros deste grupo.");
        }

        // 3. Extrair IDs limpos
        const mentionedIds = participants.map(p => {
            const id = p.id?._serialized || p.id || p;
            return id.toString().replace(/\s+/g, '');
        }).filter(id => id.includes('@'));

        log(`[MentionAll] ${mentionedIds.length} membros identificados.`);

        // 4. Enviar mensagem com a lista de menções
        // Se este comando falhar, o erro irá para a UI agora.
        return await window.WPP.chat.sendTextMessage(cleanGroupId, messageText, {
            mentionedList: mentionedIds
        });

    } catch (err) {
        log(`[MentionAll] Erro: ${err.message}`);
        throw err; // Re-lança para ser pego pelo switch case
    }
}

// --- Listener Principal ---
window.addEventListener("message", async (event) => {
    if (event.source !== window || event.data.type !== "MY_EXTENSION_CMD") return;
    const { command, payload } = event.data;

    try {
        switch (command) {
            case "SEND_MENTION_ALL":
                try {
                    await sendMentionAll(payload.groupId, payload.message);
                    replyToExtension("ITEM_SUCCESS", { phone: payload.groupId });
                } catch (e) {
                    // AGORA A UI RECEBE O ERRO
                    replyToExtension("ITEM_ERROR", { phone: payload.groupId, error: e.message });
                }
                break;
            case "ADD_TO_QUEUE":
                if (payload.numbers) {
                    payload.numbers.forEach(num => messageQueue.push({ phone: num, message: payload.message }));
                    replyToExtension("QUEUE_UPDATED", { size: messageQueue.length });
                }
                break;
            case "GET_CONTACTS":
                const cache = await window.ZapDB.getAllContacts();
                replyToExtension("CONTACTS_LIST", { contacts: cache });
                break;
        }
    } catch (err) {
        log(`Erro comando ${command}: ${err.message}`);
    }
});

const init = setInterval(() => {
    if (window.WPP && window.WPP.isReady) {
        clearInterval(init);
        log("✅ Sistema v2.6 Pronto.");
    }
}, 1000);
