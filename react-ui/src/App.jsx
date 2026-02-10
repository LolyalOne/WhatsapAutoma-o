import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Send, Mic, MessageSquare, 
  Settings, ListFilter, X, GripHorizontal, Users
} from 'lucide-react';
import './styles/App.css';

// Importando as páginas
import Dashboard from './pages/Dashboard';
import MassSender from './pages/MassSender';
import CRMBoard from './pages/CRMBoard';
import AudioSender from './pages/AudioSender';
import QuickReplies from './pages/QuickReplies';
import SettingsScreen from './pages/SettingsScreen';
import GroupTools from './pages/GroupTools';
import { incrementSent, incrementFailed } from './utils/stats';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);

  // --- ESTADOS PARA POSIÇÃO E ARRASTE ---
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // --- DETECTOR DE TEMA ---
  useEffect(() => {
    const checkTheme = () => {
      const isDarkTheme = document.body.classList.contains('dark');
      setIsDark(isDarkTheme);
    };
    checkTheme();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') checkTheme();
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

  // --- LÓGICA DE ARRASTAR ---
  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
        isDragging.current = true;
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging.current) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    if (isOpen) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);


  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: 'Dash' },
    { id: 'mass-sender', icon: <Send size={20}/>, label: 'Disparo' },
    { id: 'group-tools', icon: <Users size={20}/>, label: 'Grupos' },
    { id: 'crm', icon: <ListFilter size={20}/>, label: 'CRM' },
    { id: 'audio', icon: <Mic size={20}/>, label: 'Áudio' },
    { id: 'quick', icon: <MessageSquare size={20}/>, label: 'Rápidas' },
    { id: 'settings', icon: <Settings size={20}/>, label: 'Config' },
  ];

  const views = {
    dashboard: <Dashboard isDark={isDark} />,
    'mass-sender': <MassSender isDark={isDark} />,
    'group-tools': <GroupTools isDark={isDark} />,
    crm: <CRMBoard isDark={isDark} />,
    audio: <AudioSender isDark={isDark} />,
    quick: <QuickReplies isDark={isDark} />,
    settings: <SettingsScreen isDark={isDark} />
  };

  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)} 
        className="fade-in" 
        style={{
          position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px',
          backgroundColor: '#00a884', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer', zIndex: 99999, color: 'white', transition: 'transform 0.2s',
          pointerEvents: 'auto'
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
        pointerEvents: 'none', 
        zIndex: 99999
    }}>
      <div 
        className="app-container fade-in"
        onMouseDown={handleMouseDown}
        style={{
            position: 'absolute', 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            width: '600px', 
            height: '500px', 
            pointerEvents: 'auto'
        }}
      >
        
        {/* Sidebar */}
        <div className="sidebar drag-handle">
          <div style={{
              width: '40px', height: '40px', background: 'var(--wpp-green)', borderRadius: '10px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', 
              marginBottom: '20px', fontWeight: 'bold', cursor: 'grab'
          }}>
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
          <div className="header drag-handle">
            <div style={{display:'flex', alignItems:'center', gap: '10px', color: 'var(--text-secondary)'}}>
                <GripHorizontal size={20} />
                <h3 style={{fontSize: '16px', fontWeight: '600'}}>{menuItems.find(i => i.id === activeTab)?.label}</h3>
            </div>
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