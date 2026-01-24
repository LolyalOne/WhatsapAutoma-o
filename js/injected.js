// js/injected.js
// VERSÃO COM DEBUG DETALHADO

console.log("[MinhaExtensão] %c Script Injetado Iniciado", "color: green; font-weight: bold; font-size: 14px");

// Variável global para debug
window.DebugExtensão = {
    logs: []
};

function log(msg, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logMsg = `[MinhaExtensão ${timestamp}] ${msg}`;
    
    if (data) {
        console.log(logMsg, data);
        window.DebugExtensão.logs.push({ msg, data });
    } else {
        console.log(logMsg);
        window.DebugExtensão.logs.push({ msg });
    }
}

function error(msg, err) {
    const timestamp = new Date().toLocaleTimeString();
    console.error(`[MinhaExtensão ${timestamp}] ❌ ERRO: ${msg}`, err);
    window.DebugExtensão.logs.push({ error: msg, details: err });
    
    // Tenta avisar a extensão
    replyToExtension("ERROR_LOG", { msg: msg, details: err.toString() });
}

// --- Inicialização ---
const checkWPP = setInterval(() => {
    // Verifica se a biblioteca WPP existe
    if (typeof window.WPP === 'undefined') {
        log("Aguardando biblioteca WPP ser definida...");
        return;
    }

    if (window.WPP.isReady) {
        clearInterval(checkWPP);
        log("✅ WPP.isReady é verdadeiro! Sistema pronto.");
        startListener();
    } else {
        log("WPP existe, mas não está pronto. Chamando WPP.webpack.wait()...");
        if (window.WPP.webpack) {
            window.WPP.webpack.wait();
        }
    }
}, 1000);

// --- Ouvinte de Comandos ---
function startListener() {
    window.addEventListener("message", async (event) => {
        if (event.source !== window || event.data.type !== "MY_EXTENSION_CMD") return;

        const { command, payload } = event.data;
        log(`Recebido comando: ${command}`, payload);

        try {
            switch (command) {
                case "SEND_MESSAGE":
                    await sendMessage(payload.phone, payload.message);
                    break;
                
                case "SEND_BATCH":
                    await sendBatchMessages(payload.numbers, payload.message);
                    break;

                case "SEND_AUDIO":
                    await sendAudioMessage(payload.phone, payload.base64, payload.fileName);
                    break;
                
                case "CHECK_STATUS":
                    checkStatus();
                    break;

                case "GET_CONTACTS":
                    await getContacts();
                    break;
            }
        } catch (err) {
            error(`Falha fatal ao processar ${command}`, err);
        }
    });
}

// --- Funções Auxiliares ---

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(minSec, maxSec) {
    const min = minSec * 1000;
    const max = maxSec * 1000;
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// --- Funções da Automação ---

async function sendBatchMessages(numbers, text) {
    if (!window.WPP || !window.WPP.chat) {
        error("WPP não está pronto para envios em massa.");
        return;
    }

    const total = numbers.length;
    const report = { success: 0, failed: 0, details: [] };

    log(`🚀 Iniciando envio em massa para ${total} contatos.`);
    replyToExtension("BATCH_START", { total });

    for (let i = 0; i < total; i++) {
        const phone = numbers[i];
        const currentCount = i + 1;
        
        try {
            // 1. Validação de Número
            let cleanPhone = phone.replace(/\D/g, '');
            if (!cleanPhone) throw new Error("Número vazio");
            
            const originalId = cleanPhone.includes('@') ? cleanPhone : cleanPhone + '@c.us';
            let targetId = originalId;

            // Verifica existência (Anti-Ban: evita enviar para não-contas)
            const check = await window.WPP.contact.queryExists(originalId);
            if (check && check.wid) {
                targetId = check.lid ? check.lid._serialized : check.wid._serialized;
            } else {
                throw new Error("Número não registrado no WhatsApp");
            }

            // 2. Envio
            const result = await window.WPP.chat.sendTextMessage(targetId, text);

            if (result && (result.id || result.ack > 0 || result === true)) {
                report.success++;
                log(`[${currentCount}/${total}] Sucesso para ${phone}`);
            } else {
                throw new Error("Sem confirmação de entrega");
            }

        } catch (err) {
            report.failed++;
            report.details.push({ phone, error: err.message });
            log(`[${currentCount}/${total}] Falha para ${phone}: ${err.message}`);
        }

        // Reporta progresso para a UI
        replyToExtension("BATCH_PROGRESS", { 
            current: currentCount, 
            total, 
            success: report.success, 
            failed: report.failed 
        });

        // 3. Delay Humanizado (Anti-Ban)
        // Não espera depois do último envio
        if (i < total - 1) {
            const delay = randomDelay(3, 10); // 3 a 10 segundos
            log(`⏳ Aguardando ${delay/1000}s para o próximo envio...`);
            await sleep(delay);
        }
    }

    log("✅ Envio em massa finalizado.", report);
    replyToExtension("BATCH_COMPLETE", report);
}

async function sendMessage(phone, text) {
    if (!window.WPP || !window.WPP.chat) {
        error("WPP.chat não está disponível. O WhatsApp carregou totalmente?");
        return;
    }

    try {
        log(`Tentando enviar mensagem para ${phone}...`);
        
        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone) throw new Error("Número de telefone vazio.");

        // Garante o sufixo @c.us
        const originalId = cleanPhone.includes('@') ? cleanPhone : cleanPhone + '@c.us';
        
        // Variável para armazenar o ID final de envio (pode mudar para LID)
        let targetId = originalId;

        // 1. Verifica se o número existe e tenta obter o LID
        try {
            log(`Consultando existência para ${originalId}...`);
            const check = await window.WPP.contact.queryExists(originalId);
            
            if (check && check.wid) {
                // Se retornou um LID, usamos ele preferencialmente
                if (check.lid) {
                    targetId = check.lid._serialized;
                    log(`✅ LID encontrado: ${targetId}. Usando para envio seguro.`);
                } else {
                    log(`⚠️ Contato existe, mas sem LID. Usando ID original: ${originalId}`);
                }
            } else {
                throw new Error("O número não possui conta no WhatsApp.");
            }
        } catch (queryError) {
            // Se o queryExists falhar (como no erro No LID), logamos mas tentamos enviar mesmo assim
            // Isso serve de fallback caso a versão da lib esteja com bug no query
            log(`⚠️ Erro no queryExists (${queryError.message}). Tentando envio direto para ${targetId}...`);
        }

        // 2. Envia a mensagem usando o melhor ID disponível
        const result = await window.WPP.chat.sendTextMessage(targetId, text);
        
        if (result && (result.id || result.ack > 0 || result === true)) {
             replyToExtension("MSG_RESULT", { success: true, result });
        } else {
             replyToExtension("MSG_RESULT", { success: false, error: "Sem confirmação de envio." });
        }

    } catch (err) {
        error("Erro fatal no sendMessage", err);
        replyToExtension("MSG_RESULT", { success: false, error: err.toString() });
    }
}

