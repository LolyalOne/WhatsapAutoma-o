# Planejamento Técnico: Transformação SaaS

Este documento detalha a evolução do script de automação para um produto comercial robusto com interface integrada.

## 1. Roadmap de Produto (Funcionalidades Core)

### 1.1. Importação de Dados (CSV/Excel)
Para permitir que empresas carreguem seus mailings, implementaremos um parser no Frontend.

*   **Lógica:**
    1.  Utilizar a biblioteca `xlsx` (SheetJS) ou `papaparse` no React.
    2.  Ler o arquivo via `FileReader` API.
    3.  **Normalização:** Identificar colunas automaticamente ou pedir para o usuário mapear:
        *   `Nome` / `Name` / `Cliente` -> Variável `{nome}`
        *   `Telefone` / `Phone` / `Celular` / `Whatsapp` -> Destino
    4.  **Sanitização:** Remover caracteres não numéricos dos telefones e validar formato básico (DDI+DDD+Num).

### 1.2. Smart Select (Seleção Nativa)
Em vez de depender apenas de planilhas, permitiremos selecionar contatos existentes.

*   **Lógica:**
    1.  Chamar `WPP.contact.list()` no script injetado.
    2.  Filtrar no backend (script): `c.isMyContact === true` e separar por `isGroup`.
    3.  Enviar payload para o React.
    4.  **UI:** Renderizar uma tabela virtualizada (ex: `react-window` para performance com milhares de contatos) contendo checkboxes, Foto (avatar), Nome e Status.

### 1.3. Humanização Avançada
Técnicas para simular comportamento humano e reduzir risco de banimento.

*   **Simulação de Digitação:**
    *   Antes de `WPP.chat.sendTextMessage`, executar:
        ```javascript
        await window.WPP.chat.markIsComposing(targetId, 3000); // Digita por 3s
        await sleep(3000); 
        ```
*   **Variáveis Dinâmicas:**
    *   No React, permitir que o usuário escreva: "Olá {nome}, tudo bem?"
    *   No loop `sendBatchMessages`, realizar o replace:
        ```javascript
        const finalMsg = text.replace(/{nome}/gi, contactName || "Cliente");
        ```

---

## 2. Arquitetura de Interface (React In-Page)

Abandonaremos o Popup da extensão (que fecha ao clicar fora) em favor de uma interface **Overlay (Sidebar)** injetada na página.

### 2.1. Injeção no DOM e Shadow DOM
Para garantir que o CSS do nosso SaaS (ex: Material UI, Tailwind) não quebre o layout do WhatsApp Web (e vice-versa), usaremos Shadow DOM.

**Estrutura do Content Script (`content.js`):**

```javascript
// Criar o Host
const host = document.createElement('div');
host.id = 'minha-automacao-host';
document.body.appendChild(host);

// Criar Shadow Root (Isolamento de CSS)
const shadow = host.attachShadow({ mode: 'open' });

// Injetar Estilos dentro do Shadow
const style = document.createElement('style');
style.textContent = `
  .overlay-container { position: fixed; right: 0; top: 0; width: 400px; height: 100vh; z-index: 9999; }
`;
shadow.appendChild(style);

// Ponto de Montagem do React
const root = document.createElement('div');
root.id = 'react-root';
root.className = 'overlay-container';
shadow.appendChild(root);

// Carregar o bundle do React
// (O Webpack deve gerar um main.js que busca o elemento dentro do Shadow DOM)
```

### 2.2. Bridge de Comunicação (The Bridge)
Precisamos de uma "ponte" bidirecional entre o **React (Overlay)** e o **WPP (Injected Script)**.

**Fluxo de Comando (React -> WPP):**
1.  React dispara evento:
    ```javascript
    window.postMessage({ type: 'SAAS_CMD', command: 'SEND_BATCH', payload: {...} }, '*');
    ```
2.  Script Injetado (`injected.js`) escuta `window.addEventListener("message")` (já implementado, só precisa manter).

**Fluxo de Resposta (WPP -> React):**
1.  Script Injetado reporta progresso:
    ```javascript
    window.postMessage({ type: 'MY_EXTENSION_RESP', payload: { action: 'BATCH_PROGRESS', ... } }, '*');
    ```
2.  React escuta no `useEffect`:
    ```javascript
    useEffect(() => {
      const listener = (event) => {
        if (event.data.type === 'MY_EXTENSION_RESP' && event.data.payload.action === 'BATCH_PROGRESS') {
          updateProgressBar(event.data.payload);
        }
      };
      window.addEventListener('message', listener);
      return () => window.removeEventListener('message', listener);
    }, []);
    ```

### 2.3. Build System
*   A extensão terá 2 builds:
    1.  **Extension Build:** `manifest.json`, `background.js`, `content.js`, `injected.js`.
    2.  **React Build:** Gera um `bundle.js` e `style.css` que serão listados no `web_accessible_resources` do manifest e injetados pelo `content.js`.
