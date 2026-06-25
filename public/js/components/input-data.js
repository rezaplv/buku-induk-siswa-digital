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
    if (!this.searchTerm) return this.students;
    const term = this.searchTerm.toLowerCase();
    return this.students.filter(s =>
      s.nama.toLowerCase().includes(term) ||
      s.nis.toLowerCase().includes(term) ||
      (s.nisn && s.nisn.toLowerCase().includes(term))
    );
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
        <div class="modal-content" style="max-width:680px;">
          <div class="modal-header">
            <h3>Tambah Siswa Batch</h3>
            <button class="modal-close" onclick="InputData.closeBatchModal()">&times;</button>
          </div>
          <div id="inputdata-batch-content">
            <div class="form-group">
              <label>Paste Data (format: Nama;NIS;NISN per baris)</label>
              <textarea id="inputdata-batch-textarea" rows="8" placeholder="Contoh:\nAhmad Fauzi;2401001;0012345601\nSiti Aminah;2401002;0012345602\nBudi Santoso;2401003;0012345603"></textarea>
            </div>
            <p style="text-align:center;color:var(--text-muted);margin:12px 0;font-size:13px;">— atau gunakan tabel di bawah —</p>
            <div class="form-group">
              <label>Input Manual</label>
              <div class="table-container">
                <table class="data-table" id="inputdata-batch-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama</th>
                      <th>NIS</th>
                      <th>NISN</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody id="inputdata-batch-table-body">
                    <tr>
                      <td>1</td>
                      <td><input type="text" class="input-md batch-nama" placeholder="Nama"></td>
                      <td><input type="text" class="input-md batch-nis" placeholder="NIS"></td>
                      <td><input type="text" class="input-md batch-nisn" placeholder="NISN"></td>
                      <td><button type="button" class="btn btn-sm btn-danger" onclick="InputData.removeBatchRow(this)">×</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button type="button" class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="InputData.addBatchRow()">+ Tambah Baris</button>
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
    document.getElementById('inputdata-batch-textarea').value = '';
    document.getElementById('inputdata-batch-table-body').innerHTML = `
      <tr>
        <td>1</td>
        <td><input type="text" class="input-md batch-nama" placeholder="Nama"></td>
        <td><input type="text" class="input-md batch-nis" placeholder="NIS"></td>
        <td><input type="text" class="input-md batch-nisn" placeholder="NISN"></td>
        <td><button type="button" class="btn btn-sm btn-danger" onclick="InputData.removeBatchRow(this)">×</button></td>
      </tr>
    `;
  },

  closeBatchModal() {
    document.getElementById('inputdata-batch-modal').style.display = 'none';
  },

  addBatchRow() {
    const tbody = document.getElementById('inputdata-batch-table-body');
    const rowCount = tbody.rows.length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${rowCount}</td>
      <td><input type="text" class="input-md batch-nama" placeholder="Nama"></td>
      <td><input type="text" class="input-md batch-nis" placeholder="NIS"></td>
      <td><input type="text" class="input-md batch-nisn" placeholder="NISN"></td>
      <td><button type="button" class="btn btn-sm btn-danger" onclick="InputData.removeBatchRow(this)">×</button></td>
    `;
    tbody.appendChild(tr);
    InputData.renumberBatchRows();
  },

  removeBatchRow(btn) {
    const tbody = document.getElementById('inputdata-batch-table-body');
    if (tbody.rows.length <= 1) return;
    btn.closest('tr').remove();
    InputData.renumberBatchRows();
  },

  renumberBatchRows() {
    const tbody = document.getElementById('inputdata-batch-table-body');
    Array.from(tbody.rows).forEach((row, i) => {
      row.cells[0].textContent = i + 1;
    });
  },

  async saveBatch() {
    const students = [];
    const errors = [];

    const textareaVal = document.getElementById('inputdata-batch-textarea').value.trim();
    if (textareaVal) {
      const lines = textareaVal.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const parts = trimmed.split(';');
        if (parts.length < 2) {
          errors.push('Baris ' + (idx + 1) + ': format salah (harus Nama;NIS;NISN)');
          return;
        }
        const nama = parts[0].trim();
        const nis = parts[1].trim();
        const nisn = parts.length >= 3 ? parts[2].trim() : '';
        if (!nama || !nis) {
          errors.push('Baris ' + (idx + 1) + ': Nama dan NIS wajib diisi');
          return;
        }
        students.push({ nama, nis, nisn });
      });
    }

    const tbody = document.getElementById('inputdata-batch-table-body');
    Array.from(tbody.rows).forEach((row, idx) => {
      const nama = row.querySelector('.batch-nama').value.trim();
      const nis = row.querySelector('.batch-nis').value.trim();
      const nisn = row.querySelector('.batch-nisn').value.trim();
      if (!nama && !nis && !nisn) return;
      if (!nama || !nis) {
        errors.push('Tabel baris ' + (idx + 1) + ': Nama dan NIS wajib diisi');
        return;
      }
      students.push({ nama, nis, nisn });
    });

    if (students.length === 0 && errors.length === 0) {
      alert('Tidak ada data yang dimasukkan.');
      return;
    }

    let success = 0;
    let failed = 0;
    const failDetails = [];

    for (const s of students) {
      try {
        await DB.addSiswa(s);
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
