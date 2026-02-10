import React, { useState, useEffect } from 'react';
import { Search, Users, User, CheckSquare, Square, X, RefreshCw } from 'lucide-react';

const ContactSelector = ({ onClose, onImport }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [syncing, setSyncing] = useState(false);
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark')); // Detecta tema localmente

  useEffect(() => {
      // Observer para mudança de tema
      const observer = new MutationObserver(() => {
          setIsDark(document.body.classList.contains('dark'));
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
  }, []);

  // Função para pedir contatos
  const requestContacts = (forceRefresh = false) => {
    if (forceRefresh) setSyncing(true);
    window.postMessage({
      type: "MY_EXTENSION_CMD",
      command: 'GET_CONTACTS',
      payload: { forceRefresh }
    }, '*');
  };

  // Solicitar contatos ao montar
  useEffect(() => {
    // Listener para resposta do WPP
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MY_EXTENSION_RESP') {
        const { action, contacts: list, error } = event.data.payload;
        
        if (action === 'CONTACTS_LIST') {
          setContacts(list);
          setLoading(false);
          setSyncing(false); // Para o spin se estiver rodando
        }
        if (action === 'CONTACTS_ERROR') {
          console.error(error);
          setLoading(false);
          setSyncing(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    requestContacts(); // Busca inicial (cache)

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ... (Lógica de filtro e seleção mantém igual)
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.number.includes(searchTerm);
    const matchesType = filterType === 'all' 
      ? true 
      : filterType === 'group' ? c.isGroup : !c.isGroup;
    
    return matchesSearch && matchesType;
  });

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(filteredContacts.map(c => c.id));
      setSelectedIds(newSet);
    }
  };

  const handleImport = () => {
    const selectedContacts = contacts.filter(c => selectedIds.has(c.id));
    onImport(selectedContacts);
    onClose();
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-panel)', zIndex: 100, // Usa variável de tema
      display: 'flex', flexDirection: 'column', padding: '20px'
    }} className="fade-in">
      
      {/* Header do Modal */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
        <h3>Selecionar Contatos <span style={{fontSize:'12px', color: 'var(--text-secondary)'}}>({contacts.length})</span></h3>
        <button onClick={onClose} style={{border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)'}}>
          <X size={24} />
        </button>
      </div>

      {/* Barra de Ferramentas */}
      <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
        <div style={{position: 'relative', flex: 1}}>
          <Search size={16} style={{position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)'}}/>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar nome ou número..." 
            style={{paddingLeft: '35px'}}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className="btn-primary" 
          style={{width: 'auto', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '5px', opacity: syncing ? 0.7 : 1}}
          onClick={() => requestContacts(true)}
          disabled={syncing}
          title="Sincronizar com WhatsApp"
        >
          <RefreshCw size={16} className={syncing ? "spin" : ""} />
        </button>

        <button 
          className={filterType === 'group' ? "btn-primary" : "btn-secondary"} 
          style={{width: 'auto', padding: '0 15px', borderRadius: '15px'}}
          onClick={() => setFilterType(filterType === 'group' ? 'all' : 'group')}
          title="Filtrar Grupos"
        >
          <Users size={18} />
        </button>
        <button 
          className={filterType === 'user' ? "btn-primary" : "btn-secondary"} 
          style={{width: 'auto', padding: '0 15px', borderRadius: '15px'}}
          onClick={() => setFilterType(filterType === 'user' ? 'all' : 'user')}
          title="Filtrar Pessoas"
        >
          <User size={18} />
        </button>
      </div>

      {/* Lista */}
      <div style={{flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-card)'}}>
        {loading && contacts.length === 0 ? (
          <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-secondary)'}}>Carregando contatos...</div>
        ) : (
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{position: 'sticky', top: 0, background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)'}}>
              <tr>
                <th style={{padding: '10px', textAlign: 'left', width: '40px'}}>
                  <div onClick={toggleSelectAll} style={{cursor: 'pointer'}}>
                    {selectedIds.size > 0 && selectedIds.size === filteredContacts.length ? <CheckSquare size={18} color="var(--wpp-green)"/> : <Square size={18} color="var(--text-secondary)"/>}
                  </div>
                </th>
                <th style={{padding: '10px', textAlign: 'left', color: 'var(--text-secondary)'}}>Nome</th>
                <th style={{padding: '10px', textAlign: 'right', color: 'var(--text-secondary)'}}>Número</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => (
                <tr key={contact.id} style={{borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: selectedIds.has(contact.id) ? (isDark ? '#2a3942' : '#e6f7f3') : 'transparent'}} onClick={() => toggleSelect(contact.id)}>
                  <td style={{padding: '10px'}}>
                    {selectedIds.has(contact.id) ? <CheckSquare size={18} color="var(--wpp-green)"/> : <Square size={18} color="var(--text-secondary)"/>}
                  </td>
                  <td style={{padding: '10px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      {contact.avatar ? (
                        <img src={contact.avatar} style={{width: '30px', height: '30px', borderRadius: '50%'}} />
                      ) : (
                        <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          {contact.isGroup ? <Users size={14} color="#666"/> : <User size={14} color="#666"/>}
                        </div>
                      )}
                      <div style={{display: 'flex', flexDirection: 'column'}}>
                        <span style={{fontSize: '13px', fontWeight: '500'}}>{contact.name}</span>
                        {contact.isGroup && <span style={{fontSize: '10px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-panel)', padding: '2px 4px', borderRadius: '4px', width: 'fit-content'}}>Grupo</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{padding: '10px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)'}}>
                    {contact.number}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontSize: '13px', color: 'var(--text-secondary)'}}>{selectedIds.size} selecionados</span>
        <button 
          className="btn-primary" 
          style={{width: 'auto', padding: '10px 30px'}}
          onClick={handleImport}
          disabled={selectedIds.size === 0}
        >
          Importar
        </button>
      </div>

    </div>
  );
};

export default ContactSelector;
