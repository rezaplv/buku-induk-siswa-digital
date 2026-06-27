// Reset Data Component
const ResetData = {
  init() { this.render(); },

  async clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  render() {
    const page = document.getElementById('page-reset-data');
    page.innerHTML = `
      <div class="page-header"><h2 class="page-title">Reset Data</h2></div>

      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--radius);padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div style="color:#991B1B;font-weight:600;">Perhatian! Data yang sudah dihapus TIDAK BISA dikembalikan.</div>
      </div>

      <div class="card" style="margin-bottom:16px;border:2px solid #DC2626;">
        <div style="padding:20px;">
          <h3 style="color:#DC2626;margin-bottom:8px;">Reset Seluruh Data</h3>
          <p style="color:var(--text-secondary);margin-bottom:16px;">Hapus SEMUA data: siswa, akademik, nilai, ekstrakurikuler, kokurikuler P5, dan daftar mata pelajaran. Semua data akan hilang permanen.</p>
          <button onclick="ResetData.resetAll()" style="background:#DC2626;color:#fff;border:none;padding:10px 20px;border-radius:var(--radius-sm);cursor:pointer;font-weight:600;font-size:14px;">Hapus Semua Data</button>
        </div>
      </div>

      <h3 style="margin-bottom:16px;color:var(--text-primary);">Reset Per Kategori</h3>

      <div class="card" style="margin-bottom:12px;">
        <div style="padding:20px;">
          <h4 style="margin-bottom:6px;">Reset Data Siswa</h4>
          <p style="color:var(--text-secondary);margin-bottom:12px;">Hapus semua data siswa beserta seluruh data terkait (akademik, nilai, ekstrakurikuler, kokurikuler P5).</p>
          <button onclick="ResetData.resetSiswa()" style="background:#EF4444;color:#fff;border:none;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:500;font-size:13px;">Reset Data Siswa</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div style="padding:20px;">
          <h4 style="margin-bottom:6px;">Reset Nilai</h4>
          <p style="color:var(--text-secondary);margin-bottom:12px;">Hapus semua record nilai saja. Data siswa dan data lainnya tetap tersimpan.</p>
          <button onclick="ResetData.resetNilai()" style="background:#EF4444;color:#fff;border:none;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:500;font-size:13px;">Reset Nilai</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div style="padding:20px;">
          <h4 style="margin-bottom:6px;">Reset Ekstrakurikuler & Ketidakhadiran</h4>
          <p style="color:var(--text-secondary);margin-bottom:12px;">Hapus semua data ekstrakurikuler dan ketidakhadiran (nonAkademik).</p>
          <button onclick="ResetData.resetNonAkademik()" style="background:#EF4444;color:#fff;border:none;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:500;font-size:13px;">Reset Ekstrakurikuler & Ketidakhadiran</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div style="padding:20px;">
          <h4 style="margin-bottom:6px;">Reset Kokurikuler P5</h4>
          <p style="color:var(--text-secondary);margin-bottom:12px;">Hapus semua data kokurikuler P5 (catatan proyek per semester).</p>
          <button onclick="ResetData.resetP5()" style="background:#EF4444;color:#fff;border:none;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:500;font-size:13px;">Reset Kokurikuler P5</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div style="padding:20px;">
          <h4 style="margin-bottom:6px;">Reset Mata Pelajaran</h4>
          <p style="color:var(--text-secondary);margin-bottom:12px;">Reset daftar mata pelajaran ke default 11 mapel Kurikulum Merdeka.</p>
          <button onclick="ResetData.resetMapel()" style="background:#EF4444;color:#fff;border:none;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:500;font-size:13px;">Reset Mata Pelajaran</button>
        </div>
      </div>
    `;
  },

  async resetAll() {
    if (!confirm('PERINGATAN: Anda akan menghapus SELURUH data aplikasi. Apakah Anda yakin?')) return;
    const ketik = prompt('Ketik "HAPUS SEMUA" (tanpa tanda kutip) untuk konfirmasi:');
    if (ketik !== 'HAPUS SEMUA') { alert('Penghapusan dibatalkan. Teks tidak sesuai.'); return; }
    try {
      await this.clearStore('siswa');
      await this.clearStore('akademik');
      await this.clearStore('nilai');
      await this.clearStore('nonAkademik');
      await this.clearStore('p5');
      localStorage.removeItem('mapelList');
      alert('Semua data berhasil dihapus.');
      Router.navigateTo('dashboard');
    } catch (e) { alert('Gagal menghapus data: ' + e.message); }
  },

  async resetSiswa() {
    if (!confirm('Hapus semua data siswa beserta data akademik, nilai, ekstrakurikuler, dan kokurikuler P5 terkait?')) return;
    try {
      await this.clearStore('siswa');
      await this.clearStore('akademik');
      await this.clearStore('nilai');
      await this.clearStore('nonAkademik');
      await this.clearStore('p5');
      alert('Data siswa dan semua data terkait berhasil dihapus.');
      Router.navigateTo('reset-data');
    } catch (e) { alert('Gagal menghapus data: ' + e.message); }
  },

  async resetNilai() {
    if (!confirm('Hapus semua record nilai? Data siswa dan data lainnya tetap tersimpan.')) return;
    try {
      await this.clearStore('nilai');
      alert('Semua data nilai berhasil dihapus.');
      Router.navigateTo('reset-data');
    } catch (e) { alert('Gagal menghapus data: ' + e.message); }
  },

  async resetNonAkademik() {
    if (!confirm('Hapus semua data ekstrakurikuler dan ketidakhadiran?')) return;
    try {
      await this.clearStore('nonAkademik');
      alert('Data ekstrakurikuler dan ketidakhadiran berhasil dihapus.');
      Router.navigateTo('reset-data');
    } catch (e) { alert('Gagal menghapus data: ' + e.message); }
  },

  async resetP5() {
    if (!confirm('Hapus semua data kokurikuler P5?')) return;
    try {
      await this.clearStore('p5');
      alert('Data kokurikuler P5 berhasil dihapus.');
      Router.navigateTo('reset-data');
    } catch (e) { alert('Gagal menghapus data: ' + e.message); }
  },

  resetMapel() {
    if (!confirm('Reset daftar mata pelajaran ke default 11 mapel?')) return;
    const defaultMapel = [
      'Pendidikan Agama dan Budi Pekerti',
      'Pendidikan Pancasila',
      'Bahasa Indonesia',
      'Matematika',
      'IPA',
      'IPS',
      'Bahasa Inggris',
      'PJOK',
      'Informatika',
      'Seni Budaya dan Prakarya',
      'Bahasa Jawa'
    ];
    localStorage.setItem('mapelList', JSON.stringify(defaultMapel));
    if (typeof MATA_PELAJARAN !== 'undefined') {
      MATA_PELAJARAN.length = 0;
      defaultMapel.forEach(m => MATA_PELAJARAN.push(m));
    }
    alert('Daftar mata pelajaran berhasil direset ke default.');
    Router.navigateTo('reset-data');
  }
};
