import React, { useState, useEffect } from 'react';
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
  const [isDark, setIsDark] = useState(false);

  // --- DETECTOR DE TEMA DO WHATSAPP ---
  useEffect(() => {
    const checkTheme = () => {
      const isDarkTheme = document.body.classList.contains('dark');
      setIsDark(isDarkTheme);
    };
    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Listener Global para Estatísticas
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
        onClick={() => {
            console.log("[MinhaUI] Abrindo sidebar...");
            setIsOpen(true);
        }} 
        className="fade-in" 
        style={{
          position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px',
          backgroundColor: '#00a884', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer', zIndex: 99999, color: 'white', transition: 'transform 0.2s',
          pointerEvents: 'auto' // Garante clique
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Abrir Automação"
      >
        <LayoutDashboard size={28} />
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark-theme' : ''} style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
        pointerEvents: 'none', // Deixa clicar no WhatsApp atrás
        zIndex: 99999
    }}>
      <div className="app-container" style={{
        position: 'absolute', top: 0, right: 0, width: '450px', height: '100%',
        boxShadow: '-5px 0 20px rgba(0,0,0,0.1)', display: 'flex',
        pointerEvents: 'auto' // Sidebar clicável
      }}>
        
        {/* Sidebar */}
        <div className="sidebar" style={{
          width: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', gap: '15px'
        }}>
          <div style={{width: '40px', height: '40px', background: 'var(--wpp-green)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '20px', fontWeight: 'bold'}}>Z</div>

          {menuItems.map(item => (
            <div 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '45px', height: '45px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: activeTab === item.id ? 'var(--wpp-green)' : 'var(--text-secondary)',
                backgroundColor: activeTab === item.id ? (isDark ? '#202c33' : '#e6f7f3') : 'transparent',
                transition: 'all 0.2s'
              }}
              title={item.label}
            >
              {item.icon}
            </div>
          ))}
        </div>

        {/* Área de Conteúdo */}
        <div className="content-area">
          <div className="header" style={{height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px'}}>
            <h3 style={{fontSize: '16px', fontWeight: '600'}}>{menuItems.find(i => i.id === activeTab)?.label}</h3>
            <button 
              onClick={() => setIsOpen(false)}
              style={{border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)'}}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
            {views[activeTab]}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;