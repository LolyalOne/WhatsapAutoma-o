import React, { useState, useEffect } from 'react';
import { getStats } from '../utils/stats';

const Dashboard = () => {
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    // Atualiza a cada 2 segundos para refletir o progresso em tempo real
    const interval = setInterval(() => {
        setStats(getStats());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fade-in">
      <div className="card" style={{background: 'linear-gradient(135deg, #008069 0%, #005c4b 100%)', color: 'white', border: 'none'}}>
        <h3>Bem-vindo, Mestre</h3>
        <p style={{opacity: 0.9, fontSize: '13px', marginTop: '5px'}}>Sua automação está ativa e monitorando.</p>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
        <div className="card" style={{textAlign: 'center'}}>
          <h2 style={{color: 'var(--wpp-green)'}}>{stats.sent}</h2>
          <span style={{fontSize: '12px', color: '#54656f'}}>Envios Hoje</span>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <h2 style={{color: 'var(--danger)'}}>{stats.failed}</h2>
          <span style={{fontSize: '12px', color: '#54656f'}}>Falhas</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;