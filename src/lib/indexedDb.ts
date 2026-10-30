export interface LocalVideoRecord {
  id: string;
  blob: Blob;
  timestamp: Date;
  duration: number;
}

const DB_NAME = 'stealthcam-db';
const STORE_NAME = 'videos';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveLocalVideo(id: string, blob: Blob, timestamp: Date, duration: number): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const record: LocalVideoRecord = {
      id,
      blob,
      timestamp,
      duration
    };

    const request = store.put(record);

    request.onerror = () => {
      console.error('Failed to save video to IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function getLocalVideos(): Promise<LocalVideoRecord[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('Failed to retrieve videos from IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
}

export async function deleteLocalVideo(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      console.error('Failed to delete video from IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}
