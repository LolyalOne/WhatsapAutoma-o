import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Users } from 'lucide-react';
import ContactSelector from '../components/ContactSelector';

const CRMBoard = ({ isDark }) => {
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [newLead, setNewLead] = useState("");
  const [dragItem, setDragItem] = useState(null);
  const [showSelector, setShowSelector] = useState(false);

  // 1. Carregamento Inicial
  useEffect(() => {
    let isMounted = true;
    const loadState = async () => {
      const defaultColumns = {
        novos: { title: 'Novos', items: [], color: '#00a884' },
        negociacao: { title: 'Em Negociação', items: [], color: '#3498db' },
        fechados: { title: 'Fechados', items: [], color: '#9b59b6' }
      };

      try {
        if (window.ZapDB && typeof window.ZapDB.getData === 'function') {
          const saved = await window.ZapDB.getData('crm_config', 'board_state');
          if (isMounted) {
            if (saved && saved.columns && Object.keys(saved.columns).length > 0) {
              setColumns(saved.columns);
            } else {
              setColumns(defaultColumns);
            }
          }
        } else {
          if (isMounted) setColumns(defaultColumns);
        }
      } catch (e) {
        if (isMounted) setColumns(defaultColumns);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadState();
    return () => { isMounted = false; };
  }, []);

  // 2. Salva no Banco
  useEffect(() => {
    if (!loading && window.ZapDB && typeof window.ZapDB.setData === 'function' && Object.keys(columns).length > 0) {
      window.ZapDB.setData('crm_config', { key: 'board_state', columns });
    }
  }, [columns, loading]);

  // 3. Listener Etiquetas
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MY_EXTENSION_RESP') {
        const { action, labels } = event.data.payload;
        if (action === 'LABELS_LIST' && labels && labels.length > 0) {
          setColumns(prev => {
            const newCols = { ...prev };
            labels.forEach(l => {
              if (!newCols[l.id]) {
                newCols[l.id] = { title: l.name, items: [], color: l.color };
              }
            });
            return newCols;
          });
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const syncLabels = () => {
    window.postMessage({ type: "MY_EXTENSION_CMD", command: "GET_LABELS" }, "*");
  };

  const addLead = (text) => {
    const leadText = text || newLead;
    if (!leadText) return;
    setColumns(prev => {
      const colIds = Object.keys(prev);
      const firstCol = colIds[0] || 'novos';
      return {
        ...prev,
        [firstCol]: { 
          ...prev[firstCol], 
          items: [...(prev[firstCol].items || []), { id: Date.now().toString() + Math.random(), text: leadText }] 
        }
      };
    });
    setNewLead("");
  };

  const handleImportContacts = (selected) => {
      selected.forEach(c => {
          addLead(`${c.name} (${c.number})`);
      });
      setShowSelector(false);
  };

  const handleDelete = (leadId, colId) => {
    setColumns(prev => ({
        ...prev,
        [colId]: { ...prev[colId], items: prev[colId].items.filter(i => i.id !== leadId) }
    }));
  };

  const onDragStart = (e, item, colId) => {
    setDragItem({ item, fromCol: colId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (e, toColId) => {
    e.preventDefault();
    if (!dragItem || dragItem.fromCol === toColId) return;
    const { item, fromCol } = dragItem;

    setColumns(prev => {
        const newSourceList = prev[fromCol].items.filter(i => i.id !== item.id);
        const newDestList = [...(prev[toColId].items || []), item];
        return {
            ...prev,
            [fromCol]: { ...prev[fromCol], items: newSourceList },
            [toColId]: { ...prev[toColId], items: newDestList }
        };
    });
    setDragItem(null);
  };

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Carregando CRM...</div>;

  return (
    <div className="fade-in">
      {showSelector && <ContactSelector isDark={isDark} onClose={() => setShowSelector(false)} onImport={handleImportContacts} />}
      
      <div className="card" style={{ borderRadius: '15px' }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
            <h4 style={{margin:0}}>CRM Pipeline</h4>
            <div style={{display:'flex', gap:'5px'}}>
                <button className="btn-secondary" style={{width:'auto', padding:'5px 10px', borderRadius:'15px'}} onClick={() => setShowSelector(true)}>
                    <Users size={14} style={{marginRight:'5px'}}/> Importar
                </button>
                <button className="btn-secondary" style={{width:'auto', padding:'5px 10px', borderRadius:'15px'}} onClick={syncLabels}>
                    <RefreshCw size={14} style={{marginRight:'5px'}}/> Etiquetas
                </button>
            </div>
        </div>

        <div style={{display:'flex', gap:'5px', marginBottom:'20px'}}>
            <input className="input-field" style={{marginBottom:0, borderRadius:'12px'}} placeholder="Nome ou Tel do Lead" value={newLead} onChange={e => setNewLead(e.target.value)} />
            <button className="btn-primary" style={{width:'auto', borderRadius:'12px'}} onClick={() => addLead()}><Plus size={20}/></button>
        </div>
        
        <div style={{display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px', minHeight: '400px'}}>
          {Object.entries(columns).map(([colId, col]) => (
            <div 
                key={colId} 
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, colId)}
                style={{
                    minWidth: '200px', 
                    background: 'var(--bg-panel)', 
                    borderRadius: '12px', 
                    padding: '10px',
                    borderTop: `4px solid ${col.color || 'var(--wpp-green)'}`,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
              <div style={{marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
                <strong style={{fontSize: '12px'}}>{col.title}</strong>
                <span style={{fontSize:'10px', color:'var(--text-secondary)'}}>{col.items?.length || 0}</span>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', flex: 1}}>
                {col.items?.map(item => (
                    <div 
                        key={item.id} 
                        draggable 
                        onDragStart={(e) => onDragStart(e, item, colId)}
                        className="card"
                        style={{
                            margin: 0, padding: '8px', cursor: 'grab', fontSize: '11px',
                            borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)'
                        }}
                    >
                        <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                            <span style={{fontWeight:'500'}}>{item.text}</span>
                            <button onClick={() => handleDelete(item.id, colId)} style={{border:'none', background:'transparent', cursor:'pointer', color:'var(--text-placeholder)'}}>
                                <Trash2 size={12}/>
                            </button>
                        </div>
                    </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CRMBoard;