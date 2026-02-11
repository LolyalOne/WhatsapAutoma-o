import React, { useState, useEffect } from 'react';
import { Clock, UserCheck, ShieldAlert } from 'lucide-react';

const SettingsScreen = () => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('wpp_saas_config');
    return saved ? JSON.parse(saved) : { minDelay: 3, maxDelay: 10, isHuman: true };
  });

  useEffect(() => {
    localStorage.setItem('wpp_saas_config', JSON.stringify(config));
    window.postMessage({
      type: "MY_EXTENSION_CMD",
      command: 'UPDATE_CONFIG',
      payload: config
    }, '*');
  }, [config]);

  const toggleHuman = () => {
    setConfig(prev => ({ ...prev, isHuman: !prev.isHuman }));
  };

  const handleChange = (key, value) => {
    if (key === 'minDelay' && value > config.maxDelay) return;
    if (key === 'maxDelay' && value < config.minDelay) return;
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      <div className="card" style={{ borderLeft: '4px solid #f59f00', background: 'rgba(245, 159, 0, 0.05)' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
            <ShieldAlert size={18} color="#f59f00" />
            <strong style={{ color: '#f59f00', fontSize: '14px' }}>Segurança</strong>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Evite bloqueios: use intervalos acima de 15s para contatos novos.
        </p>
      </div>

      <div className="card">
        <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} /> Delay entre mensagens
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span>Mínimo</span>
                    <strong>{config.minDelay}s</strong>
                </div>
                <input type="range" min="1" max="60" value={config.minDelay} onChange={e => handleChange('minDelay', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--wpp-green)' }} />
            </div>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span>Máximo</span>
                    <strong>{config.maxDelay}s</strong>
                </div>
                <input type="range" min="5" max="120" value={config.maxDelay} onChange={e => handleChange('maxDelay', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--wpp-green)' }} />
            </div>
        </div>
      </div>

      <div className="card">
        <div className="switch-container" onClick={toggleHuman}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={20} color={config.isHuman ? 'var(--wpp-green)' : 'var(--text-placeholder)'} />
                <div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>Simular Digitação</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Aparece "Digitando..."</span>
                </div>
            </div>
            <div className="switch-track" style={{ background: config.isHuman ? 'var(--wpp-green)' : '#ccc' }}>
                <div className="switch-thumb" style={{ left: config.isHuman ? '24px' : '2px' }} />
            </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsScreen;
