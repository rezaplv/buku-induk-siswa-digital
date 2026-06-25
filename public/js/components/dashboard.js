// HTML escape utility to prevent XSS
function escapeHTMLDash(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Dashboard Component
const Dashboard = {
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
    const page = document.getElementById('page-dashboard');
    const filtered = this.getFilteredStudents();
    const totalSiswa = this.students.length;
    const kelasSet = new Set();
    const tpSet = new Set();
    Object.values(this.akademikMap).flat().forEach(a => {
      if (a.kelas) kelasSet.add(a.kelas);
      if (a.tahunPelajaran) tpSet.add(a.tahunPelajaran);
    });

    page.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Dashboard</h2>
        <button class="btn btn-primary" onclick="Dashboard.showAddModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tambah Siswa
        </button>
      </div>

      <div class="search-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="global-search" placeholder="Cari siswa berdasarkan NIS atau Nama..." 
               value="${this.searchTerm}" oninput="Dashboard.onSearch(this.value)">
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalSiswa}</div>
          <div class="stat-label">Total Siswa</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${kelasSet.size}</div>
          <div class="stat-label">Total Kelas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${tpSet.size || '-'}</div>
          <div class="stat-label">Tahun Pelajaran</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Daftar Siswa</h3>
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
                <tr><td colspan="7" class="empty-state">Belum ada data siswa. Klik "Tambah Siswa" atau gunakan fitur Import.</td></tr>
              ` : filtered.map((s, i) => {
                const akad = this.akademikMap[s.nis];
                const latest = akad && akad.length > 0 ? akad[akad.length - 1] : null;
                return `
                  <tr onclick="Router.navigateTo('student-detail', {nis: '${escapeHTMLDash(s.nis)}'})" class="clickable-row">
                    <td>${i + 1}</td>
                    <td><strong>${escapeHTMLDash(s.nama)}</strong></td>
                    <td>${escapeHTMLDash(s.nis)}</td>
                    <td>${escapeHTMLDash(s.nisn || '-')}</td>
                    <td>${latest ? escapeHTMLDash(latest.kelas) : '-'}</td>
                    <td>${latest ? escapeHTMLDash(latest.tahunPelajaran) : '-'}</td>
                    <td>
                      <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); Dashboard.editStudent('${escapeHTMLDash(s.nis)}')">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); Dashboard.deleteStudent('${escapeHTMLDash(s.nis)}')">Hapus</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div id="student-modal" class="modal" style="display:none;">
        <div class="modal-overlay" onclick="Dashboard.closeModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modal-title">Tambah Siswa</h3>
            <button class="modal-close" onclick="Dashboard.closeModal()">&times;</button>
          </div>
          <form id="student-form" onsubmit="Dashboard.saveStudent(event)">
            <div class="form-group">
              <label for="input-nama">Nama Peserta Didik</label>
              <input type="text" id="input-nama" required placeholder="Masukkan nama lengkap">
            </div>
            <div class="form-group">
              <label for="input-nis">NIS</label>
              <input type="text" id="input-nis" required placeholder="Masukkan NIS">
            </div>
            <div class="form-group">
              <label for="input-nisn">NISN</label>
              <input type="text" id="input-nisn" placeholder="Masukkan NISN">
            </div>
            <input type="hidden" id="input-edit-mode" value="add">
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="Dashboard.closeModal()">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  onSearch(value) {
    this.searchTerm = value;
    this.render();
    // Re-focus input and set cursor position
    const input = document.getElementById('global-search');
    if (input) {
      input.focus();
      input.setSelectionRange(value.length, value.length);
    }
  },

  showAddModal() {
    document.getElementById('student-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Tambah Siswa';
    document.getElementById('input-nama').value = '';
    document.getElementById('input-nis').value = '';
    document.getElementById('input-nisn').value = '';
    document.getElementById('input-nis').disabled = false;
    document.getElementById('input-edit-mode').value = 'add';
  },

  async editStudent(nis) {
    const siswa = await DB.getSiswa(nis);
    if (!siswa) return;
    document.getElementById('student-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Edit Siswa';
    document.getElementById('input-nama').value = siswa.nama;
    document.getElementById('input-nis').value = siswa.nis;
    document.getElementById('input-nis').disabled = true;
    document.getElementById('input-nisn').value = siswa.nisn || '';
    document.getElementById('input-edit-mode').value = 'edit';
  },

  closeModal() {
    document.getElementById('student-modal').style.display = 'none';
  },

  async saveStudent(event) {
    event.preventDefault();
    const nama = document.getElementById('input-nama').value.trim();
    const nis = document.getElementById('input-nis').value.trim();
    const nisn = document.getElementById('input-nisn').value.trim();
    const mode = document.getElementById('input-edit-mode').value;

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
      // Delete related records
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
  }
};
