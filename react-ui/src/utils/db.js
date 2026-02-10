// react-ui/src/utils/db.js
const DB_NAME = 'ZapAutomationDB';
const DB_VERSION = 3;

export const getDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      const stores = ['contacts', 'labels', 'crm_config', 'quick_replies', 'send_history'];
      stores.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { 
            keyPath: name === 'crm_config' ? 'key' : 'id', 
            autoIncrement: (name === 'quick_replies' || name === 'send_history') 
          });
        }
      });
    };
  });
};

export const getData = async (storeName, key) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const setData = async (storeName, data) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(data);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};
