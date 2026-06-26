// Status & Wali Kelas Component - Batch update status akhir tahun dan wali kelas
const StatusWali = {
  allAkademik: [],
  students: [],
  selectedTP: '',
  selectedKelas: '',
  studentList: [],
  statusValues: [],
  waliKelas: '',
  showingRekap: false,

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
    if (!this.selectedTP) return [];
    const s = new Set();
    this.allAkademik.filter(a => a.tahunPelajaran === this.selectedTP).forEach(a => { if (a.kelas) s.add(a.kelas); });
    return [...s].sort();
  },

  getStudentsInClass() {
    if (!this.selectedTP || !this.selectedKelas) return [];
    const akademikInClass = this.allAkademik.filter(a => a.tahunPelajaran === this.selectedTP && a.kelas === this.selectedKelas);
    const uniqueByNIS = {};
    akademikInClass.forEach(a => { uniqueByNIS[a.nis] = a; });
    return Object.values(uniqueByNIS).map(a => {
      const siswa = this.students.find(s => s.nis === a.nis);
      return { ...a, nama: siswa ? siswa.nama : a.nis, nisn: siswa ? siswa.nisn : '' };
    }).sort((a, b) => a.nama.localeCompare(b.nama));
  },

  onTPChange(val) {
    this.selectedTP = val;
    this.selectedKelas = '';
    this.studentList = [];
    this.statusValues = [];
    this.waliKelas = '';
    this.showingRekap = false;
    this.render();
  },

  onKelasChange(val) {
    this.selectedKelas = val;
    this.studentList = this.getStudentsInClass();
    this.statusValues = this.studentList.map(() => '');
    this.waliKelas = '';
    this.showingRekap = false;
    this.render();
    if (this.studentList.length > 0) this.loadExisting();
  },

  async loadExisting() {
    if (!this.selectedTP || !this.selectedKelas || this.studentList.length === 0) return;
    let firstWali = '';
    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const akad = await DB.getAkademik(student.id);
      if (akad) {
        this.statusValues[i] = akad.status || '';
        if (!firstWali && akad.waliKelas) firstWali = akad.waliKelas;
      }
    }
    this.waliKelas = firstWali;
    this.updateUI();
  },

  updateUI() {
    const waliInput = document.getElementById('sw-wali-input');
    if (waliInput) waliInput.value = this.waliKelas;
    for (let i = 0; i < this.studentList.length; i++) {
      const sel = document.getElementById('sw-status-' + i);
      if (sel) sel.value = this.statusValues[i] || '';
    }
  },

  onWaliChange(val) {
    this.waliKelas = val;
  },

  onStatusChange(index, val) {
    this.statusValues[index] = val;
  },

  setAllNaik() {
    for (let i = 0; i < this.studentList.length; i++) {
      this.statusValues[i] = 'Naik';
      const sel = document.getElementById('sw-status-' + i);
      if (sel) sel.value = 'Naik';
    }
  },

  setAllTidakNaik() {
    for (let i = 0; i < this.studentList.length; i++) {
      this.statusValues[i] = 'Tidak Naik';
      const sel = document.getElementById('sw-status-' + i);
      if (sel) sel.value = 'Tidak Naik';
    }
  },

  async saveAll() {
    if (!this.selectedTP || !this.selectedKelas || this.studentList.length === 0) return;
    const waliInput = document.getElementById('sw-wali-input');
    if (waliInput) this.waliKelas = waliInput.value.trim();

    for (let i = 0; i < this.studentList.length; i++) {
      const sel = document.getElementById('sw-status-' + i);
      if (sel) this.statusValues[i] = sel.value;
    }

    let savedCount = 0;
    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const akad = await DB.getAkademik(student.id);
      if (akad) {
        akad.status = this.statusValues[i];
        akad.waliKelas = this.waliKelas;
        await DB.updateAkademik(akad);
        savedCount++;
      }
    }

    // Update local cache
    this.allAkademik = await DB.getAllAkademik();

    // Show green indicator
    for (let i = 0; i < this.studentList.length; i++) {
      const sel = document.getElementById('sw-status-' + i);
      if (sel) sel.style.backgroundColor = 'var(--emerald-light)';
    }
    const waliEl = document.getElementById('sw-wali-input');
    if (waliEl) waliEl.style.backgroundColor = 'var(--emerald-light)';

    const indicator = document.getElementById('sw-save-indicator');
    if (indicator) {
      indicator.style.display = 'inline-block';
      setTimeout(() => { indicator.style.display = 'none'; }, 3000);
    }
  },

  showRekap() {
    this.showingRekap = true;
    this.render();
    this.loadRekapData();
  },

  hideRekap() {
    this.showingRekap = false;
    this.render();
    if (this.studentList.length > 0) this.loadExisting();
  },

  async loadRekapData() {
    const rekapBody = document.getElementById('sw-rekap-tbody');
    if (!rekapBody) return;
    let rows = '';
    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const akad = await DB.getAkademik(student.id);
      const status = akad ? (akad.status || '-') : '-';
      const wali = akad ? (akad.waliKelas || '-') : '-';
      rows += '<tr><td>' + (i + 1) + '</td><td>' + escapeHTMLDash(student.nama) + '</td><td>' + escapeHTMLDash(student.nis) + '</td><td>' + escapeHTMLDash(this.selectedKelas) + '</td><td>' + escapeHTMLDash(status) + '</td><td>' + escapeHTMLDash(wali) + '</td></tr>';
    }
    rekapBody.innerHTML = rows;
  },

  renderRekapTable() {
    return '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><h3 class="section-title" style="margin-bottom:0;">Rekap Status - ' + escapeHTMLDash(this.selectedKelas) + '</h3><button type="button" class="btn btn-outline" onclick="StatusWali.hideRekap()">Tutup Rekap</button></div><p class="muted" style="margin-bottom:12px;">' + this.studentList.length + ' siswa (urut alfabet).</p><div class="table-container"><table class="data-table"><thead><tr><th style="width:50px;">No</th><th>Nama</th><th>NIS</th><th>Kelas</th><th>Status</th><th>Wali Kelas</th></tr></thead><tbody id="sw-rekap-tbody"><tr><td colspan="6" class="empty-state">Memuat data...</td></tr></tbody></table></div></div>';
  },

  render() {
    const page = document.getElementById('page-status-wali');
    const tpList = this.getTPList();
    const kelasList = this.getKelasList();
    this.studentList = this.getStudentsInClass();
    const allSelected = this.selectedTP && this.selectedKelas;
    const showRekapBtn = this.selectedTP && this.selectedKelas && !this.showingRekap;

    page.innerHTML = '<div class="page-header"><h2 class="page-title">Status & Wali Kelas</h2></div>' +
      '<div class="card" style="margin-bottom:16px;"><div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">' +
      '<div class="form-group" style="margin-bottom:0;min-width:180px;"><label>Tahun Pelajaran</label><select id="sw-tp" onchange="StatusWali.onTPChange(this.value)"><option value="">-- Pilih TP --</option>' + tpList.map(tp => '<option value="' + escapeHTMLDash(tp) + '"' + (this.selectedTP === tp ? ' selected' : '') + '>' + escapeHTMLDash(tp) + '</option>').join('') + '</select></div>' +
      '<div class="form-group" style="margin-bottom:0;min-width:180px;"><label>Kelas</label><select id="sw-kelas" onchange="StatusWali.onKelasChange(this.value)" ' + (!this.selectedTP ? 'disabled' : '') + '><option value="">-- Pilih Kelas --</option>' + kelasList.map(k => '<option value="' + escapeHTMLDash(k) + '"' + (this.selectedKelas === k ? ' selected' : '') + '>' + escapeHTMLDash(k) + '</option>').join('') + '</select></div>' +
      (showRekapBtn ? '<div style="margin-bottom:0;"><button type="button" class="btn btn-outline" onclick="StatusWali.showRekap()" style="margin-top:20px;">Lihat Rekap Status</button></div>' : '') +
      '</div></div>' +
      (this.showingRekap ? this.renderRekapTable() : (allSelected && this.studentList.length > 0 ? this.renderInputArea() : this.renderPlaceholder()));

    if (!this.showingRekap && allSelected && this.studentList.length > 0) {
      this.updateUI();
    }
  },

  renderPlaceholder() {
    if (this.selectedTP && this.selectedKelas && this.studentList.length === 0) {
      return '<div class="card"><p class="muted">Tidak ada siswa di kelas ini. Tambahkan data akademik terlebih dahulu.</p></div>';
    }
    return '<div class="card"><p class="muted">Pilih Tahun Pelajaran dan Kelas untuk mulai mengatur status dan wali kelas.</p></div>';
  },

  renderInputArea() {
    return '<div class="card" style="margin-bottom:16px;"><div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;margin-bottom:16px;">' +
      '<div class="form-group" style="margin-bottom:0;flex:1;min-width:250px;"><label>Wali Kelas (berlaku untuk semua siswa di kelas ini)</label><input type="text" id="sw-wali-input" class="input-md" placeholder="Nama Wali Kelas" value="' + escapeHTMLDash(this.waliKelas) + '" onchange="StatusWali.onWaliChange(this.value)"></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:16px;">' +
      '<button type="button" class="btn btn-outline" onclick="StatusWali.setAllNaik()">Set Semua Naik</button>' +
      '<button type="button" class="btn btn-outline" onclick="StatusWali.setAllTidakNaik()">Set Semua Tidak Naik</button>' +
      '</div>' +
      '<h3 class="section-title">Daftar Siswa - ' + escapeHTMLDash(this.selectedKelas) + '</h3>' +
      '<p class="muted" style="margin-bottom:12px;">' + this.studentList.length + ' siswa (urut alfabet).</p>' +
      '<div class="table-container"><table class="data-table"><thead><tr><th style="width:50px;">No</th><th style="min-width:150px;">Nama Siswa</th><th style="width:120px;">NIS</th><th style="width:180px;">Status</th></tr></thead><tbody>' +
      this.studentList.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + escapeHTMLDash(s.nama) + '</td><td>' + escapeHTMLDash(s.nis) + '</td><td><select class="input-md" id="sw-status-' + i + '" onchange="StatusWali.onStatusChange(' + i + ', this.value)"><option value="">--</option><option value="Naik">Naik</option><option value="Tidak Naik">Tidak Naik</option></select></td></tr>').join('') +
      '</tbody></table></div>' +
      '<div class="form-actions" style="margin-top:16px;align-items:center;">' +
      '<span id="sw-save-indicator" style="display:none;color:var(--emerald);font-size:13px;font-weight:500;">Berhasil disimpan!</span>' +
      '<button type="button" class="btn btn-primary" onclick="StatusWali.saveAll()">Simpan Semua</button>' +
      '</div></div>';
  }
};
