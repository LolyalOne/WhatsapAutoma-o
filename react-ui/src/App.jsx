import React, { useState } from 'react';
import { 
  LayoutDashboard, Send, Mic, MessageSquare, 
  Settings, ListFilter, X 
} from 'lucide-react';
import './styles/App.css';

// Importando as páginas
import Dashboard from './pages/Dashboard';
import MassSender from './pages/MassSender';
import CRMBoard from './pages/CRMBoard';
import AudioSender from './pages/AudioSender';
import QuickReplies from './pages/QuickReplies';
import SettingsScreen from './pages/SettingsScreen';
import { incrementSent, incrementFailed } from './utils/stats';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Listener Global para Estatísticas (Funciona independente da aba)
  useEffect(() => {
    const handleStats = (event) => {
        if (event.data && event.data.type === 'MY_EXTENSION_RESP') {
            const { payload } = event.data;
            if (payload.action === 'ITEM_SUCCESS') incrementSent();
            if (payload.action === 'ITEM_ERROR') incrementFailed();
        }
    };
    window.addEventListener('message', handleStats);
    return () => window.removeEventListener('message', handleStats);
  }, []);

  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: 'Dash' },
    { id: 'mass-sender', icon: <Send size={20}/>, label: 'Disparo' },
    { id: 'crm', icon: <ListFilter size={20}/>, label: 'CRM' },
    { id: 'audio', icon: <Mic size={20}/>, label: 'Áudio' },
    { id: 'quick', icon: <MessageSquare size={20}/>, label: 'Rápidas' },
    { id: 'settings', icon: <Settings size={20}/>, label: 'Config' },
  ];

  // Mapeamento de rotas
  const views = {
    dashboard: <Dashboard />,
    'mass-sender': <MassSender />,
    crm: <CRMBoard />,
    audio: <AudioSender />,
    quick: <QuickReplies />,
    settings: <SettingsScreen />
  };

  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)} 
        className="fade-in" 
        style={{
          position: 'fixed', bottom: '30px', right: '30px', width: '56px', height: '56px',
          backgroundColor: '#008069', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer', zIndex: 99999, color: 'white', transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Abrir Automação"
      >
        <LayoutDashboard size={26} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh',
      backgroundColor: '#d1d7db', zIndex: 99999, boxShadow: '-5px 0 20px rgba(0,0,0,0.15)',
      display: 'flex', fontFamily: '"Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '64px', backgroundColor: 'white', borderRight: '1px solid #d1d7db',
        display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', gap: '10px'
      }}>
        <div style={{width: '40px', height: '40px', background: '#008069', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '15px', fontWeight: 'bold'}}>Z</div>
        {menuItems.map(item => (
          <div key={item.id} onClick={() => setActiveTab(item.id)} style={{
              width: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: activeTab === item.id ? '#008069' : '#54656f',
              backgroundColor: activeTab === item.id ? '#daf6ef' : 'transparent', transition: 'all 0.2s'
            }} title={item.label}>
            {item.icon}
          </div>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <div style={{
          height: '60px', backgroundColor: '#f0f2f5', borderBottom: '1px solid #d1d7db',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px'
        }}>
          <h3 style={{fontSize: '16px', color: '#111b21', fontWeight: '600'}}>{menuItems.find(i => i.id === activeTab)?.label}</h3>
          <button onClick={() => setIsOpen(false)} style={{border: 'none', background: 'transparent', cursor: 'pointer', color: '#54656f'}}>
            <X size={24} />
          </button>
        </div>
        <div style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
          {views[activeTab]}
        </div>
      </div>
    </div>
  );
}

export default App;
