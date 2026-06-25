// Input Data Component - handles CRUD operations for students
const InputData = {
  searchTerm: '',
  students: [],
  akademikMap: {},

  async init() {
    await this.loadData();
    this.render();
  },

  async loadData() {
    this.students = await DB.getAllSiswa();
    const allAkademik = await DB.getAllAkademik();
    this.akademikMap = {};
    allAkademik.forEach(a => {
      if (!this.akademikMap[a.nis]) this.akademikMap[a.nis] = [];
      this.akademikMap[a.nis].push(a);
    });
  },

  getFilteredStudents() {
    let result = this.students;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(s =>
        s.nama.toLowerCase().includes(term) ||
        s.nis.toLowerCase().includes(term) ||
        (s.nisn && s.nisn.toLowerCase().includes(term))
      );
    }
    return result.sort((a, b) => a.nama.localeCompare(b.nama));
  },

  render() {
    const page = document.getElementById('page-input-data');
    const filtered = this.getFilteredStudents();

    page.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Input Data Siswa</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="InputData.showAddModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Siswa
          </button>
          <button class="btn btn-outline" onclick="InputData.showBatchModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Tambah Batch
          </button>
        </div>
      </div>

      <div class="search-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="input-data-search" placeholder="Cari siswa berdasarkan NIS atau Nama..." 
               value="${this.searchTerm}" oninput="InputData.onSearch(this.value)">
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Kelola Data Siswa</h3>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>NIS</th>
                <th>NISN</th>
                <th>Kelas</th>
                <th>Tahun Pelajaran</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr><td colspan="7" class="empty-state">Belum ada data siswa. Klik "Tambah Siswa" atau "Tambah Batch" untuk menambahkan.</td></tr>
              ` : filtered.map((s, i) => {
                const akad = this.akademikMap[s.nis];
                const latest = akad && akad.length > 0 ? akad[akad.length - 1] : null;
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHTMLDash(s.nama)}</strong></td>
                    <td>${escapeHTMLDash(s.nis)}</td>
                    <td>${escapeHTMLDash(s.nisn || '-')}</td>
                    <td>${latest ? escapeHTMLDash(latest.kelas) : '-'}</td>
                    <td>${latest ? escapeHTMLDash(latest.tahunPelajaran) : '-'}</td>
                    <td>
                      <button class="btn btn-sm btn-outline" onclick="InputData.editStudent('${escapeHTMLDash(s.nis)}')">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="InputData.deleteStudent('${escapeHTMLDash(s.nis)}')">Hapus</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div id="inputdata-student-modal" class="modal" style="display:none;">
        <div class="modal-overlay" onclick="InputData.closeModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="inputdata-modal-title">Tambah Siswa</h3>
            <button class="modal-close" onclick="InputData.closeModal()">&times;</button>
          </div>
          <form id="inputdata-student-form" onsubmit="InputData.saveStudent(event)">
            <div class="form-group">
              <label for="inputdata-input-nama">Nama Peserta Didik</label>
              <input type="text" id="inputdata-input-nama" required placeholder="Masukkan nama lengkap">
            </div>
            <div class="form-group">
              <label for="inputdata-input-nis">NIS</label>
              <input type="text" id="inputdata-input-nis" required placeholder="Masukkan NIS">
            </div>
            <div class="form-group">
              <label for="inputdata-input-nisn">NISN</label>
              <input type="text" id="inputdata-input-nisn" placeholder="Masukkan NISN">
            </div>
            <div id="inputdata-akademik-section">
              <hr style="margin:16px 0;border:none;border-top:1px solid var(--border-color);">
              <p style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;">Data Akademik (opsional)</p>
              <div class="form-group">
                <label>Tahun Pelajaran</label>
                <input type="text" id="inputdata-input-tp" placeholder="Contoh: 2025/2026">
              </div>
              <div class="form-group">
                <label>Kelas</label>
                <input type="text" id="inputdata-input-kelas" placeholder="Contoh: VII D">
              </div>
              <div class="form-group">
                <label>Wali Kelas</label>
                <input type="text" id="inputdata-input-wali" placeholder="Nama wali kelas">
              </div>
              <div class="form-group">
                <label>Status Akhir Tahun</label>
                <select id="inputdata-input-status">
                  <option value="">-- Belum ditentukan --</option>
                  <option value="Naik">Naik</option>
                  <option value="Tidak Naik">Tidak Naik</option>
                </select>
              </div>
            </div>
            <input type="hidden" id="inputdata-input-edit-mode" value="add">
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="InputData.closeModal()">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Batch Add Modal -->
      <div id="inputdata-batch-modal" class="modal" style="display:none;">
        <div class="modal-overlay" onclick="InputData.closeBatchModal()"></div>
        <div class="modal-content" style="max-width:900px;">
          <div class="modal-header">
            <h3>Tambah Siswa Batch</h3>
            <button class="modal-close" onclick="InputData.closeBatchModal()">&times;</button>
          </div>
          <div id="inputdata-batch-content">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;padding:16px;background:var(--bg-primary);border-radius:var(--radius-sm);border:1px solid var(--border-color);">
              <div class="form-group" style="margin-bottom:0;"><label>Tahun Pelajaran</label><input type="text" id="inputdata-batch-tp" placeholder="2025/2026"></div>
              <div class="form-group" style="margin-bottom:0;"><label>Kelas</label><input type="text" id="inputdata-batch-kelas" placeholder="VII D"></div>
              <div class="form-group" style="margin-bottom:0;"><label>Wali Kelas</label><input type="text" id="inputdata-batch-wali" placeholder="Nama wali kelas"></div>
              <div class="form-group" style="margin-bottom:0;"><label>Status Akhir Tahun</label><select id="inputdata-batch-status"><option value="">-- Belum ditentukan --</option><option value="Naik">Naik</option><option value="Tidak Naik">Tidak Naik</option></select></div>
            </div>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">* Data akademik di atas akan diterapkan ke SEMUA siswa yang diinput di bawah (opsional)</p>
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">Paste daftar nama, NIS, dan NISN masing-masing di kolom terpisah (satu per baris). Data akan dicocokkan berdasarkan nomor baris.</p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
              <div class="form-group" style="margin-bottom:4px;">
                <label>NAMA (paste list)</label>
                <textarea id="inputdata-batch-nama" rows="10" placeholder="Ahmad Fauzi\nSiti Aminah\nBudi Santoso" oninput="InputData.updateBatchCounters()"></textarea>
                <span id="inputdata-batch-nama-count" style="font-size:12px;color:var(--text-muted);margin-top:4px;display:block;">0 baris</span>
              </div>
              <div class="form-group" style="margin-bottom:4px;">
                <label>NIS (paste list)</label>
                <textarea id="inputdata-batch-nis" rows="10" placeholder="2401001\n2401002\n2401003" oninput="InputData.updateBatchCounters()"></textarea>
                <span id="inputdata-batch-nis-count" style="font-size:12px;color:var(--text-muted);margin-top:4px;display:block;">0 baris</span>
              </div>
              <div class="form-group" style="margin-bottom:4px;">
                <label>NISN (paste list)</label>
                <textarea id="inputdata-batch-nisn" rows="10" placeholder="0012345601\n0012345602\n0012345603" oninput="InputData.updateBatchCounters()"></textarea>
                <span id="inputdata-batch-nisn-count" style="font-size:12px;color:var(--text-muted);margin-top:4px;display:block;">0 baris</span>
              </div>
            </div>
            <div style="display:flex;gap:12px;align-items:center;margin:12px 0;">
              <button type="button" class="btn btn-outline btn-sm" onclick="InputData.previewBatch()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Preview
              </button>
              <span id="inputdata-batch-mismatch-warning" style="font-size:12px;color:#DC2626;display:none;"></span>
            </div>
            <div id="inputdata-batch-preview" style="display:none;max-height:220px;overflow-y:auto;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-bottom:12px;">
              <table class="data-table" style="font-size:12px;">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>NIS</th>
                    <th>NISN</th>
                  </tr>
                </thead>
                <tbody id="inputdata-batch-preview-body"></tbody>
              </table>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="InputData.closeBatchModal()">Batal</button>
              <button type="button" class="btn btn-primary" onclick="InputData.saveBatch()">Simpan Semua</button>
            </div>
          </div>
          <div id="inputdata-batch-results" style="display:none;"></div>
        </div>
      </div>
    `;
  },

  onSearch(value) {
    this.searchTerm = value;
    this.render();
    const input = document.getElementById('input-data-search');
    if (input) {
      input.focus();
      input.setSelectionRange(value.length, value.length);
    }
  },

  showAddModal() {
    document.getElementById('inputdata-student-modal').style.display = 'flex';
    document.getElementById('inputdata-modal-title').textContent = 'Tambah Siswa';
    document.getElementById('inputdata-input-nama').value = '';
    document.getElementById('inputdata-input-nis').value = '';
    document.getElementById('inputdata-input-nisn').value = '';
    document.getElementById('inputdata-input-nis').disabled = false;
    document.getElementById('inputdata-input-edit-mode').value = 'add';
    document.getElementById('inputdata-input-tp').value = '';
    document.getElementById('inputdata-input-kelas').value = '';
    document.getElementById('inputdata-input-wali').value = '';
    document.getElementById('inputdata-input-status').value = '';
    document.getElementById('inputdata-akademik-section').style.display = 'block';
  },

  async editStudent(nis) {
    const siswa = await DB.getSiswa(nis);
    if (!siswa) return;
    document.getElementById('inputdata-student-modal').style.display = 'flex';
    document.getElementById('inputdata-modal-title').textContent = 'Edit Siswa';
    document.getElementById('inputdata-input-nama').value = siswa.nama;
    document.getElementById('inputdata-input-nis').value = siswa.nis;
    document.getElementById('inputdata-input-nis').disabled = true;
    document.getElementById('inputdata-input-nisn').value = siswa.nisn || '';
    document.getElementById('inputdata-input-edit-mode').value = 'edit';
    document.getElementById('inputdata-akademik-section').style.display = 'none';
  },

  closeModal() {
    document.getElementById('inputdata-student-modal').style.display = 'none';
  },

  async saveStudent(event) {
    event.preventDefault();
    const nama = document.getElementById('inputdata-input-nama').value.trim();
    const nis = document.getElementById('inputdata-input-nis').value.trim();
    const nisn = document.getElementById('inputdata-input-nisn').value.trim();
    const mode = document.getElementById('inputdata-input-edit-mode').value;

    if (!nama || !nis) {
      alert('Nama dan NIS wajib diisi!');
      return;
    }

    const data = { nama, nis, nisn };

    try {
      if (mode === 'edit') {
        await DB.updateSiswa(data);
      } else {
        await DB.addSiswa(data);
        const tp = document.getElementById('inputdata-input-tp').value.trim();
        const kelas = document.getElementById('inputdata-input-kelas').value.trim();
        const wali = document.getElementById('inputdata-input-wali').value.trim();
        const status = document.getElementById('inputdata-input-status').value;
        if (tp && kelas) {
          await DB.addAkademik({ nis, tahunPelajaran: tp, kelas, waliKelas: wali, status });
        }
      }
      this.closeModal();
      await this.loadData();
      this.render();
    } catch (e) {
      alert('Gagal menyimpan: ' + e.message);
    }
  },

  async deleteStudent(nis) {
    if (!confirm('Yakin ingin menghapus siswa ini beserta semua datanya?')) return;
    try {
      const akademikRecords = await DB.getAkademikBySiswa(nis);
      for (const akad of akademikRecords) {
        const nilaiRecords = await DB.getNilaiByAkademik(akad.id);
        for (const n of nilaiRecords) await DB.deleteNilai(n.id);
        const nonAkad = await DB.getNonAkademikByAkademik(akad.id);
        for (const na of nonAkad) await DB.deleteNonAkademik(na.id);
        const p5Records = await DB.getP5ByAkademik(akad.id);
        for (const p of p5Records) await DB.deleteP5(p.id);
        await DB.deleteAkademik(akad.id);
      }
      await DB.deleteSiswa(nis);
      await this.loadData();
      this.render();
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
  },

  showBatchModal() {
    document.getElementById('inputdata-batch-modal').style.display = 'flex';
    document.getElementById('inputdata-batch-content').style.display = 'block';
    document.getElementById('inputdata-batch-results').style.display = 'none';
    document.getElementById('inputdata-batch-nama').value = '';
    document.getElementById('inputdata-batch-nis').value = '';
    document.getElementById('inputdata-batch-nisn').value = '';
    document.getElementById('inputdata-batch-preview').style.display = 'none';
    document.getElementById('inputdata-batch-mismatch-warning').style.display = 'none';
    document.getElementById('inputdata-batch-tp').value = '';
    document.getElementById('inputdata-batch-kelas').value = '';
    document.getElementById('inputdata-batch-wali').value = '';
    document.getElementById('inputdata-batch-status').value = '';
    this.updateBatchCounters();
  },

  closeBatchModal() {
    document.getElementById('inputdata-batch-modal').style.display = 'none';
  },

  updateBatchCounters() {
    const namaLines = document.getElementById('inputdata-batch-nama').value.split('\n').filter(l => l.trim()).length;
    const nisLines = document.getElementById('inputdata-batch-nis').value.split('\n').filter(l => l.trim()).length;
    const nisnLines = document.getElementById('inputdata-batch-nisn').value.split('\n').filter(l => l.trim()).length;
    document.getElementById('inputdata-batch-nama-count').textContent = namaLines + ' baris';
    document.getElementById('inputdata-batch-nis-count').textContent = nisLines + ' baris';
    document.getElementById('inputdata-batch-nisn-count').textContent = nisnLines + ' baris';
  },

  getBatchData() {
    const namaLines = document.getElementById('inputdata-batch-nama').value.split('\n');
    const nisLines = document.getElementById('inputdata-batch-nis').value.split('\n');
    const nisnLines = document.getElementById('inputdata-batch-nisn').value.split('\n');
    const maxLen = Math.max(namaLines.length, nisLines.length, nisnLines.length);
    const rows = [];
    for (let i = 0; i < maxLen; i++) {
      const nama = (namaLines[i] || '').trim();
      const nis = (nisLines[i] || '').trim();
      const nisn = (nisnLines[i] || '').trim();
      if (!nama && !nis && !nisn) continue;
      rows.push({ nama, nis, nisn, lineNum: i + 1, hasWarning: !nama || !nis });
    }
    return rows;
  },

  previewBatch() {
    const rows = this.getBatchData();
    const previewDiv = document.getElementById('inputdata-batch-preview');
    const tbody = document.getElementById('inputdata-batch-preview-body');
    const warningEl = document.getElementById('inputdata-batch-mismatch-warning');

    if (rows.length === 0) {
      previewDiv.style.display = 'none';
      warningEl.style.display = 'none';
      return;
    }

    const namaCount = document.getElementById('inputdata-batch-nama').value.split('\n').filter(l => l.trim()).length;
    const nisCount = document.getElementById('inputdata-batch-nis').value.split('\n').filter(l => l.trim()).length;
    const nisnCount = document.getElementById('inputdata-batch-nisn').value.split('\n').filter(l => l.trim()).length;

    if (namaCount !== nisCount || namaCount !== nisnCount) {
      warningEl.textContent = 'Peringatan: Jumlah baris tidak sama (Nama: ' + namaCount + ', NIS: ' + nisCount + ', NISN: ' + nisnCount + ')';
      warningEl.style.display = 'inline';
    } else {
      warningEl.style.display = 'none';
    }

    let html = '';
    rows.forEach((row, idx) => {
      const bgStyle = row.hasWarning ? 'background:#FEF2F2;' : '';
      html += '<tr style="' + bgStyle + '">';
      html += '<td>' + (idx + 1) + '</td>';
      html += '<td>' + escapeHTMLDash(row.nama || '<span style=color:#DC2626>— kosong —</span>') + '</td>';
      html += '<td>' + escapeHTMLDash(row.nis || '<span style=color:#DC2626>— kosong —</span>') + '</td>';
      html += '<td>' + escapeHTMLDash(row.nisn) + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
    previewDiv.style.display = 'block';
  },

  async saveBatch() {
    const rows = this.getBatchData();
    const students = [];
    const errors = [];

    rows.forEach((row) => {
      if (!row.nama || !row.nis) {
        errors.push('Baris ' + row.lineNum + ': Nama dan NIS wajib diisi');
        return;
      }
      students.push({ nama: row.nama, nis: row.nis, nisn: row.nisn });
    });

    if (students.length === 0 && errors.length === 0) {
      alert('Tidak ada data yang dimasukkan.');
      return;
    }

    const tp = document.getElementById('inputdata-batch-tp').value.trim();
    const kelas = document.getElementById('inputdata-batch-kelas').value.trim();
    const wali = document.getElementById('inputdata-batch-wali').value.trim();
    const status = document.getElementById('inputdata-batch-status').value;

    let success = 0;
    let failed = 0;
    const failDetails = [];

    for (const s of students) {
      try {
        await DB.addSiswa(s);
        if (tp && kelas) {
          await DB.addAkademik({ nis: s.nis, tahunPelajaran: tp, kelas, waliKelas: wali, status });
        }
        success++;
      } catch (e) {
        failed++;
        failDetails.push(s.nama + ' (' + s.nis + '): ' + e.message);
      }
    }

    document.getElementById('inputdata-batch-content').style.display = 'none';
    const resultsDiv = document.getElementById('inputdata-batch-results');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `
      <div style="text-align:center;padding:16px 0;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${failed === 0 ? 'var(--emerald)' : '#F59E0B'}" stroke-width="2" style="margin-bottom:12px;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <h3 style="margin-bottom:8px;color:var(--navy);">Hasil Input Batch</h3>
        <div class="import-results-summary" style="justify-content:center;">
          <span class="result-item success"><strong>${success}</strong> berhasil</span>
          <span class="result-item failed"><strong>${failed}</strong> gagal</span>
        </div>
        ${errors.length > 0 ? `
        <div class="error-list">
          <h4>Error Parsing:</h4>
          <ul>${errors.map(e => '<li>' + escapeHTMLDash(e) + '</li>').join('')}</ul>
        </div>` : ''}
        ${failDetails.length > 0 ? `
        <div class="error-list" style="margin-top:8px;">
          <h4>Gagal Disimpan:</h4>
          <ul>${failDetails.map(e => '<li>' + escapeHTMLDash(e) + '</li>').join('')}</ul>
        </div>` : ''}
        <div class="form-actions" style="margin-top:16px;justify-content:center;">
          <button type="button" class="btn btn-primary" onclick="InputData.closeBatchModal(); InputData.loadData().then(() => InputData.render());">Selesai</button>
        </div>
      </div>
    `;
  }
};
