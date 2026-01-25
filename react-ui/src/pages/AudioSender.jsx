import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { toBase64 } from '../utils';

const AudioSender = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [targetNumber, setTargetNumber] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) setAudioFile(e.target.files[0]);
  };

  const handleSendAudio = async () => {
    if (!audioFile || !targetNumber) return alert("Selecione arquivo e número");
    setIsSending(true);
    
    try {
        const base64 = await toBase64(audioFile);
        window.postMessage({
            type: "MY_EXTENSION_CMD",
            command: 'SEND_AUDIO',
            payload: { phone: targetNumber, base64, fileName: audioFile.name }
        }, '*');
        alert("Comando de áudio enviado!");
    } catch (e) {
        alert("Erro ao processar áudio");
    }
    setIsSending(false);
  };

  return (
    <div className="fade-in">
      <div className="card">
        <h4>Enviar Áudio (PTT)</h4>
        <p style={{fontSize:'12px', color:'#666', marginBottom:'15px'}}>O áudio chegará como se tivesse sido gravado na hora (microfone azul).</p>
        
        <input className="input-field" placeholder="Número (5511999...)" value={targetNumber} onChange={e => setTargetNumber(e.target.value)} />
        
        <div style={{border: '2px dashed #d1d7db', borderRadius: '8px', padding: '20px', textAlign: 'center', marginBottom: '15px', background:'#f9f9f9'}}>
          <input type="file" accept="audio/*" onChange={handleFileChange} style={{display:'none'}} id="audio-upload" />
          <label htmlFor="audio-upload" style={{cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center'}}>
            <Mic size={32} color={audioFile ? "#008069" : "#ccc"} />
            <span style={{fontSize: '12px', color: '#54656f', marginTop:'10px'}}>
                {audioFile ? audioFile.name : "Clique para selecionar MP3/OGG"}
            </span>
          </label>
        </div>

        <button className="btn-primary" onClick={handleSendAudio} disabled={isSending}>
            {isSending ? 'Processando...' : 'Enviar como Gravado'}
        </button>
      </div>
    </div>
  );
};

export default AudioSender;
