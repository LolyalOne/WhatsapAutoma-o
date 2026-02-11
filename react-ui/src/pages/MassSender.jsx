import React, { useState, useEffect } from 'react';
import { Send, Users, Pause, Play, Square, Image, Mic, Paperclip, X } from 'lucide-react';
import ContactSelector from '../components/ContactSelector';

const MassSender = ({ isDark }) => {
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [mediaType, setMediaType] = useState("text");
  const [fileData, setFileData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [queueStatus, setQueueStatus] = useState({ status: 'idle', size: 0 });
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MY_EXTENSION_RESP') {
        const { payload } = event.data;
        if (payload.action === 'ITEM_SUCCESS') addLog(`✅ Enviado: ${payload.phone}`);
        if (payload.action === 'ITEM_ERROR') addLog(`❌ Erro ${payload.phone}: ${payload.error}`);
        if (payload.action === 'QUEUE_UPDATED' || payload.action === 'QUEUE_STATUS') {
            setQueueStatus({ status: payload.status || (payload.size > 0 ? 'running' : 'idle'), size: payload.size });
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addLog = (text) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev.slice(0, 49)]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        setFileData({ base64: reader.result, name: file.name });
        setMediaType(file.type.startsWith('image') ? 'image' : 'audio');
    };
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    if (!numbers) return alert("Selecione os destinatários");
    const numbersArray = numbers.split(new RegExp('[\n,;]+')).map(n => n.trim()).filter(n => n);
    
    window.postMessage({
      type: "MY_EXTENSION_CMD",
      command: 'ADD_TO_QUEUE',
      payload: { 
        numbers: numbersArray, 
        message,
        type: mediaType,
        file: fileData
      }
    }, '*');
    addLog(`🚀 Iniciando disparo para ${numbersArray.length} alvos...`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      {showSelector && <ContactSelector isDark={isDark} onClose={() => setShowSelector(false)} onImport={(list) => setNumbers(prev => prev + (prev ? '\n' : '') + list.map(c => c.id).join('\n'))} />}
      
      {/* 1. Área de Destinatários (Compacta) */}
      <div className="card" style={{ padding: '10px', borderRadius: '12px', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>DESTINATÁRIOS (Pessoas ou Grupos)</span>
            <button className="btn-secondary" style={{ padding: '2px 8px', fontSize: '10px', borderRadius: '10px' }} onClick={() => setShowSelector(true)}>
                <Users size={12} style={{ marginRight: '4px' }}/> Adicionar
            </button>
        </div>
        <textarea 
            className="input-field" 
            style={{ height: '40px', fontSize: '11px', borderRadius: '8px', background: 'var(--bg-panel)' }} 
            placeholder="IDs ou Números aqui..." 
            value={numbers} 
            onChange={(e) => setNumbers(e.target.value)}
        ></textarea>
      </div>

      {/* 2. Área de Logs (Central) */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '10px', border: '1px solid var(--border-color)' }}>
        {queueStatus.size > 0 && (
            <div style={{ background: 'var(--wpp-green)', color: 'white', padding: '8px', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                {queueStatus.status === 'paused' ? '⏸️ FILA PAUSADA' : '🚀 PROCESSANDO FILA'} ({queueStatus.size} restantes)
            </div>
        )}
        {logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-placeholder)', fontSize: '12px', marginTop: '20%' }}>Aguardando início...</div>
        ) : (
            logs.map((log, i) => <div key={i} style={{ fontSize: '10px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{log}</div>)
        )}
      </div>

      {/* 3. Barra de Mensagem (Estilo WhatsApp) */}
      <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '15px', border: '1px solid var(--border-color)' }}>
        {fileData && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-panel)', padding: '5px 10px', borderRadius: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--wpp-green)' }}>📎 {fileData.name}</span>
                <X size={14} style={{ cursor: 'pointer' }} onClick={() => setFileData(null)} />
            </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
                <input type="file" id="mass-file" style={{ display: 'none' }} onChange={handleFileChange} />
                <label htmlFor="mass-file" style={{ cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px', display: 'block' }}>
                    <Paperclip size={20} />
                </label>
            </div>

            <textarea 
                className="input-field" 
                style={{ 
                    flex: 1, height: '40px', minHeight: '40px', maxHeight: '120px', 
                    borderRadius: '20px', padding: '10px 15px', fontSize: '13px',
                    border: 'none', background: 'var(--bg-panel)' 
                }} 
                placeholder="Mensagem..." 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
            ></textarea>

            <button 
                onClick={handleSend}
                disabled={queueStatus.size > 0}
                style={{ 
                    background: 'var(--wpp-green)', color: 'white', border: 'none', 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', opacity: (queueStatus.size > 0 || (!message && !fileData)) ? 0.5 : 1
                }}
            >
                <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default MassSender;
