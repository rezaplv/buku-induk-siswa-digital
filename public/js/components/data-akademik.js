// Data Akademik Component - manages Tahun Pelajaran, Kelas, Wali Kelas, Status assignments
const DataAkademik = {
  students: [],
  allAkademik: [],
  filterTP: '',
  filterKelas: '',

  async init() { await this.loadData(); this.render(); },
  async loadData() {
    this.students = await DB.getAllSiswa();
    this.allAkademik = await DB.getAllAkademik();
  },
  getTPList() {
    const s = new Set();
    this.allAkademik.forEach(a => { if (a.tahunPelajaran) s.add(a.tahunPelajaran); });
    return [...s].sort();
  },
  getKelasList() {
    const s = new Set();
    this.allAkademik.forEach(a => { if (a.kelas) s.add(a.kelas); });
    return [...s].sort();
  },
  getFilteredAkademik() {
    let data = this.allAkademik;
    if (this.filterTP) data = data.filter(a => a.tahunPelajaran === this.filterTP);
    if (this.filterKelas) data = data.filter(a => a.kelas === this.filterKelas);
    data.sort((a, b) => this.getStudentName(a.nis).localeCompare(this.getStudentName(b.nis)));
    return data;
  },
  getStudentName(nis) {
    const s = this.students.find(st => st.nis === nis);
    return s ? s.nama : nis;
  },

  render() {
    const page = document.getElementById('page-data-akademik');
    const tpList = this.getTPList();
    const kelasList = this.getKelasList();
    const filtered = this.getFilteredAkademik();

    page.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Data Akademik</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="DataAkademik.showSingleForm()">+ Tambah</button>
          <button class="btn btn-outline" onclick="DataAkademik.showBatchForm()">Assign Batch</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
          <div class="form-group" style="margin-bottom:0;flex:1;min-width:180px;">
            <label>Filter Tahun Pelajaran</label>
            <select onchange="DataAkademik.filterTP=this.value;DataAkademik.render()">
              <option value="">-- Semua --</option>
              ${tpList.map(tp => '<option value="' + escapeHTMLDash(tp) + '"' + (this.filterTP === tp ? ' selected' : '') + '>' + escapeHTMLDash(tp) + '</option>').join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;flex:1;min-width:180px;">
            <label>Filter Kelas</label>
            <select onchange="DataAkademik.filterKelas=this.value;DataAkademik.render()">
              <option value="">-- Semua --</option>
              ${kelasList.map(k => '<option value="' + escapeHTMLDash(k) + '"' + (this.filterKelas === k ? ' selected' : '') + '>' + escapeHTMLDash(k) + '</option>').join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Data Akademik Siswa (${filtered.length} data)</h3></div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>No</th><th>Nama Siswa</th><th>NIS</th><th>Tahun Pelajaran</th><th>Kelas</th><th>Wali Kelas</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${filtered.length === 0 ? '<tr><td colspan="8" class="empty-state">Belum ada data akademik.</td></tr>' :
                filtered.map((a, i) => '<tr><td>' + (i+1) + '</td><td><strong>' + escapeHTMLDash(this.getStudentName(a.nis)) + '</strong></td><td>' + escapeHTMLDash(a.nis) + '</td><td>' + escapeHTMLDash(a.tahunPelajaran) + '</td><td>' + escapeHTMLDash(a.kelas) + '</td><td>' + escapeHTMLDash(a.waliKelas || '-') + '</td><td>' + escapeHTMLDash(a.status || '-') + '</td><td><button class="btn btn-sm btn-outline" onclick="DataAkademik.editRow(' + a.id + ')">Edit</button> <button class="btn btn-sm btn-danger" onclick="DataAkademik.deleteRow(' + a.id + ')">Hapus</button></td></tr>').join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div id="da-modal" class="modal" style="display:none;">
        <div class="modal-overlay" onclick="DataAkademik.closeModal()"></div>
        <div class="modal-content" id="da-modal-content"></div>
      </div>`;
  },

  showSingleForm() {
    document.getElementById('da-modal').style.display = 'flex';
    document.getElementById('da-modal-content').innerHTML = `
      <div class="modal-header"><h3>Tambah Data Akademik</h3><button class="modal-close" onclick="DataAkademik.closeModal()">&times;</button></div>
      <form onsubmit="DataAkademik.saveSingle(event)">
        <div class="form-group"><label>Pilih Siswa</label><select id="da-siswa" required>${[...this.students].sort((a, b) => a.nama.localeCompare(b.nama)).map(s => '<option value="' + escapeHTMLDash(s.nis) + '">' + escapeHTMLDash(s.nama) + ' (' + escapeHTMLDash(s.nis) + ')</option>').join('')}</select></div>
        <div class="form-group"><label>Tahun Pelajaran</label><input type="text" id="da-tp" required placeholder="2025/2026"></div>
        <div class="form-group"><label>Kelas</label><input type="text" id="da-kelas" required placeholder="VII D"></div>
        <div class="form-group"><label>Wali Kelas</label><input type="text" id="da-wali" placeholder="Nama wali kelas"></div>
        <div class="form-group"><label>Status Akhir Tahun</label><select id="da-status"><option value="">-- Belum ditentukan --</option><option value="Naik">Naik</option><option value="Tidak Naik">Tidak Naik</option></select></div>
        <div class="form-actions"><button type="button" class="btn btn-outline" onclick="DataAkademik.closeModal()">Batal</button><button type="submit" class="btn btn-primary">Simpan</button></div>
      </form>`;
  },

  async saveSingle(event) {
    event.preventDefault();
    const data = {
      nis: document.getElementById('da-siswa').value,
      tahunPelajaran: document.getElementById('da-tp').value.trim(),
      kelas: document.getElementById('da-kelas').value.trim(),
      waliKelas: document.getElementById('da-wali').value.trim(),
      status: document.getElementById('da-status').value
    };
    try { await DB.addAkademik(data); this.closeModal(); await this.loadData(); this.render(); }
    catch (e) { alert('Gagal: ' + e.message); }
  },

  showBatchForm() {
    document.getElementById('da-modal').style.display = 'flex';
    document.getElementById('da-modal-content').style.maxWidth = '700px';
    document.getElementById('da-modal-content').innerHTML = `
      <div class="modal-header"><h3>Assign Batch - Data Akademik</h3><button class="modal-close" onclick="DataAkademik.closeModal()">&times;</button></div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Pilih Tahun Pelajaran, Kelas, dan Wali Kelas, lalu centang siswa yang akan di-assign.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div class="form-group" style="margin-bottom:0;"><label>Tahun Pelajaran</label><input type="text" id="da-batch-tp" required placeholder="2025/2026"></div>
        <div class="form-group" style="margin-bottom:0;"><label>Kelas</label><input type="text" id="da-batch-kelas" required placeholder="VII D"></div>
        <div class="form-group" style="margin-bottom:0;"><label>Wali Kelas</label><input type="text" id="da-batch-wali" placeholder="Nama wali kelas"></div>
        <div class="form-group" style="margin-bottom:0;"><label>Status Akhir Tahun</label><select id="da-batch-status"><option value="">-- Belum ditentukan --</option><option value="Naik">Naik</option><option value="Tidak Naik">Tidak Naik</option></select></div>
      </div>
      <div class="form-group" style="margin-bottom:8px;"><label>Pilih Siswa</label>
        <div style="margin-bottom:8px;"><input type="text" id="da-batch-search" placeholder="Cari siswa..." oninput="DataAkademik.filterBatchStudents(this.value)" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:var(--radius-sm);font-size:13px;"></div>
        <div style="margin-bottom:8px;"><label style="font-size:12px;cursor:pointer;"><input type="checkbox" id="da-batch-select-all" onchange="DataAkademik.toggleSelectAll(this.checked)"> Pilih Semua</label></div>
        <div class="checkbox-list" id="da-batch-list">
          ${[...this.students].sort((a, b) => a.nama.localeCompare(b.nama)).map(s => '<label><input type="checkbox" name="da-batch-student" value="' + escapeHTMLDash(s.nis) + '"><span>' + escapeHTMLDash(s.nama) + ' (' + escapeHTMLDash(s.nis) + ')</span></label>').join('')}
        </div>
      </div>
      <div class="form-actions"><button type="button" class="btn btn-outline" onclick="DataAkademik.closeModal()">Batal</button><button type="button" class="btn btn-primary" onclick="DataAkademik.saveBatch()">Assign Semua</button></div>`;
  },

  filterBatchStudents(term) {
    const list = document.getElementById('da-batch-list');
    const labels = list.querySelectorAll('label');
    const t = term.toLowerCase();
    labels.forEach(label => { label.style.display = label.textContent.toLowerCase().includes(t) ? '' : 'none'; });
  },

  toggleSelectAll(checked) {
    const checkboxes = document.querySelectorAll('input[name="da-batch-student"]');
    checkboxes.forEach(cb => { if (cb.closest('label').style.display !== 'none') cb.checked = checked; });
  },

  async saveBatch() {
    const tp = document.getElementById('da-batch-tp').value.trim();
    const kelas = document.getElementById('da-batch-kelas').value.trim();
    const wali = document.getElementById('da-batch-wali').value.trim();
    const status = document.getElementById('da-batch-status').value;
    if (!tp || !kelas) { alert('Tahun Pelajaran dan Kelas wajib diisi!'); return; }
    const checked = document.querySelectorAll('input[name="da-batch-student"]:checked');
    if (checked.length === 0) { alert('Pilih minimal satu siswa!'); return; }
    let success = 0, failed = 0;
    for (const cb of checked) {
      try { await DB.addAkademik({ nis: cb.value, tahunPelajaran: tp, kelas, waliKelas: wali, status: status }); success++; }
      catch (e) { failed++; }
    }
    alert('Berhasil: ' + success + ' siswa. Gagal: ' + failed);
    this.closeModal(); await this.loadData(); this.render();
  },

  async editRow(id) {
    const akad = this.allAkademik.find(a => a.id === id);
    if (!akad) return;
    const tp = prompt('Tahun Pelajaran:', akad.tahunPelajaran); if (tp === null) return;
    const kelas = prompt('Kelas:', akad.kelas); if (kelas === null) return;
    const wali = prompt('Wali Kelas:', akad.waliKelas || ''); if (wali === null) return;
    const status = prompt('Status (Naik/Tidak Naik/kosong):', akad.status || ''); if (status === null) return;
    try { await DB.updateAkademik({ id: akad.id, nis: akad.nis, tahunPelajaran: tp, kelas, waliKelas: wali, status }); await this.loadData(); this.render(); }
    catch (e) { alert('Gagal: ' + e.message); }
  },

  async deleteRow(id) {
    if (!confirm('Hapus data akademik ini? (Nilai terkait juga akan terhapus)')) return;
    try {
      const nilaiRecords = await DB.getNilaiByAkademik(id);
      for (const n of nilaiRecords) await DB.deleteNilai(n.id);
      const nonAkad = await DB.getNonAkademikByAkademik(id);
      for (const na of nonAkad) await DB.deleteNonAkademik(na.id);
      const p5Records = await DB.getP5ByAkademik(id);
      for (const p of p5Records) await DB.deleteP5(p.id);
      await DB.deleteAkademik(id);
      await this.loadData(); this.render();
    } catch (e) { alert('Gagal: ' + e.message); }
  },

  closeModal() {
    document.getElementById('da-modal').style.display = 'none';
    document.getElementById('da-modal-content').style.maxWidth = '480px';
  }
};
