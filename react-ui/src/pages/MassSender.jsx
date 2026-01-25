import React, { useState, useEffect } from 'react';
import { Send, Users } from 'lucide-react';
import ContactSelector from '../components/ContactSelector';

const MassSender = () => {
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MY_EXTENSION_RESP') {
        const { payload } = event.data;
        // Feedback de item individual processado pela fila
        if (payload.action === 'ITEM_SUCCESS') {
           addLog(`✅ Enviado: ${payload.phone}`);
        }
        if (payload.action === 'ITEM_ERROR') {
           addLog(`❌ Erro ${payload.phone}: ${payload.error}`);
        }
        if (payload.action === 'QUEUE_UPDATED') {
            addLog(`📥 Na fila: ${payload.size} mensagens.`);
            if (payload.size > 0) setIsSending(true);
            else setIsSending(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addLog = (text) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev]);

  const handleSend = () => {
    if (!numbers || !message) return alert("Preencha todos os campos");
    
    const numbersArray = numbers.split(new RegExp('[\n,;]+')).map(n => n.trim()).filter(n => n);
    
    // MUDANÇA: Envia para a FILA, não processa direto aqui.
    window.postMessage({
      type: "MY_EXTENSION_CMD",
      command: 'ADD_TO_QUEUE',
      payload: { numbers: numbersArray, message }
    }, '*');
    
    setIsSending(true);
    addLog(`📤 Enviando ${numbersArray.length} contatos para a fila de processamento...`);
  };

  const handleContactsImport = (selectedContacts) => {
    const numbersList = selectedContacts.map(c => c.number).join('\n');
    setNumbers(prev => prev ? prev + '\n' + numbersList : numbersList);
  };

  return (
    <div className="fade-in">
      {showSelector && <ContactSelector onClose={() => setShowSelector(false)} onImport={handleContactsImport} />}
      
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
            <h4>Disparo em Massa (Fila)</h4>
            <button className="btn-secondary" style={{width:'auto'}} onClick={() => setShowSelector(true)}>
                <Users size={14} style={{marginRight:'5px'}}/> Importar
            </button>
        </div>
        <textarea className="input-field" style={{height: '100px', resize: 'none'}} placeholder="551199999999" value={numbers} onChange={(e) => setNumbers(e.target.value)}></textarea>
        <textarea className="input-field" style={{height: '80px', resize: 'none'}} placeholder="Sua mensagem aqui..." value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
        <button className="btn-primary" onClick={handleSend} disabled={isSending}>
            {isSending ? 'Processando Fila...' : '🚀 Enviar para Fila'}
        </button>
      </div>
      
      {logs.length > 0 && (
        <div className="card" style={{padding: '10px', background: '#f0f2f5', maxHeight: '150px', overflowY: 'auto'}}>
            {logs.map((log, i) => <div key={i} style={{fontSize: '11px', marginBottom: '4px', borderBottom: '1px solid #ddd'}}>{log}</div>)}
        </div>
      )}
    </div>
  );
};

export default MassSender;
