// Ketidakhadiran Component - Input data ketidakhadiran siswa per semester
const Ketidakhadiran = {
  allAkademik: [],
  students: [],
  selectedTP: '',
  selectedKelas: '',
  selectedSemester: '1',
  studentList: [],
  sakitValues: [],
  izinValues: [],
  alphaValues: [],
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
    this.sakitValues = [];
    this.izinValues = [];
    this.alphaValues = [];
    this.showingRekap = false;
    this.render();
  },

  onKelasChange(val) {
    this.selectedKelas = val;
    this.studentList = this.getStudentsInClass();
    this.sakitValues = this.studentList.map(() => 0);
    this.izinValues = this.studentList.map(() => 0);
    this.alphaValues = this.studentList.map(() => 0);
    this.showingRekap = false;
    this.render();
    if (this.studentList.length > 0) this.loadExisting();
  },

  onSemesterChange(val) {
    this.selectedSemester = val;
    this.sakitValues = this.studentList.map(() => 0);
    this.izinValues = this.studentList.map(() => 0);
    this.alphaValues = this.studentList.map(() => 0);
    this.showingRekap = false;
    this.render();
    if (this.studentList.length > 0) this.loadExisting();
  },

  async loadExisting() {
    if (!this.selectedTP || !this.selectedKelas || this.studentList.length === 0) return;
    const sakitField = this.selectedSemester === '1' ? 'sakit1' : 'sakit2';
    const izinField = this.selectedSemester === '1' ? 'izin1' : 'izin2';
    const alphaField = this.selectedSemester === '1' ? 'alpha1' : 'alpha2';

    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const nonAkademikArr = await DB.getNonAkademikByAkademik(student.id);
      const na = nonAkademikArr.length > 0 ? nonAkademikArr[0] : null;
      this.sakitValues[i] = na ? (na[sakitField] || 0) : 0;
      this.izinValues[i] = na ? (na[izinField] || 0) : 0;
      this.alphaValues[i] = na ? (na[alphaField] || 0) : 0;
    }
    this.updateTableInputs();
    this.updateTextareasFromValues();
  },

  updateTableInputs() {
    for (let i = 0; i < this.studentList.length; i++) {
      const sakitInput = document.getElementById('hadir-sakit-' + i);
      const izinInput = document.getElementById('hadir-izin-' + i);
      const alphaInput = document.getElementById('hadir-alpha-' + i);
      if (sakitInput) sakitInput.value = this.sakitValues[i] || 0;
      if (izinInput) izinInput.value = this.izinValues[i] || 0;
      if (alphaInput) alphaInput.value = this.alphaValues[i] || 0;
    }
  },

  updateTextareasFromValues() {
    const taSakit = document.getElementById('paste-sakit-textarea');
    const taIzin = document.getElementById('paste-izin-textarea');
    const taAlpha = document.getElementById('paste-alpha-textarea');
    if (taSakit) taSakit.value = this.sakitValues.map(v => v || 0).join('\n');
    if (taIzin) taIzin.value = this.izinValues.map(v => v || 0).join('\n');
    if (taAlpha) taAlpha.value = this.alphaValues.map(v => v || 0).join('\n');
  },

  applyPaste() {
    const taSakit = document.getElementById('paste-sakit-textarea');
    const taIzin = document.getElementById('paste-izin-textarea');
    const taAlpha = document.getElementById('paste-alpha-textarea');
    if (!taSakit || !taIzin || !taAlpha) return;

    const sakitLines = taSakit.value.split('\n');
    const izinLines = taIzin.value.split('\n');
    const alphaLines = taAlpha.value.split('\n');

    for (let i = 0; i < this.studentList.length; i++) {
      this.sakitValues[i] = parseInt(sakitLines[i]) || 0;
      this.izinValues[i] = parseInt(izinLines[i]) || 0;
      this.alphaValues[i] = parseInt(alphaLines[i]) || 0;
    }
    this.updateTableInputs();
  },

  onManualSakit(index, value) { this.sakitValues[index] = parseInt(value) || 0; },
  onManualIzin(index, value) { this.izinValues[index] = parseInt(value) || 0; },
  onManualAlpha(index, value) { this.alphaValues[index] = parseInt(value) || 0; },

  async saveAll() {
    if (!this.selectedTP || !this.selectedKelas || this.studentList.length === 0) return;

    for (let i = 0; i < this.studentList.length; i++) {
      const sakitInput = document.getElementById('hadir-sakit-' + i);
      const izinInput = document.getElementById('hadir-izin-' + i);
      const alphaInput = document.getElementById('hadir-alpha-' + i);
      if (sakitInput) this.sakitValues[i] = parseInt(sakitInput.value) || 0;
      if (izinInput) this.izinValues[i] = parseInt(izinInput.value) || 0;
      if (alphaInput) this.alphaValues[i] = parseInt(alphaInput.value) || 0;
    }

    const sakitField = this.selectedSemester === '1' ? 'sakit1' : 'sakit2';
    const izinField = this.selectedSemester === '1' ? 'izin1' : 'izin2';
    const alphaField = this.selectedSemester === '1' ? 'alpha1' : 'alpha2';
    let savedCount = 0;

    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const nonAkademikArr = await DB.getNonAkademikByAkademik(student.id);
      const existing = nonAkademikArr.length > 0 ? nonAkademikArr[0] : null;

      if (existing) {
        const updated = { ...existing };
        updated[sakitField] = this.sakitValues[i];
        updated[izinField] = this.izinValues[i];
        updated[alphaField] = this.alphaValues[i];
        await DB.updateNonAkademik(updated);
      } else {
        const newRecord = {
          akademikId: student.id,
          ekskulKegiatan1: '',
          ekskulKet1: '',
          ekskulKegiatan2: '',
          ekskulKet2: '',
          sakit1: 0, izin1: 0, alpha1: 0,
          sakit2: 0, izin2: 0, alpha2: 0
        };
        newRecord[sakitField] = this.sakitValues[i];
        newRecord[izinField] = this.izinValues[i];
        newRecord[alphaField] = this.alphaValues[i];
        await DB.addNonAkademik(newRecord);
      }
      savedCount++;
    }

    alert('Berhasil menyimpan data ketidakhadiran Semester ' + this.selectedSemester + ' untuk ' + savedCount + ' siswa!');
    await this.loadExisting();
    this.markSavedIndicators();
  },

  markSavedIndicators() {
    for (let i = 0; i < this.studentList.length; i++) {
      const sakitInput = document.getElementById('hadir-sakit-' + i);
      const izinInput = document.getElementById('hadir-izin-' + i);
      const alphaInput = document.getElementById('hadir-alpha-' + i);
      if (sakitInput) sakitInput.style.backgroundColor = 'var(--emerald-light)';
      if (izinInput) izinInput.style.backgroundColor = 'var(--emerald-light)';
      if (alphaInput) alphaInput.style.backgroundColor = 'var(--emerald-light)';
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
    const rekapBody = document.getElementById('hadir-rekap-tbody');
    if (!rekapBody) return;

    let rows = '';
    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const nonAkademikArr = await DB.getNonAkademikByAkademik(student.id);
      const na = nonAkademikArr.length > 0 ? nonAkademikArr[0] : null;
      const s1 = na ? (na.sakit1 || 0) : 0;
      const i1 = na ? (na.izin1 || 0) : 0;
      const a1 = na ? (na.alpha1 || 0) : 0;
      const s2 = na ? (na.sakit2 || 0) : 0;
      const i2 = na ? (na.izin2 || 0) : 0;
      const a2 = na ? (na.alpha2 || 0) : 0;
      rows += '<tr><td>' + (i + 1) + '</td><td>' + escapeHTMLDash(student.nama) + '</td><td class="center">' + s1 + '</td><td class="center">' + i1 + '</td><td class="center">' + a1 + '</td><td class="center">' + s2 + '</td><td class="center">' + i2 + '</td><td class="center">' + a2 + '</td></tr>';
    }
    rekapBody.innerHTML = rows;
  },

  renderRekapTable() {
    return '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><h3 class="section-title" style="margin-bottom:0;">Rekap Kehadiran - ' + escapeHTMLDash(this.selectedKelas) + '</h3><button type="button" class="btn btn-outline" onclick="Ketidakhadiran.hideRekap()">Tutup Rekap</button></div><p class="muted" style="margin-bottom:12px;">' + this.studentList.length + ' siswa (urut alfabet). Data kedua semester ditampilkan.</p><div class="table-container"><table class="data-table"><thead><tr><th style="width:50px;">No</th><th style="min-width:150px;">Nama Siswa</th><th>S1-Sakit</th><th>S1-Izin</th><th>S1-Alpha</th><th>S2-Sakit</th><th>S2-Izin</th><th>S2-Alpha</th></tr></thead><tbody id="hadir-rekap-tbody"><tr><td colspan="8" class="empty-state">Memuat data...</td></tr></tbody></table></div></div>';
  },

  render() {
    const page = document.getElementById('page-ketidakhadiran');
    const tpList = this.getTPList();
    const kelasList = this.getKelasList();
    this.studentList = this.getStudentsInClass();
    const allSelected = this.selectedTP && this.selectedKelas && this.selectedSemester;
    const showRekapBtn = this.selectedTP && this.selectedKelas && !this.showingRekap;

    page.innerHTML = '<div class="page-header"><h2 class="page-title">Ketidakhadiran</h2></div>' +
      '<div class="card" style="margin-bottom:16px;"><div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">' +
      '<div class="form-group" style="margin-bottom:0;min-width:180px;"><label>Tahun Pelajaran</label><select id="hadir-tp" onchange="Ketidakhadiran.onTPChange(this.value)"><option value="">-- Pilih TP --</option>' + tpList.map(tp => '<option value="' + escapeHTMLDash(tp) + '"' + (this.selectedTP === tp ? ' selected' : '') + '>' + escapeHTMLDash(tp) + '</option>').join('') + '</select></div>' +
      '<div class="form-group" style="margin-bottom:0;min-width:180px;"><label>Kelas</label><select id="hadir-kelas" onchange="Ketidakhadiran.onKelasChange(this.value)" ' + (!this.selectedTP ? 'disabled' : '') + '><option value="">-- Pilih Kelas --</option>' + kelasList.map(k => '<option value="' + escapeHTMLDash(k) + '"' + (this.selectedKelas === k ? ' selected' : '') + '>' + escapeHTMLDash(k) + '</option>').join('') + '</select></div>' +
      '<div class="form-group" style="margin-bottom:0;min-width:150px;"><label>Semester</label><select id="hadir-semester" onchange="Ketidakhadiran.onSemesterChange(this.value)" ' + (!this.selectedKelas ? 'disabled' : '') + '><option value="1" ' + (this.selectedSemester === '1' ? 'selected' : '') + '>Semester 1</option><option value="2" ' + (this.selectedSemester === '2' ? 'selected' : '') + '>Semester 2</option></select></div>' +
      (showRekapBtn ? '<div style="margin-bottom:0;"><button type="button" class="btn btn-outline" onclick="Ketidakhadiran.showRekap()" style="margin-top:20px;">Lihat Rekap Kehadiran</button></div>' : '') +
      '</div></div>' +
      (this.showingRekap ? this.renderRekapTable() : (allSelected && this.studentList.length > 0 ? this.renderInputArea() : this.renderPlaceholder()));

    if (!this.showingRekap && allSelected && this.studentList.length > 0) {
      this.updateTableInputs();
      this.updateTextareasFromValues();
    }
  },

  renderPlaceholder() {
    if (this.selectedTP && this.selectedKelas && this.studentList.length === 0) {
      return '<div class="card"><p class="muted">Tidak ada siswa di kelas ini. Tambahkan data akademik terlebih dahulu.</p></div>';
    }
    return '<div class="card"><p class="muted">Pilih Tahun Pelajaran, Kelas, dan Semester untuk mulai input ketidakhadiran.</p></div>';
  },

  renderInputArea() {
    const semLabel = this.selectedSemester === '1' ? 'Semester 1' : 'Semester 2';
    return '<div class="card" style="margin-bottom:16px;"><h3 class="section-title">Paste Batch - ' + escapeHTMLDash(semLabel) + '</h3><p class="muted" style="margin-bottom:12px;">Paste jumlah hari (satu angka per baris, ' + this.studentList.length + ' baris urut alfabet).</p><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;"><div class="form-group" style="margin-bottom:0;"><label>Paste Sakit</label><textarea id="paste-sakit-textarea" rows="6" style="width:100%;font-family:monospace;font-size:13px;padding:10px;border:1px solid var(--border-color);border-radius:8px;resize:vertical;" placeholder="2\n0\n1\n..."></textarea></div><div class="form-group" style="margin-bottom:0;"><label>Paste Izin</label><textarea id="paste-izin-textarea" rows="6" style="width:100%;font-family:monospace;font-size:13px;padding:10px;border:1px solid var(--border-color);border-radius:8px;resize:vertical;" placeholder="1\n0\n3\n..."></textarea></div><div class="form-group" style="margin-bottom:0;"><label>Paste Tanpa Keterangan</label><textarea id="paste-alpha-textarea" rows="6" style="width:100%;font-family:monospace;font-size:13px;padding:10px;border:1px solid var(--border-color);border-radius:8px;resize:vertical;" placeholder="0\n1\n0\n..."></textarea></div></div><button type="button" class="btn btn-outline" onclick="Ketidakhadiran.applyPaste()" style="margin-top:12px;">Terapkan dari Paste</button></div>' +
    '<div class="card"><h3 class="section-title">Data Ketidakhadiran - ' + escapeHTMLDash(this.selectedKelas) + ' (' + escapeHTMLDash(semLabel) + ')</h3><p class="muted" style="margin-bottom:12px;">' + this.studentList.length + ' siswa (urut alfabet). Edit langsung di kolom tabel.</p><div class="table-container"><table class="data-table"><thead><tr><th style="width:50px;">No</th><th style="min-width:150px;">Nama Siswa</th><th style="width:120px;">Sakit (Hari)</th><th style="width:120px;">Izin (Hari)</th><th style="width:150px;">Tanpa Keterangan (Hari)</th></tr></thead><tbody>' + this.studentList.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + escapeHTMLDash(s.nama) + '</td><td><input type="number" class="input-sm" id="hadir-sakit-' + i + '" min="0" value="0" onchange="Ketidakhadiran.onManualSakit(' + i + ', this.value)"></td><td><input type="number" class="input-sm" id="hadir-izin-' + i + '" min="0" value="0" onchange="Ketidakhadiran.onManualIzin(' + i + ', this.value)"></td><td><input type="number" class="input-sm" id="hadir-alpha-' + i + '" min="0" value="0" onchange="Ketidakhadiran.onManualAlpha(' + i + ', this.value)"></td></tr>').join('') + '</tbody></table></div><div class="form-actions" style="margin-top:16px;"><button type="button" class="btn btn-primary" onclick="Ketidakhadiran.saveAll()">Simpan Semua</button></div></div>';
  }
};
