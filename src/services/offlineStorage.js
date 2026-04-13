/**
 * Offline Storage Service — IndexedDB wrapper
 * Stores conversations, preferences, and pending messages
 * for a true offline-first experience.
 */

const DB_NAME = 'vaani-db';
const DB_VERSION = 1;

const STORES = {
  MESSAGES: 'messages',
  PREFERENCES: 'preferences',
  PENDING: 'pending_messages',
  FAMILY: 'family_members',
  STREAKS: 'streaks',
};

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        db.createObjectStore(STORES.MESSAGES, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
        db.createObjectStore(STORES.PREFERENCES, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.PENDING)) {
        db.createObjectStore(STORES.PENDING, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.FAMILY)) {
        db.createObjectStore(STORES.FAMILY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.STREAKS)) {
        db.createObjectStore(STORES.STREAKS, { keyPath: 'key' });
      }
    };
    
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Generic CRUD operations
async function putItem(storeName, item) {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(item);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB put failed:', e);
    return false;
  }
}

async function getItem(storeName, key) {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB get failed:', e);
    return null;
  }
}

async function getAllItems(storeName) {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB getAll failed:', e);
    return [];
  }
}

async function deleteItem(storeName, key) {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB delete failed:', e);
    return false;
  }
}

async function clearStore(storeName) {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB clear failed:', e);
    return false;
  }
}

// ── Public API ────────────────────────────────

// Messages
export async function saveMessages(messages) {
  await clearStore(STORES.MESSAGES);
  for (const msg of messages) {
    await putItem(STORES.MESSAGES, msg);
  }
}

export async function loadMessages() {
  return getAllItems(STORES.MESSAGES);
}

// Pending (offline queue)
export async function queuePendingMessage(message) {
  return putItem(STORES.PENDING, { ...message, id: Date.now(), queued: true });
}

export async function getPendingMessages() {
  return getAllItems(STORES.PENDING);
}

export async function clearPendingMessages() {
  return clearStore(STORES.PENDING);
}

// Preferences
export async function savePreference(key, value) {
  return putItem(STORES.PREFERENCES, { key, value });
}

export async function getPreference(key) {
  const item = await getItem(STORES.PREFERENCES, key);
  return item?.value ?? null;
}

// Family
export async function saveFamilyMember(member) {
  return putItem(STORES.FAMILY, member);
}

export async function getFamilyMembers() {
  return getAllItems(STORES.FAMILY);
}

export async function deleteFamilyMember(id) {
  return deleteItem(STORES.FAMILY, id);
}

// Streaks
export async function saveStreakData(data) {
  return putItem(STORES.STREAKS, { key: 'streak', ...data });
}

export async function getStreakData() {
  return getItem(STORES.STREAKS, 'streak');
}

export default {
  saveMessages,
  loadMessages,
  queuePendingMessage,
  getPendingMessages,
  clearPendingMessages,
  savePreference,
  getPreference,
  saveFamilyMember,
  getFamilyMembers,
  deleteFamilyMember,
  saveStreakData,
  getStreakData,
};
