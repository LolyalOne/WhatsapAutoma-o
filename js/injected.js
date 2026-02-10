// js/injected.js
// VERSÃO: 2.1 - CORREÇÃO FINAL DE IDs E FEEDBACK DE UI

console.log("%c [MinhaExtensão] >>> RODANDO VERSÃO 2.1 <<< ", "background: #008069; color: white; font-weight: bold; font-size: 16px");

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

function error(msg, err) {
    console.error(`[MinhaExtensão] ❌ ERRO: ${msg}`, err);
    replyToExtension("ERROR_LOG", { msg: msg, details: err ? err.toString() : '' });
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// --- WORKER ---
setInterval(async () => {
    if (isPaused) return;
    if (messageQueue.length > 0 && !isProcessing && window.WPP && window.WPP.isReady) {
        isProcessing = true;
        const task = messageQueue.shift(); 
        replyToExtension("QUEUE_UPDATED", { size: messageQueue.length });
        try {
            await processMessageTask(task);
        } catch (err) {
            error(`Erro na fila: ${task.phone}`, err);
        } finally {
            if (messageQueue.length > 0 && !isPaused) {
                const delay = Math.floor(Math.random() * ((globalConfig.maxDelay - globalConfig.minDelay + 1) * 1000)) + (globalConfig.minDelay * 1000);
                await sleep(delay);
            }
            isProcessing = false;
            if (messageQueue.length === 0) {
                replyToExtension("QUEUE_UPDATED", { size: 0 });
                replyToExtension("BATCH_COMPLETE", {});
            }
        }
    }
}, 1000);

// --- Envio Individual ---
async function processMessageTask(task) {
    try {
        let targetId = task.phone.toString().replace(/\s+/g, '').trim();
        if (!targetId.includes('@')) {
            targetId = (targetId.length > 15 || targetId.includes('-')) ? targetId + '@g.us' : targetId + '@c.us';
        }

        const wid = window.WPP.util.createWid(targetId);
        const finalId = wid._serialized;

        let result;
        if (task.type === 'image' && task.file) {
            const blob = await (await fetch(task.file.base64)).blob();
            result = await window.WPP.chat.sendFileMessage(finalId, blob, { type: 'image', caption: task.message });
        } else if (task.type === 'audio' && task.file) {
            const blob = await (await fetch(task.file.base64)).blob();
            await window.WPP.chat.markIsRecording(finalId, 2000);
            await sleep(2000);
            result = await window.WPP.chat.sendFileMessage(finalId, blob, { type: 'audio', isPtt: true });
        } else {
            result = await window.WPP.chat.sendTextMessage(finalId, task.message);
        }

        if (result && (result.id || result.ack > 0)) {
            replyToExtension("ITEM_SUCCESS", { phone: task.phone });
        } else { throw new Error("Sem confirmação."); }
    } catch (err) {
        error(`Falha envio ${task.phone}`, err);
        replyToExtension("ITEM_ERROR", { phone: task.phone, error: err.message });
    }
}

// --- MENÇÃO GERAL (Versão 2.1 - Blindada contra espaços) ---
async function sendMentionAll(groupId, messageText) {
    if (!window.WPP) throw new Error("WPP Indisponível");

    // LIMPEZA ABSOLUTA NO BACKEND
    const cleanGroupId = groupId.toString().replace(/\s+/g, '').trim();
    log(`[MentionAll] Alvo Limpo: "${cleanGroupId}"`);

    try {
        const chat = await window.WPP.chat.get(cleanGroupId);
        if (!chat) throw new Error("Grupo não encontrado.");
        
        // Se o WPP falhar em detectar como grupo, tentamos forçar
        const participants = await window.WPP.group.getParticipants(chat.id).catch(async () => {
            log("[MentionAll] WPP hesitou. Forçando metadados...");
            await window.WPP.group.ensureGroup(chat.id);
            return await window.WPP.group.getParticipants(chat.id);
        });

        if (!participants || participants.length === 0) throw new Error("Não foi possível carregar membros.");

        const mentionedIds = participants.map(p => p.id._serialized || p.id);
        log(`[MentionAll] Disparando menção para ${mentionedIds.length} membros.`);

        return await window.WPP.chat.sendTextMessage(chat.id, messageText, {
            mentionedJidList: mentionedIds
        });

    } catch (err) {
        log(`[MentionAll] Erro: ${err.message}`);
        throw err;
    }
}

// --- Sync ---
async function syncContactsWithDB() {
    if (!window.WPP || !window.WPP.isReady || !window.ZapDB) return;
    try {
        const rawContacts = await window.WPP.contact.list();
        const cleanChunk = rawContacts
            .filter(c => c.id.server !== 'lid' && !c.isMe && c.id._serialized && (c.isMyContact || c.isGroup))
            .map(c => ({
                id: c.id._serialized.replace(/\s+/g, '').trim(),
                name: c.name || c.pushname || c.formattedName || "Sem Nome",
                number: c.id.user || "",
                isGroup: !!c.isGroup,
                avatar: typeof c.profilePicThumbObj?.img === 'string' ? c.profilePicThumbObj.img : null,
                labels: c.labels || []
            }));
        await window.ZapDB.saveContacts(cleanChunk);
    } catch (err) {}
}

// --- Listener Principal ---
window.addEventListener("message", async (event) => {
    if (event.source !== window || event.data.type !== "MY_EXTENSION_CMD") return;
    const { command, payload } = event.data;
    try {
        switch (command) {
            case "PAUSE_QUEUE": isPaused = true; break;
            case "RESUME_QUEUE": isPaused = false; break;
            case "STOP_QUEUE": isPaused = false; messageQueue.length = 0; break;
            case "UPDATE_CONFIG": if (payload) globalConfig = { ...globalConfig, ...payload }; break;
            case "ADD_TO_QUEUE":
                if (Array.isArray(payload.numbers)) {
                    payload.numbers.forEach(num => {
                        messageQueue.push({ 
                            phone: num, message: payload.message, type: payload.type || 'text', file: payload.file 
                        });
                    });
                    replyToExtension("QUEUE_UPDATED", { size: messageQueue.length });
                }
                break;
            case "SEND_MENTION_ALL":
                try {
                    await sendMentionAll(payload.groupId, payload.message);
                    replyToExtension("ITEM_SUCCESS", { phone: payload.groupId });
                } catch (e) {
                    replyToExtension("ITEM_ERROR", { phone: payload.groupId, error: e.message });
                }
                break;
            case "GET_CONTACTS":
                replyToExtension("CONTACTS_LIST", { contacts: await window.ZapDB.getAllContacts() });
                if (payload.forceRefresh) await syncContactsWithDB();
                break;
            case "GET_LABELS":
                const labels = await window.WPP.label.getAllLabels();
                replyToExtension("LABELS_LIST", { labels: labels.map(l => ({ id: l.id, name: l.name, color: l.hexColor })) });
                break;
        }
    } catch (err) { error(`Erro comando ${command}`, err); }
});

const init = setInterval(() => {
    if (window.WPP && window.WPP.isReady && window.ZapDB) {
        clearInterval(init);
        log("✅ Sistema v2.1 Pronto.");
        setTimeout(syncContactsWithDB, 3000); 
    } else if (window.WPP && window.WPP.webpack) {
        window.WPP.webpack.wait();
    }
}, 1000);
