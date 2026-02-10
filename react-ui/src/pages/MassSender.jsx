import React, { useState, useEffect } from 'react';
import { Send, Users, Pause, Play, Square, Image, Mic, MessageSquare } from 'lucide-react';
import ContactSelector from '../components/ContactSelector';

const MassSender = ({ isDark }) => {
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [mediaType, setMediaType] = useState("text"); // text, image, audio
  const [fileData, setFileData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [queueStatus, setQueueStatus] = useState({ status: 'idle', size: 0 });
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
        if (!window.ZapDB) return;
        const history = await window.ZapDB.getAll('send_history');
        const formattedLogs = history.reverse().slice(0, 50).map(item => {
            const time = new Date(item.date).toLocaleTimeString();
            const symbol = item.status === 'success' ? '✅' : '❌';
            return `[${time}] ${symbol} ${item.phone}: ${item.status === 'success' ? 'Enviado' : item.error}`;
        });
        setLogs(formattedLogs);
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MY_EXTENSION_RESP') {
        const { payload } = event.data;
        if (payload.action === 'ITEM_SUCCESS') addLog(`✅ Enviado: ${payload.phone}`);
        if (payload.action === 'ITEM_ERROR') addLog(`❌ Erro ${payload.phone}: ${payload.error}`);
        
        if (payload.action === 'QUEUE_UPDATED' || payload.action === 'QUEUE_STATUS') {
            setQueueStatus({ 
                status: payload.status || (payload.size > 0 ? 'running' : 'idle'), 
                size: payload.size 
            });
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
    reader.onload = () => setFileData({ base64: reader.result, name: file.name });
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    if (!numbers) return alert("Preencha os números");
    if (mediaType === 'text' && !message) return alert("Escreva uma mensagem");
    if (mediaType !== 'text' && !fileData) return alert("Selecione um arquivo");

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
    
    addLog(`📤 Adicionado ${numbersArray.length} à fila (${mediaType}).`);
  };

  const handleControl = (action) => {
      const command = action === 'pause' ? 'PAUSE_QUEUE' : (action === 'resume' ? 'RESUME_QUEUE' : 'STOP_QUEUE');
      window.postMessage({ type: "MY_EXTENSION_CMD", command }, '*');
  };

  const handleContactsImport = (selectedContacts) => {
    const numbersList = selectedContacts.map(c => c.number).join('\n');
    setNumbers(prev => prev ? prev + '\n' + numbersList : numbersList);
  };

  return (
    <div className="fade-in">
      {showSelector && <ContactSelector isDark={isDark} onClose={() => setShowSelector(false)} onImport={handleContactsImport} />}
      
      <div className="card" style={{ borderRadius: '20px', padding: '20px' }}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', alignItems: 'center'}}>
            <h4 style={{ margin: 0 }}>Disparo em Massa</h4>
            <button className="btn-secondary" style={{width:'auto', borderRadius: '20px', padding: '5px 15px'}} onClick={() => setShowSelector(true)}>
                <Users size={14} style={{marginRight:'5px'}}/> Importar
            </button>
        </div>

        {/* Seleção de Tipo de Mídia */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
                { id: 'text', label: 'Texto', icon: <MessageSquare size={14}/> },
                { id: 'image', label: 'Imagem', icon: <Image size={14}/> },
                { id: 'audio', label: 'Áudio', icon: <Mic size={14}/> }
            ].map(item => (
                <button 
                    key={item.id}
                    onClick={() => { setMediaType(item.id); setFileData(null); }}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        padding: '10px 5px', borderRadius: '15px', border: '1px solid var(--border-color)',
                        background: mediaType === item.id ? 'var(--wpp-green)' : 'var(--bg-app)',
                        color: mediaType === item.id ? 'white' : 'var(--text-secondary)',
                        fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    {item.icon} {item.label}
                </button>
            ))}
        </div>

        {mediaType !== 'text' && (
            <div style={{ marginBottom: '15px', background: 'var(--bg-panel)', padding: '10px', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <input 
                    type="file" 
                    id="media-upload"
                    accept={mediaType === 'image' ? 'image/*' : 'audio/*'} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                />
                <label htmlFor="media-upload" style={{ cursor: 'pointer', display: 'block', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {fileData ? `✅ ${fileData.name}` : `Clique para selecionar o ${mediaType === 'image' ? 'Arquivo de Imagem' : 'Áudio (mp3/ogg)'}`}
                </label>
            </div>
        )}
        
        {/* Painel de Controle da Fila */}
        {queueStatus.size > 0 && (
            <div style={{
                background: 'var(--bg-panel)', padding: '12px', borderRadius: '15px', marginBottom: '15px',
                border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <span style={{fontSize:'12px', fontWeight:'bold', color: 'var(--wpp-green)'}}>
                    {queueStatus.status === 'paused' ? '⏸️ Pausado' : '🚀 Enviando...'} 
                    <span style={{color: 'var(--text-secondary)', marginLeft:'5px'}}>({queueStatus.size})</span>
                </span>
                
                <div style={{display:'flex', gap:'8px'}}>
                    {queueStatus.status === 'running' ? (
                        <button onClick={() => handleControl('pause')} className="btn-secondary" style={{width:'32px', height:'32px', borderRadius: '50%', padding:0, display:'flex', alignItems:'center', justifyContent:'center'}} title="Pausar">
                            <Pause size={14} />
                        </button>
                    ) : (
                        <button onClick={() => handleControl('resume')} className="btn-primary" style={{width:'32px', height:'32px', borderRadius: '50%', padding:0, display:'flex', alignItems:'center', justifyContent:'center'}} title="Continuar">
                            <Play size={14} />
                        </button>
                    )}
                    <button onClick={() => handleControl('stop')} className="btn-secondary" style={{width:'32px', height:'32px', borderRadius: '50%', padding:0, display:'flex', alignItems:'center', justifyContent:'center', color: '#ea0038'}} title="Cancelar">
                        <Square size={14} fill="currentColor" />
                    </button>
                </div>
            </div>
        )}

        <textarea 
            className="input-field" 
            style={{height: '100px', resize: 'none', borderRadius: '15px', marginBottom: '10px', padding: '12px'}} 
            placeholder="551199999999&#10;551188888888" 
            value={numbers} 
            onChange={(e) => setNumbers(e.target.value)}
        ></textarea>
        
        <textarea 
            className="input-field" 
            style={{height: '80px', resize: 'none', borderRadius: '15px', marginBottom: '20px', padding: '12px'}} 
            placeholder={mediaType === 'image' ? "Legenda da imagem..." : "Sua mensagem aqui..."}
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
        ></textarea>
        
        <button 
            className="btn-primary" 
            style={{ borderRadius: '20px', padding: '12px', fontSize: '14px', boxShadow: '0 4px 10px rgba(0,168,132,0.2)' }} 
            onClick={handleSend} 
            disabled={queueStatus.size > 0 && queueStatus.status !== 'idle'}
        >
            {queueStatus.size > 0 ? 'Adicionar à Fila' : '🚀 Iniciar Disparo'}
        </button>
      </div>
      
      {logs.length > 0 && (
        <div className="card" style={{padding: '12px', background: 'var(--bg-input)', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '15px'}}>
            {logs.map((log, i) => (
                <div key={i} style={{
                    fontSize: '11px', 
                    marginBottom: '6px', 
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '4px',
                    color: log.includes('❌') ? '#ea0038' : (log.includes('✅') ? 'var(--wpp-green)' : 'var(--text-secondary)')
                }}>
                    {log}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default MassSender;