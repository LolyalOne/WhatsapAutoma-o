# WhatsApp Automation (Extensão do Chrome)

> ⚠️ **Aviso de Descontinuação:** Este projeto foi descontinuado. O código ainda funciona parcialmente, mas, devido a mudanças estruturais na versão web do WhatsApp, algumas funções apresentaram falhas recentemente. No momento, não tenho pretensão de dar continuidade ao projeto. No entanto, se alguém tiver interesse em continuar o desenvolvimento, sinta-se à vontade para entrar em contato que posso fornecer auxílio.

Este projeto é uma extensão para o Google Chrome que permite automações no WhatsApp Web. Ele utiliza a biblioteca `wa-js` (a mesma base técnica do WPPConnect/Revzap) injetada diretamente no contexto da página.

## Estrutura do Projeto
- `manifest.json`: Configurações da extensão.
- `js/content.js`: Script de conteúdo que injeta os scripts na página.
- `js/injected.js`: Onde a lógica principal de automação roda.
- `js/wppconnect-wa.js`: A biblioteca do WPPConnect.

## Como instalar

1. **Baixar dependências (O "Motor"):**
   - Baixe o código da biblioteca `wa-js`.
   - Link: https://cdnjs.cloudflare.com/ajax/libs/wa-js/3.19.8/wppconnect-wa.js (ou use a versão mais recente).
   - Cole o código dentro de `js/wppconnect-wa.js`.

2. **Instalar no Chrome:**
   - Abra o Google Chrome e vá em `chrome://extensions/`.
   - Ative o **"Modo do desenvolvedor"**.
   - Clique em **"Carregar sem compactação"** e selecione a pasta do projeto.

3. **Uso:**
   - Acesse o WhatsApp Web (https://web.whatsapp.com/).
   - Clique no ícone da extensão.
   - Digite um número com DDD (ex: 5511999999999) e a mensagem.
   - Pressione Enviar e acompanhe os logs no Console (F12).
