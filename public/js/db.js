// IndexedDB Database Layer for Buku Induk Siswa Digital
const DB_NAME = 'BukuIndukSiswaDB';
const DB_VERSION = 1;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Siswa store
      if (!database.objectStoreNames.contains('siswa')) {
        const siswaStore = database.createObjectStore('siswa', { keyPath: 'nis' });
        siswaStore.createIndex('nama', 'nama', { unique: false });
        siswaStore.createIndex('nisn', 'nisn', { unique: false });
      }

      // Akademik store
      if (!database.objectStoreNames.contains('akademik')) {
        const akademikStore = database.createObjectStore('akademik', { keyPath: 'id', autoIncrement: true });
        akademikStore.createIndex('nis', 'nis', { unique: false });
        akademikStore.createIndex('tahunPelajaran', 'tahunPelajaran', { unique: false });
      }

      // Nilai store
      if (!database.objectStoreNames.contains('nilai')) {
        const nilaiStore = database.createObjectStore('nilai', { keyPath: 'id', autoIncrement: true });
        nilaiStore.createIndex('akademikId', 'akademikId', { unique: false });
      }

      // NonAkademik store
      if (!database.objectStoreNames.contains('nonAkademik')) {
        const nonAkademikStore = database.createObjectStore('nonAkademik', { keyPath: 'id', autoIncrement: true });
        nonAkademikStore.createIndex('akademikId', 'akademikId', { unique: false });
      }

      // P5 store
      if (!database.objectStoreNames.contains('p5')) {
        const p5Store = database.createObjectStore('p5', { keyPath: 'id', autoIncrement: true });
        p5Store.createIndex('akademikId', 'akademikId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Generic CRUD helpers
function getStore(storeName, mode) {
  const tx = db.transaction(storeName, mode || 'readonly');
  return tx.objectStore(storeName);
}

function addRecord(storeName, data) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite');
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function putRecord(storeName, data) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite');
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getRecord(storeName, key) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readonly');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllRecords(storeName) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteRecord(storeName, key) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite');
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getByIndex(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readonly');
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Atomic replace: delete all records matching an index value, then insert new ones in one transaction
function replaceByIndex(storeName, indexName, indexValue, newRecords) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const getReq = index.getAll(indexValue);

    getReq.onsuccess = () => {
      const existing = getReq.result || [];
      for (const rec of existing) {
        store.delete(rec.id);
      }
      for (const rec of newRecords) {
        store.add(rec);
      }
    };
    getReq.onerror = () => reject(getReq.error);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Domain-specific queries
const DB = {
  init: openDB,

  // Siswa
  addSiswa: (siswa) => addRecord('siswa', siswa),
  updateSiswa: (siswa) => putRecord('siswa', siswa),
  getSiswa: (nis) => getRecord('siswa', nis),
  getAllSiswa: () => getAllRecords('siswa'),
  deleteSiswa: (nis) => deleteRecord('siswa', nis),

  // Akademik
  addAkademik: (data) => addRecord('akademik', data),
  updateAkademik: (data) => putRecord('akademik', data),
  getAkademik: (id) => getRecord('akademik', id),
  getAllAkademik: () => getAllRecords('akademik'),
  getAkademikBySiswa: (nis) => getByIndex('akademik', 'nis', nis),
  deleteAkademik: (id) => deleteRecord('akademik', id),

  // Nilai
  addNilai: (data) => addRecord('nilai', data),
  updateNilai: (data) => putRecord('nilai', data),
  getNilai: (id) => getRecord('nilai', id),
  getNilaiByAkademik: (akademikId) => getByIndex('nilai', 'akademikId', akademikId),
  deleteNilai: (id) => deleteRecord('nilai', id),

  // NonAkademik
  addNonAkademik: (data) => addRecord('nonAkademik', data),
  updateNonAkademik: (data) => putRecord('nonAkademik', data),
  getNonAkademik: (id) => getRecord('nonAkademik', id),
  getNonAkademikByAkademik: (akademikId) => getByIndex('nonAkademik', 'akademikId', akademikId),
  deleteNonAkademik: (id) => deleteRecord('nonAkademik', id),

  // P5
  addP5: (data) => addRecord('p5', data),
  updateP5: (data) => putRecord('p5', data),
  getP5: (id) => getRecord('p5', id),
  getP5ByAkademik: (akademikId) => getByIndex('p5', 'akademikId', akademikId),
  deleteP5: (id) => deleteRecord('p5', id),

  // Atomic replace operations
  replaceNilaiByAkademik: (akademikId, newRecords) => replaceByIndex('nilai', 'akademikId', akademikId, newRecords),
  replaceNonAkademikByAkademik: (akademikId, newRecords) => replaceByIndex('nonAkademik', 'akademikId', akademikId, newRecords),
  replaceP5ByAkademik: (akademikId, newRecords) => replaceByIndex('p5', 'akademikId', akademikId, newRecords),

  // Bulk operations
  bulkAddSiswa: async (records) => {
    const results = { success: 0, failed: 0, errors: [] };
    for (const record of records) {
      try {
        await addRecord('siswa', record);
        results.success++;
      } catch (e) {
        // Try update if duplicate
        try {
          await putRecord('siswa', record);
          results.success++;
        } catch (e2) {
          results.failed++;
          results.errors.push({ record, error: e2.message });
        }
      }
    }
    return results;
  },

  // Get complete student data
  getCompleteStudentData: async (nis) => {
    const siswa = await getRecord('siswa', nis);
    if (!siswa) return null;

    const akademikRecords = await getByIndex('akademik', 'nis', nis);
    const completeAkademik = [];

    for (const akad of akademikRecords) {
      const nilai = await getByIndex('nilai', 'akademikId', akad.id);
      const nonAkademik = await getByIndex('nonAkademik', 'akademikId', akad.id);
      const p5 = await getByIndex('p5', 'akademikId', akad.id);
      completeAkademik.push({
        ...akad,
        nilai: nilai || [],
        nonAkademik: nonAkademik[0] || null,
        p5: p5[0] || null,
      });
    }

    return { ...siswa, akademik: completeAkademik };
  }
};
