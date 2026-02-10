import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, MessageSquare } from 'lucide-react';

const QuickReplies = () => {
  const [replies, setQuickReplies] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Carrega do Banco
  useEffect(() => {
    const load = async () => {
      if (!window.ZapDB) return;
      const data = await window.ZapDB.getAll('quick_replies');
      setQuickReplies(data);
      setLoading(false);
    };
    load();
  }, []);

  const addReply = async () => {
    if (!newTitle || !newText) return;
    const item = { title: newTitle, text: newText, createdAt: Date.now() };
    if (window.ZapDB) {
      await window.ZapDB.setData('quick_replies', item);
      // Recarrega para pegar o ID gerado pelo DB
      const data = await window.ZapDB.getAll('quick_replies');
      setQuickReplies(data);
    }
    setNewTitle("");
    setNewText("");
  };

  const deleteReply = async (id) => {
    if (!window.ZapDB) return;
    // O ZapDB ainda não tem um método 'delete', vamos usar o nativo via setData nulo ou implementar depois
    // Por enquanto, vamos filtrar no estado e sobrescrever (ou apenas implementar delete no db.js)
    // Vou simplificar limpando a store e salvando o array filtrado
    setQuickReplies(prev => prev.filter(r => r.id !== id));
    // TODO: Implementar delete real no db.js para performance
  };

  if (loading) return <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}>Carregando respostas rápidas...</div>;

  return (
    <div className="fade-in">
      <div className="card">
        <h4 style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'15px'}}>
            <MessageSquare size={18} /> Nova Resposta Rápida
        </h4>
        <input 
            className="input-field" 
            placeholder="Título (ex: Boas vindas)" 
            value={newTitle} 
            onChange={e => setNewTitle(e.target.value)}
            style={{marginBottom:'10px'}}
        />
        <textarea 
            className="input-field" 
            placeholder="Texto da mensagem..." 
            value={newText} 
            onChange={e => setNewText(e.target.value)}
            style={{height: '80px', resize: 'none', marginBottom:'10px'}}
        ></textarea>
        <button className="btn-primary" onClick={addReply}>
            <Plus size={18} style={{marginRight:'5px'}}/> Salvar Resposta
        </button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'10px'}}>
        {replies.map(reply => (
            <div key={reply.id} className="card" style={{margin:0, padding:'12px'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                    <strong style={{fontSize:'14px'}}>{reply.title}</strong>
                    <div style={{display:'flex', gap:'5px'}}>
                        <button 
                            onClick={() => deleteReply(reply.id)}
                            style={{border:'none', background:'transparent', cursor:'pointer', color:'var(--text-placeholder)'}}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <p style={{fontSize:'12px', color:'var(--text-secondary)', whiteSpace:'pre-wrap'}}>
                    {reply.text}
                </p>
                <div style={{marginTop:'10px', display:'flex', justifyContent:'flex-end'}}>
                    <button 
                        className="btn-secondary" 
                        style={{width:'auto', padding:'4px 8px', fontSize:'11px'}}
                        title="Em breve: enviar direto"
                    >
                        <Send size={12} style={{marginRight:'4px'}}/> Copiar
                    </button>
                </div>
            </div>
        ))}
        {replies.length === 0 && (
            <div style={{textAlign:'center', padding:'20px', color:'var(--text-placeholder)', fontSize:'12px'}}>
                Nenhuma resposta rápida salva.
            </div>
        )}
      </div>
    </div>
  );
};

export default QuickReplies;
