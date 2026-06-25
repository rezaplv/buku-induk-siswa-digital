// Kelola Mata Pelajaran Component
const DataAkademik = {
  mapelList: [],

  init() {
    this.loadMapel();
    this.render();
  },

  loadMapel() {
    const stored = localStorage.getItem('mapelList');
    if (stored) {
      this.mapelList = JSON.parse(stored);
    } else {
      // Default list
      this.mapelList = [
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
      this.saveMapel();
    }
    // Update global MATA_PELAJARAN
    if (typeof MATA_PELAJARAN !== 'undefined') {
      MATA_PELAJARAN.length = 0;
      this.mapelList.forEach(m => MATA_PELAJARAN.push(m));
    }
  },

  saveMapel() {
    localStorage.setItem('mapelList', JSON.stringify(this.mapelList));
    // Sync with global MATA_PELAJARAN
    if (typeof MATA_PELAJARAN !== 'undefined') {
      MATA_PELAJARAN.length = 0;
      this.mapelList.forEach(m => MATA_PELAJARAN.push(m));
    }
  },

  render() {
    const page = document.getElementById('page-data-akademik');
    page.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Kelola Mata Pelajaran</h2>
      </div>
      <div class="card">
        <div class="card-header">
          <h3>Daftar Mata Pelajaran (${this.mapelList.length} mapel)</h3>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Mata Pelajaran</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${this.mapelList.length === 0 ? '<tr><td colspan="3" class="empty-state">Belum ada mata pelajaran.</td></tr>' :
                this.mapelList.map((m, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHTMLDash(m)}</strong></td>
                    <td><button class="btn btn-sm btn-danger" onclick="DataAkademik.deleteMapel(${i})">Hapus</button></td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Tambah Mata Pelajaran Baru</h3></div>
        <form onsubmit="DataAkademik.addMapel(event)" style="display:flex;gap:12px;align-items:flex-end;">
          <div class="form-group" style="flex:1;margin-bottom:0;">
            <label>Nama Mata Pelajaran</label>
            <input type="text" id="mapel-input" required placeholder="Contoh: Prakarya dan Kewirausahaan">
          </div>
          <button type="submit" class="btn btn-primary" style="height:42px;">+ Tambah</button>
        </form>
      </div>
      <div class="card" style="margin-top:16px;">
        <p style="font-size:12px;color:var(--text-muted);">
          <strong>Catatan:</strong> Mata pelajaran yang ditambahkan di sini akan muncul di halaman Input Nilai dan Cetak Buku Induk. 
          Menghapus mata pelajaran tidak akan menghapus data nilai yang sudah tersimpan.
        </p>
      </div>
    `;
  },

  addMapel(event) {
    event.preventDefault();
    const input = document.getElementById('mapel-input');
    const nama = input.value.trim();
    if (!nama) { alert('Nama mata pelajaran wajib diisi!'); return; }
    if (this.mapelList.includes(nama)) { alert('Mata pelajaran "' + nama + '" sudah ada!'); return; }
    this.mapelList.push(nama);
    this.saveMapel();
    this.render();
  },

  deleteMapel(index) {
    const nama = this.mapelList[index];
    if (!confirm('Hapus mata pelajaran "' + nama + '"?')) return;
    this.mapelList.splice(index, 1);
    this.saveMapel();
    this.render();
  }
};
