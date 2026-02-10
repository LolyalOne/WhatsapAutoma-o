// js/db.js
// Camada de Persistência (IndexedDB) para o ZapAutomation
// Versão 3: Suporta Contatos, CRM, Etiquetas, Respostas Rápidas e Histórico.

(function() {
    const DB_NAME = 'ZapAutomationDB';
    const DB_VERSION = 3;
    const STORE_CONTACTS = 'contacts';
    const STORE_LABELS = 'labels';
    const STORE_CRM = 'crm_config';
    const STORE_QUICK = 'quick_replies';
    const STORE_HISTORY = 'send_history';

    class ZapDatabase {
        constructor() {
            this.db = null;
            this.readyPromise = this.init();
        }

        init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onblocked = () => {
                    console.warn('[ZapDB] Banco bloqueado por outra aba. Recarregue a página.');
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    if (!db.objectStoreNames.contains(STORE_CONTACTS)) {
                        db.createObjectStore(STORE_CONTACTS, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(STORE_LABELS)) {
                        db.createObjectStore(STORE_LABELS, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(STORE_CRM)) {
                        db.createObjectStore(STORE_CRM, { keyPath: 'key' });
                    }
                    if (!db.objectStoreNames.contains(STORE_QUICK)) {
                        db.createObjectStore(STORE_QUICK, { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains(STORE_HISTORY)) {
                        const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id', autoIncrement: true });
                        historyStore.createIndex('date', 'date', { unique: false });
                    }
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log(`[ZapDB] Banco de dados pronto v${DB_VERSION}`);
                    resolve(this.db);
                };

                request.onerror = (event) => {
                    console.error('[ZapDB] Erro:', event.target.error);
                    reject(event.target.error);
                };
            });
        }

        // Métodos Genéricos
        async setData(storeName, data) {
            await this.readyPromise;
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([storeName], 'readwrite');
                tx.objectStore(storeName).put(data);
                tx.oncomplete = () => resolve(true);
                tx.onerror = (e) => reject(e);
            });
        }

        async getData(storeName, key) {
            await this.readyPromise;
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([storeName], 'readonly');
                const req = tx.objectStore(storeName).get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = (e) => reject(e);
            });
        }

        async getAll(storeName) {
            await this.readyPromise;
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([storeName], 'readonly');
                const req = tx.objectStore(storeName).getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = (e) => reject(e);
            });
        }

        // Métodos de Contatos (Bulk)
        async saveContacts(contactsList) {
            await this.readyPromise;
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([STORE_CONTACTS], 'readwrite');
                const store = tx.objectStore(STORE_CONTACTS);
                contactsList.forEach(c => store.put(c));
                tx.oncomplete = () => resolve(true);
                tx.onerror = (e) => reject(e);
            });
        }

        async getAllContacts() {
            return this.getAll(STORE_CONTACTS);
        }

        async clearStore(storeName) {
            await this.readyPromise;
            const tx = this.db.transaction([storeName], 'readwrite');
            tx.objectStore(storeName).clear();
        }
    }

    // Exportação Global
    window.ZapDB = new ZapDatabase();
})();