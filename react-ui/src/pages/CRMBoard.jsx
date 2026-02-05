import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const CRMBoard = () => {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('crm_columns');
    return saved ? JSON.parse(saved) : {
      novos: { title: 'Novos', items: [] },
      negociacao: { title: 'Em Negociação', items: [] },
      fechados: { title: 'Fechados', items: [] }
    };
  });

  const [newLead, setNewLead] = useState("");
  const [dragItem, setDragItem] = useState(null); // { id, fromCol }

  useEffect(() => {
    localStorage.setItem('crm_columns', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MY_EXTENSION_RESP') {
        const { action, labels } = event.data.payload;
        if (action === 'LABELS_LIST' && labels && labels.length > 0) {
          const newCols = {};
          labels.forEach(l => {
            // Preserva itens se a coluna já existia
            newCols[l.id] = { 
              title: l.name, 
              items: columns[l.id] ? columns[l.id].items : [],
              color: l.color
            };
          });
          setColumns(newCols);
          alert(`${labels.length} Etiquetas importadas do WhatsApp!`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [columns]);

  const importLabels = () => {
    window.postMessage({ type: "MY_EXTENSION_CMD", command: "GET_LABELS" }, "*");
  };

  const addLead = () => {
    if (!newLead) return;
    setColumns(prev => ({
      ...prev,
      novos: { ...prev.novos, items: [...prev.novos.items, { id: Date.now(), text: newLead }] }
    }));
    setNewLead("");
  };

  const handleDelete = (leadId, colId) => {
    setColumns(prev => ({
        ...prev,
        [colId]: { ...prev[colId], items: prev[colId].items.filter(i => i.id !== leadId) }
    }));
  };

  // --- Lógica Drag & Drop ---

  const onDragStart = (e, item, colId) => {
    setDragItem({ item, fromCol: colId });
    // Efeito visual no ghost image se quiser, mas o padrão já serve
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e) => {
    e.preventDefault(); // Necessário para permitir o drop
  };

  const onDrop = (e, toColId) => {
    e.preventDefault();
    
    if (!dragItem) return;
    const { item, fromCol } = dragItem;

    // Se soltou na mesma coluna, não faz nada (ou poderia reordenar, mas vamos simplificar)
    if (fromCol === toColId) return;

    setColumns(prev => {
        // Remove da origem
        const newSourceList = prev[fromCol].items.filter(i => i.id !== item.id);
        // Adiciona no destino
        const newDestList = [...prev[toColId].items, item];

        return {
            ...prev,
            [fromCol]: { ...prev[fromCol], items: newSourceList },
            [toColId]: { ...prev[toColId], items: newDestList }
        };
    });
    setDragItem(null);
  };

  return (
    <div className="fade-in">
      <div className="card">
        <h4>CRM Kanban</h4>
        <div style={{display:'flex', gap:'5px', marginBottom:'15px'}}>
            <input className="input-field" style={{marginBottom:0}} placeholder="Novo Lead (Nome/Tel)" value={newLead} onChange={e => setNewLead(e.target.value)} />
            <button className="btn-primary" style={{width:'auto'}} onClick={addLead} title="Adicionar Lead"><Plus size={18}/></button>
            <button className="btn-primary" style={{width:'auto', backgroundColor: '#008069'}} onClick={importLabels} title="Sincronizar Etiquetas">Sincronizar</button>
        </div>
        
        <div style={{display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', minHeight: '300px'}}>
          {Object.entries(columns).map(([colId, col]) => (
            <div 
                key={colId} 
                className="kanban-col"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, colId)}
                style={{minWidth: '160px', flex: 1, borderTop: col.color ? `4px solid ${col.color}` : 'none'}}
            >
              <strong style={{fontSize: '12px', color: '#54656f', marginBottom:'8px', display: 'block'}}>{col.title} ({col.items.length})</strong>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '50px'}}>
                {col.items.map(item => (
                    <div 
                        key={item.id} 
                        className="kanban-card" 
                        draggable 
                        onDragStart={(e) => onDragStart(e, item, colId)}
                        style={{cursor: 'grab'}}
                    >
                    <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                        <span>{item.text}</span>
                        <button onClick={() => handleDelete(item.id, colId)} style={{border:'none', background:'transparent', cursor:'pointer', color:'#aaa'}}><Trash2 size={12}/></button>
                    </div>
                    </div>
                ))}
                {col.items.length === 0 && <div style={{height: '100%', border: '1px dashed #ccc', borderRadius: '4px', opacity: 0.5}}></div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CRMBoard;