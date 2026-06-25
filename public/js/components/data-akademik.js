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
        <div class="card-header"><h3>Tambah Mata Pelajaran</h3></div>
        
        <!-- Manual (satu per satu) -->
        <form onsubmit="DataAkademik.addMapel(event)" style="display:flex;gap:12px;align-items:flex-end;margin-bottom:16px;">
          <div class="form-group" style="flex:1;margin-bottom:0;">
            <label>Manual (satu per satu)</label>
            <input type="text" id="mapel-input" required placeholder="Contoh: Prakarya dan Kewirausahaan">
          </div>
          <button type="submit" class="btn btn-primary" style="height:42px;">+ Tambah</button>
        </form>
        
        <hr style="margin:16px 0;border:none;border-top:1px solid var(--border-color);">
        
        <!-- Batch (banyak sekaligus) -->
        <div class="form-group">
          <label>Batch (satu mapel per baris)</label>
          <textarea id="mapel-batch-input" rows="6" placeholder="Contoh:\nPrakarya dan Kewirausahaan\nBahasa Arab\nTahfidz\nMuatan Lokal"></textarea>
        </div>
        <div style="display:flex;gap:12px;align-items:center;">
          <button type="button" class="btn btn-primary" onclick="DataAkademik.addMapelBatch()">+ Tambah Semua</button>
          <span id="mapel-batch-count" style="font-size:12px;color:var(--text-muted);"></span>
        </div>
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

  addMapelBatch() {
    const textarea = document.getElementById('mapel-batch-input');
    const text = textarea.value.trim();
    if (!text) { alert('Masukkan daftar mata pelajaran (satu per baris).'); return; }

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) { alert('Tidak ada data yang valid.'); return; }

    let added = 0;
    let skipped = 0;
    const skippedNames = [];

    for (const nama of lines) {
      if (this.mapelList.includes(nama)) {
        skipped++;
        skippedNames.push(nama);
      } else {
        this.mapelList.push(nama);
        added++;
      }
    }

    this.saveMapel();
    this.render();

    let msg = 'Berhasil menambahkan ' + added + ' mata pelajaran.';
    if (skipped > 0) {
      msg += '\n\n' + skipped + ' mapel dilewati (sudah ada): ' + skippedNames.join(', ');
    }
    alert(msg);
  },

  deleteMapel(index) {
    const nama = this.mapelList[index];
    if (!confirm('Hapus mata pelajaran "' + nama + '"?')) return;
    this.mapelList.splice(index, 1);
    this.saveMapel();
    this.render();
  }
};