async function sendAudioMessage(phone, base64, fileName) {
    if (!window.WPP || !window.WPP.chat) {
        error("WPP não está pronto.");
        return;
    }

    try {
        log(`Tentando enviar áudio para ${phone}...`);
        
        let cleanPhone = phone.replace(/\D/g, '');
        const id = cleanPhone.includes('@') ? cleanPhone : cleanPhone + '@c.us';

        // Converte Base64 para Blob para enviar
        const fetchResponse = await fetch(base64);
        const blob = await fetchResponse.blob();
        
        // Parâmetros cruciais: isPtt: true (envia como microfone azul)
        const result = await window.WPP.chat.sendFileMessage(
            id,
            blob,
            {
                type: 'audio',
                isPtt: true, // Segredo do "gravado na hora"
                filename: fileName || 'audio.mp3'
            }
        );

        if (result && (result.id || result.ack > 0 || result === true)) {
             replyToExtension("MSG_RESULT", { success: true, type: 'audio', id: result.id });
        } else {
             replyToExtension("MSG_RESULT", { success: false, error: "Sem confirmação de envio." });
        }

    } catch (err) {
        error("Erro ao enviar áudio", err);
        replyToExtension("MSG_RESULT", { success: false, error: err.toString() });
    }
}

function checkStatus() {
    try {
        const isRegistered = window.WPP.conn.isRegistered();
        const isMainReady = window.WPP.conn.isMainReady();
        
        log(`Status Check - Registered: ${isRegistered}, MainReady: ${isMainReady}`);
        
        replyToExtension("STATUS_RESULT", { 
            connected: isRegistered && isMainReady 
        });
    } catch (err) {
        error("Erro ao verificar status", err);
    }
}

async function getContacts() {
    try {
        log("Iniciando download de contatos...");
        
        if (!window.WPP || !window.WPP.contact) {
            throw new Error("Módulo WPP.contact não encontrado");
        }

        const contacts = await window.WPP.contact.list();
        log(`WPP retornou ${contacts.length} registros brutos.`);
        
        // Filtra contatos válidos (Meus contatos, Grupos ou conversas ativas)
        // Nota: Ajuste os filtros conforme a necessidade do produto
        const validContacts = contacts.filter(c => 
            (c.isMyContact || c.isGroup) && !c.isMe
        );

        // Mapeia para um formato leve para o React
        const mappedContacts = validContacts.map(c => ({
            id: c.id._serialized,
            name: c.name || c.pushname || c.formattedName || "Sem Nome",
            number: c.id.user,
            isGroup: c.isGroup,
            isBusiness: c.isBusiness,
            isMyContact: c.isMyContact,
            // Tenta pegar a url da imagem (thumb) se disponível em cache
            avatar: c.profilePicThumbObj ? c.profilePicThumbObj.img : null 
        }));
        
        log(`Filtrados ${mappedContacts.length} contatos válidos. Enviando para UI.`);
        
        // Envia para o React (UI)
        replyToExtension("CONTACTS_LIST", { contacts: mappedContacts });
        
    } catch (err) {
        error("Erro ao baixar contatos", err);
        replyToExtension("CONTACTS_ERROR", { error: err.toString() });
    }
}

function replyToExtension(action, data) {
    window.postMessage({
        type: "MY_EXTENSION_RESP",
        payload: { action, ...data }
    }, "*");
}
