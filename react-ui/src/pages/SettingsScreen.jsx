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

  const handleChange = (key, value) => {
    // Validação básica para evitar que Min > Max
    if (key === 'minDelay' && value > config.maxDelay) return;
    if (key === 'maxDelay' && value < config.minDelay) return;

    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fade-in">
      
      {/* Aviso de Segurança */}
      <div className="card" style={{borderLeft: '4px solid #f59f00', display: 'flex', gap: '15px'}}>
        <ShieldAlert size={24} color="#f59f00" style={{flexShrink: 0}}/>
        <div>
          <h4 style={{marginBottom: '5px', color: '#f59f00'}}>Proteção Antibloqueio</h4>
          <p style={{fontSize: '12px', lineHeight: '1.4', color: 'var(--text-secondary)'}}>
            Recomendamos intervalos acima de 15 segundos para listas frias.
          </p>
        </div>
      </div>

      <div className="card">
        <h4 style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px'}}>
          <Clock size={18} /> Configurações de Tempo
        </h4>
        
        <div style={{marginTop: '20px'}}>
          <label style={{fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '15px', color: 'var(--text-primary)'}}>
            Intervalo Aleatório (Segundos)
          </label>
          
          <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
            <div style={{flex: 1}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                  <span style={{fontSize: '11px', color: 'var(--text-secondary)'}}>Mínimo</span>
                  <span style={{fontSize: '12px', fontWeight:'bold'}}>{config.minDelay}s</span>
                </div>
                <input 
                    type="range" 
                    min="1" max="60" 
                    value={config.minDelay} 
                    onChange={(e) => handleChange('minDelay', parseInt(e.target.value))}
                    className="range-input"
                    style={{width: '100%', accentColor: 'var(--wpp-green)'}} 
                />
            </div>
            <div style={{flex: 1}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                  <span style={{fontSize: '11px', color: 'var(--text-secondary)'}}>Máximo</span>
                  <span style={{fontSize: '12px', fontWeight:'bold'}}>{config.maxDelay}s</span>
                </div>
                <input 
                    type="range" 
                    min="5" max="120" 
                    value={config.maxDelay} 
                    onChange={(e) => handleChange('maxDelay', parseInt(e.target.value))}
                    className="range-input"
                    style={{width: '100%', accentColor: 'var(--wpp-green)'}} 
                />
            </div>
          </div>
          <p style={{fontSize: '11px', color: 'var(--text-placeholder)', marginTop: '10px', fontStyle: 'italic'}}>
            O sistema escolherá um tempo aleatório entre {config.minDelay}s e {config.maxDelay}s para cada envio.
          </p>
        </div>
      </div>

      <div className="card">
        <h4 style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px'}}>
          <UserCheck size={18} /> Comportamento
        </h4>
        
        <div style={{display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer'}} onClick={() => handleChange('isHuman', !config.isHuman)}>
          <div style={{
            width: '40px', height: '22px', 
            background: config.isHuman ? 'var(--wpp-green)' : '#ccc',
            borderRadius: '11px', position: 'relative', transition: 'background 0.2s'
          }}>
            <div style={{
              width: '18px', height: '18px', background: 'white', borderRadius: '50%',
              position: 'absolute', top: '2px', left: config.isHuman ? '20px' : '2px',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}/>
          </div>
          <div>
            <strong style={{fontSize: '14px', display:'block'}}>Simular Digitação Humana</strong>
            <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px'}}>
              Aparece "Digitando..." na barra de status do contato antes de enviar a mensagem. O tempo de digitação varia conforme o tamanho do texto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;