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

// Dashboard Component - Read-only overview
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
                <tr><td colspan="7" class="empty-state">Belum ada data siswa. Gunakan menu "Input Data" untuk menambahkan siswa.</td></tr>
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
                      <button class="btn btn-sm btn-outline" onclick="Router.navigateTo('student-detail', {nis: '${escapeHTMLDash(s.nis)}'})">Lihat</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  onSearch(value) {
    this.searchTerm = value;
    this.render();
    const input = document.getElementById('global-search');
    if (input) {
      input.focus();
      input.setSelectionRange(value.length, value.length);
    }
  }
};
