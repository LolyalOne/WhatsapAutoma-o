import React, { useState, useEffect } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';

const QuickReplies = () => {
  const [replies, setReplies] = useState(() => {
    const saved = localStorage.getItem('quick_replies');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: '/saudacao', text: 'Olá! Como posso ajudar você hoje?' },
      { id: 2, title: '/pix', text: 'Nossa chave PIX é: cnpj@minhaempresa.com' }
    ];
  });

  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    localStorage.setItem('quick_replies', JSON.stringify(replies));
  }, [replies]);

  const handleAdd = () => {
    if (!newTitle || !newText) return;
    setReplies([...replies, { id: Date.now(), title: newTitle.startsWith('/') ? newTitle : '/'+newTitle, text: newText }]);
    setNewTitle("");
    setNewText("");
    setShowForm(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // Feedback visual poderia ser adicionado aqui
    alert("Copiado!");
  };

  const handleDelete = (id) => {
    setReplies(replies.filter(r => r.id !== id));
  };

  return (
    <div className="fade-in">
     <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
        <h4>Mensagens Rápidas</h4>
        <button className="btn-secondary" style={{width:'auto'}} onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Nova
        </button>
      </div>

      {showForm && (
        <div style={{background: '#f9f9f9', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #eee'}}>
            <input className="input-field" placeholder="Atalho (ex: /promo)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <textarea className="input-field" style={{height:'60px', resize:'none'}} placeholder="Mensagem completa..." value={newText} onChange={e => setNewText(e.target.value)} />
            <button className="btn-primary" onClick={handleAdd}>Salvar</button>
        </div>
      )}

      <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
        {replies.map(reply => (
            <div key={reply.id} className="input-field" style={{padding: '10px', marginBottom: 0, borderLeft: '4px solid var(--wpp-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div onClick={() => handleCopy(reply.text)} style={{cursor: 'pointer', flex: 1}}>
                    <strong>{reply.title}</strong><br/>
                    <span style={{fontSize: '12px', color: '#666'}}>{reply.text.substring(0, 50)}{reply.text.length > 50 ? '...' : ''}</span>
                </div>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <button onClick={() => handleCopy(reply.text)} style={{border:'none', background:'transparent', cursor:'pointer', color:'#54656f'}} title="Copiar"><Copy size={16}/></button>
                    <button onClick={() => handleDelete(reply.id)} style={{border:'none', background:'transparent', cursor:'pointer', color:'#ea0038'}} title="Excluir"><Trash2 size={16}/></button>
                </div>
            </div>
        ))}
        {replies.length === 0 && <p style={{textAlign:'center', color:'#999', fontSize:'12px'}}>Nenhuma resposta salva.</p>}
      </div>
     </div>
    </div>
  );
};

export default QuickReplies;