import React, { useState, useEffect } from 'react';

const SettingsScreen = () => {
  // Estado inicial recupera do localStorage ou usa padrão
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('wpp_saas_config');
    return saved ? JSON.parse(saved) : { minDelay: 3, maxDelay: 10, isHuman: true };
  });

  // Salva no LocalStorage e Envia para o Backend sempre que mudar
  useEffect(() => {
    localStorage.setItem('wpp_saas_config', JSON.stringify(config));
    
    // Envia para o injected.js
    window.postMessage({
      type: "MY_EXTENSION_CMD",
      command: 'UPDATE_CONFIG',
      payload: config
    }, '*');
  }, [config]);

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fade-in">
      <div className="card">
        <h4>Configurações de Envio</h4>
        
        <div style={{marginTop: '20px'}}>
          <label style={{fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '10px'}}>Delay (Segundos)</label>
          
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <div style={{flex: 1}}>
                <span style={{fontSize: '11px', color: '#666'}}>Mínimo: {config.minDelay}s</span>
                <input 
                    type="range" 
                    min="1" max="30" 
                    value={config.minDelay} 
                    onChange={(e) => handleChange('minDelay', parseInt(e.target.value))}
                    style={{width: '100%', accentColor: 'var(--wpp-green)'}} 
                />
            </div>
            <div style={{flex: 1}}>
                <span style={{fontSize: '11px', color: '#666'}}>Máximo: {config.maxDelay}s</span>
                <input 
                    type="range" 
                    min="2" max="60" 
                    value={config.maxDelay} 
                    onChange={(e) => handleChange('maxDelay', parseInt(e.target.value))}
                    style={{width: '100%', accentColor: 'var(--wpp-green)'}} 
                />
            </div>
          </div>
          <p style={{fontSize: '11px', color: '#999', marginTop: '5px'}}>Intervalo aleatório entre cada mensagem.</p>
        </div>
        
        <div style={{marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
          <input 
            type="checkbox" 
            id="human" 
            checked={config.isHuman}
            onChange={(e) => handleChange('isHuman', e.target.checked)}
            style={{width: '16px', height: '16px', cursor: 'pointer'}} 
          />
          <label htmlFor="human" style={{fontSize: '13px', cursor: 'pointer'}}>
            <strong>Simular Digitação Humana</strong>
            <p style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Aparece "Digitando..." antes de enviar.</p>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;