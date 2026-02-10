import React, { useState, useEffect } from 'react';
import { Users, Send, MessageSquare, AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import ContactSelector from '../components/ContactSelector';

const GroupTools = ({ isDark }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [message, setMessage] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Escutar feedback do injected.js
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MY_EXTENSION_RESP') {
        const { action, phone, error } = event.data.payload;
        if (action === 'ITEM_SUCCESS' && selectedGroup && phone === selectedGroup.id) {
            addLog(`✅ Sucesso: Menção enviada para o grupo.`);
            setLoading(false);
        }
        if (action === 'ITEM_ERROR' && selectedGroup && phone === selectedGroup.id) {
            addLog(`❌ Erro: ${error}`);
            setLoading(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedGroup]);

  const addLog = (text) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev.slice(0, 19)]);

  const handleGroupImport = (selected) => {
    if (selected.length > 0) {
      const group = selected.find(c => c.isGroup);
      if (group) {
        // LIMPEZA ABSOLUTA DO ID NO REACT
        const cleanId = group.id.replace(/\s+/g, '').trim();
        setSelectedGroup({ ...group, id: cleanId });
        addLog(`📂 Grupo selecionado: ${group.name}`);
      }
    }
    setShowSelector(false);
  };

  const handleMentionAll = () => {
    if (!selectedGroup) return;
    if (!message) return alert("Escreva a mensagem.");

    setLoading(true);
    addLog(`⏳ Iniciando menção em "${selectedGroup.name}"...`);
    
    window.postMessage({
      type: "MY_EXTENSION_CMD",
      command: 'SEND_MENTION_ALL',
      payload: { 
        groupId: selectedGroup.id.trim(),
        message: message 
      }
    }, '*');
  };

  return (
    <div className="fade-in">
      {showSelector && <ContactSelector isDark={isDark} onClose={() => setShowSelector(false)} onImport={handleGroupImport} />}

      <div className="card" style={{ borderRadius: '15px' }}>
        <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={20} /> Mencionar Todos
        </h4>

        <div style={{ 
            background: 'var(--bg-panel)', padding: '15px', borderRadius: '12px', 
            marginBottom: '15px', border: '1px solid var(--border-color)' 
        }}>
          {selectedGroup ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--wpp-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedGroup.name}</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{selectedGroup.id}</p>
                </div>
              </div>
              <button className="btn-secondary" style={{ width: 'auto', padding: '4px 10px', borderRadius: '10px' }} onClick={() => setShowSelector(true)}>Trocar</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px', borderRadius: '20px' }} onClick={() => setShowSelector(true)}>
                Selecionar Grupo
              </button>
            </div>
          )}
        </div>

        <textarea 
          className="input-field" 
          style={{ height: '80px', resize: 'none', borderRadius: '12px', marginBottom: '15px', padding: '12px' }} 
          placeholder="Mensagem da menção..." 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>

        <button 
          className="btn-primary" 
          style={{ borderRadius: '20px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
          onClick={handleMentionAll}
          disabled={loading || !selectedGroup || !message}
        >
          {loading ? <RefreshCw size={18} className="spin" /> : <><Send size={18} /> Disparar Agora</>}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="card" style={{padding: '12px', background: 'var(--bg-input)', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '15px'}}>
            {logs.map((log, i) => (
                <div key={i} style={{
                    fontSize: '11px', marginBottom: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px',
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

export default GroupTools;