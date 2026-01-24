import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Send, Mic, MessageSquare,
  Settings, Users, Play, Pause, ListFilter, X
} from 'lucide-react';
import './styles/App.css';
import ContactSelector from './components/ContactSelector'; // Importar novo componente

// --- COMPONENTES DAS TELAS ---

const Dashboard = () => (
  <div className="fade-in">
    <div className="card" style={{background: 'linear-gradient(135deg, #00a884 0%, #008f6f 100%)', color: 'white'}}>
      <h3>Bem-vindo, Usuário</h3>
      <p style={{opacity: 0.9, fontSize: '13px', marginTop: '5px'}}>Sua licença expira em 30 dias</p>
    </div>
    
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
      <div className="card" style={{textAlign: 'center'}}>
        <h2 style={{color: 'var(--wpp-green)'}}>120</h2>
        <span style={{fontSize: '12px', color: '#666'}}>Envios Hoje</span>
      </div>
      <div className="card" style={{textAlign: 'center'}}>
        <h2 style={{color: 'var(--danger)'}}>2</h2>
        <span style={{fontSize: '12px', color: '#666'}}>Falhas</span>
      </div>
    </div>
  </div>
);

const MassSender = () => {
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showSelector, setShowSelector] = useState(false); // Estado para o modal

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MY_EXTENSION_RESP') {
        const { payload } = event.data;
        if (payload.action === 'BATCH_PROGRESS' || payload.action === 'MSG_RESULT') {
           addLog(`[${new Date().toLocaleTimeString()}] ${JSON.stringify(payload)}`);
        }
        if (payload.action === 'BATCH_COMPLETE') {
           setIsSending(false);
           addLog(`✅ Envio finalizado!`);
        }
        if (payload.action === 'BATCH_START') {
            addLog(`🚀 Iniciado envio para ${payload.total} contatos.`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addLog = (text) => {
    setLogs(prev => [text, ...prev]);
  };

  const handleSend = () => {
    if (!numbers || !message) return alert("Preencha números e mensagem");
    
    setIsSending(true);
    const numbersArray = numbers.split(new RegExp('[\n,;]+')).map(n => n.trim()).filter(n => n);
    
    addLog(`🚀 Iniciando envio para ${numbersArray.length} contatos...`);

    window.postMessage({
      type: "MY_EXTENSION_CMD",
      command: 'SEND_BATCH',
      payload: {
        numbers: numbersArray,
        message: message
      }
    }, '*');
  };

  // Função chamada quando o usuário seleciona contatos no Modal
  const handleContactsImport = (selectedContacts) => {
    const numbersList = selectedContacts.map(c => c.number).join('\n');
    setNumbers(prev => prev ? prev + '\n' + numbersList : numbersList);
  };

  return (
    <div className="fade-in" style={{position: 'relative', height: '100%'}}>
      
      {/* Modal de Seleção (Renderização Condicional) */}
      {showSelector && (
        <ContactSelector 
          onClose={() => setShowSelector(false)} 
          onImport={handleContactsImport}
        />
      )}

      <div className="card">
        <h4 style={{marginBottom: '10px'}}>Disparo em Massa</h4>
        
        {/* Botão de Importar */}
        <button 
            className="btn-primary" 
            style={{marginBottom: '10px', backgroundColor: '#eef2f5', color: '#333', border: '1px solid #ddd'}}
            onClick={() => setShowSelector(true)}
        >
            <Users size={16} /> Importar da Agenda
        </button>

        <textarea 
          className="input-field" 
          style={{height: '100px', marginBottom: '10px', resize: 'none'}}
          placeholder="551199999999&#10;551188888888"
          value={numbers}
          onChange={(e) => setNumbers(e.target.value)}
        ></textarea>
        <textarea 
          className="input-field" 
          style={{height: '80px', marginBottom: '10px', resize: 'none'}}
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
        
        <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
          <button className="btn-primary" style={{backgroundColor: '#f0f2f5', color: '#333'}}>📎 Anexo</button>
          <button 
            className="btn-primary" 
            onClick={handleSend}
            disabled={isSending}
            style={{opacity: isSending ? 0.7 : 1}}
          >
            {isSending ? 'Enviando...' : '🚀 Enviar'}
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="card" style={{marginTop: '20px', padding: '10px'}}>
            <h4 style={{fontSize: '14px', marginBottom: '10px'}}>Logs:</h4>
            <div style={{
                backgroundColor: '#f0f2f5',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '11px',
                height: '150px',
                overflowY: 'auto',
                border: '1px solid #e9edef',
                fontFamily: 'monospace'
            }}>
                {logs.map((log, i) => (
                    <div key={i} style={{marginBottom: '5px', borderBottom: '1px solid #eee'}}>{log}</div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

const CRMBoard = () => (
  <div className="fade-in">
    <div className="card">
      <h4>CRM Kanban</h4>
      <p style={{fontSize: '13px', color: '#666', marginBottom: '15px'}}>Organize seus leads por colunas.</p>
      
      <div style={{display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px'}}>
        {['Novos', 'Negociação', 'Fechados'].map(col => (
          <div key={col} style={{minWidth: '120px', background: '#f0f2f5', padding: '10px', borderRadius: '8px'}}>
            <strong style={{fontSize: '12px'}}>{col}</strong>
            <div style={{marginTop: '10px', height: '40px', background: 'white', borderRadius: '4px', border: '1px solid #ddd'}}></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AudioSender = () => (
  <div className="fade-in">
    <div className="card">
      <h4>Áudio como Gravado</h4>
      <div style={{border: '2px dashed #ccc', borderRadius: '8px', padding: '20px', textAlign: 'center', margin: '15px 0', cursor: 'pointer'}}>
        <Mic size={32} color="#ccc" />
        <p style={{fontSize: '12px', color: '#999'}}>Arraste um .mp3 ou clique para gravar</p>
      </div>
      <button className="btn-primary">Gerenciar Áudios</button>
    </div>
  </div>
);

const QuickReplies = () => (
  <div className="fade-in">
     <div className="card">
      <h4>Mensagens Rápidas</h4>
      <div className="input-field" style={{padding: '10px', marginBottom: '10px', cursor: 'pointer', borderLeft: '4px solid var(--wpp-green)'}}>
        <strong>/saudacao</strong><br/>
        <span style={{fontSize: '12px', color: '#666'}}>Olá! Como posso ajudar você hoje?</span>
      </div>
       <div className="input-field" style={{padding: '10px', cursor: 'pointer', borderLeft: '4px solid var(--warning)'}}>
        <strong>/pix</strong><br/>
        <span style={{fontSize: '12px', color: '#666'}}>Nossa chave PIX é: ...</span>
      </div>
     </div>
  </div>
);

const SettingsScreen = () => (
  <div className="fade-in">
    <div className="card">
      <h4>Configurações de Envio</h4>
      <div style={{marginTop: '15px'}}>
        <label style={{fontSize: '13px', fontWeight: '600'}}>Intervalo Mínimo (seg)</label>
        <input type="range" min="1" max="60" style={{width: '100%', accentColor: 'var(--wpp-green)'}} />
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666'}}>
          <span>1s</span>
          <span>60s</span>
        </div>
      </div>
      
       <div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
        <input type="checkbox" id="human" style={{width: '16px', height: '16px'}} />
        <label htmlFor="human" style={{fontSize: '13px'}}>Simular Digitação Humana</label>
      </div>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

function App() {
  const [isOpen, setIsOpen] = useState(false); // Começa fechado (bolinha)
  const [activeTab, setActiveTab] = useState('dashboard');

  // Menu de Navegação
  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: 'Dash' },
    { id: 'mass-sender', icon: <Send size={20}/>, label: 'Disparo' },
    { id: 'crm', icon: <ListFilter size={20}/>, label: 'CRM' },
    { id: 'audio', icon: <Mic size={20}/>, label: 'Áudio' },
    { id: 'quick', icon: <MessageSquare size={20}/>, label: 'Rápidas' },
    { id: 'settings', icon: <Settings size={20}/>, label: 'Config' },
  ];

  // Renderiza a tela correta baseada na aba
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />; 
      case 'mass-sender': return <MassSender />; 
      case 'crm': return <CRMBoard />; 
      case 'audio': return <AudioSender />; 
      case 'quick': return <QuickReplies />; 
      case 'settings': return <SettingsScreen />; 
      default: return <Dashboard />; 
    }
  };

  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        className="fade-in"
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px',
          backgroundColor: '#00a884', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer', zIndex: 99999,
          color: 'white'
        }}
      >
        <LayoutDashboard size={28} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0,
      width: '450px', height: '100vh',
      backgroundColor: '#f0f2f5', zIndex: 99999,
      boxShadow: '-5px 0 20px rgba(0,0,0,0.1)',
      display: 'flex',
      fontFamily: '"Segoe UI", sans-serif'
    }}>
      
      {/* Sidebar de Navegação (Esquerda Estreita) */}
      <div style={{
        width: '70px', backgroundColor: 'white',
        borderRight: '1px solid #e9edef',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: '20px', gap: '15px'
      }}>
        {/* Logo/Header */}
        <div style={{width: '40px', height: '40px', background: '#00a884', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '20px', fontWeight: 'bold'}}>
          Z
        </div>

        {menuItems.map(item => (
          <div 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              width: '45px', height: '45px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: activeTab === item.id ? '#00a884' : '#54656f',
              backgroundColor: activeTab === item.id ? '#e6f7f3' : 'transparent',
              transition: 'all 0.2s'
            }}
            title={item.label}
          >
            {item.icon}
          </div>
        ))}
      </div>

      {/* Área Principal */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', height: '100vh'}}>
        
        {/* Cabeçalho */}
        <div style={{
          height: '60px', backgroundColor: 'white',
          borderBottom: '1px solid #e9edef',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px'
        }}>
          <h3 style={{fontSize: '16px', color: '#111b21'}}>{menuItems.find(i => i.id === activeTab)?.label}</h3>
          <button 
            onClick={() => setIsOpen(false)}
            style={{border: 'none', background: 'transparent', cursor: 'pointer', color: '#54656f'}}
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo Scrollável */}
        <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
          {renderContent()}
        </div>

        {/* Footer (Opcional) */}
        <div style={{padding: '10px 20px', textAlign: 'center', fontSize: '11px', color: '#aaa'}}>
          v1.0.0 Pro - Conectado
        </div>

      </div>
    </div>
  );
}

export default App;