// Ekstrakurikuler Component - Input kegiatan ekstrakurikuler per siswa per semester
const Ekstrakurikuler = {
  allAkademik: [],
  students: [],
  selectedTP: '',
  selectedKelas: '',
  selectedSemester: '1',
  studentList: [],
  kegiatanValues: [],
  keteranganValues: [],
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
    this.kegiatanValues = [];
    this.keteranganValues = [];
    this.showingRekap = false;
    this.render();
  },

  onKelasChange(val) {
    this.selectedKelas = val;
    this.studentList = this.getStudentsInClass();
    this.kegiatanValues = this.studentList.map(() => '');
    this.keteranganValues = this.studentList.map(() => '');
    this.showingRekap = false;
    this.render();
    if (this.studentList.length > 0) this.loadExisting();
  },

  onSemesterChange(val) {
    this.selectedSemester = val;
    this.kegiatanValues = this.studentList.map(() => '');
    this.keteranganValues = this.studentList.map(() => '');
    this.showingRekap = false;
    this.render();
    if (this.studentList.length > 0) this.loadExisting();
  },

  async loadExisting() {
    if (!this.selectedTP || !this.selectedKelas || this.studentList.length === 0) return;
    const kegField = this.selectedSemester === '1' ? 'ekskulKegiatan1' : 'ekskulKegiatan2';
    const ketField = this.selectedSemester === '1' ? 'ekskulKet1' : 'ekskulKet2';

    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const nonAkademikArr = await DB.getNonAkademikByAkademik(student.id);
      const na = nonAkademikArr.length > 0 ? nonAkademikArr[0] : null;
      this.kegiatanValues[i] = na ? (na[kegField] || '') : '';
      this.keteranganValues[i] = na ? (na[ketField] || '') : '';
    }
    this.updateTableInputs();
    this.updateTextareasFromValues();
  },

  updateTableInputs() {
    for (let i = 0; i < this.studentList.length; i++) {
      const kegInput = document.getElementById('ekskul-kegiatan-' + i);
      const ketInput = document.getElementById('ekskul-ket-' + i);
      if (kegInput) kegInput.value = this.kegiatanValues[i] || '';
      if (ketInput) ketInput.value = this.keteranganValues[i] || '';
    }
  },

  updateTextareasFromValues() {
    const taKeg = document.getElementById('paste-kegiatan-textarea');
    const taKet = document.getElementById('paste-keterangan-textarea');
    if (taKeg) taKeg.value = this.kegiatanValues.join('\n');
    if (taKet) taKet.value = this.keteranganValues.join('\n');
  },

  applyPaste() {
    const taKeg = document.getElementById('paste-kegiatan-textarea');
    const taKet = document.getElementById('paste-keterangan-textarea');
    if (!taKeg || !taKet) return;

    const kegLines = taKeg.value.split('\n');
    const ketLines = taKet.value.split('\n');

    for (let i = 0; i < this.studentList.length; i++) {
      this.kegiatanValues[i] = (kegLines[i] || '').trim();
      this.keteranganValues[i] = (ketLines[i] || '').trim();
    }
    this.updateTableInputs();

    const filledKeg = kegLines.filter(l => l.trim() !== '').length;
    if (filledKeg > 0 && filledKeg < this.studentList.length) {
      alert('Perhatian: jumlah baris paste kegiatan (' + filledKeg + ') kurang dari jumlah siswa (' + this.studentList.length + '). Baris kosong tidak diisi.');
    }
  },

  onManualKegiatan(index, value) {
    this.kegiatanValues[index] = value;
  },

  onManualKeterangan(index, value) {
    this.keteranganValues[index] = value;
  },

  async saveAll() {
    if (!this.selectedTP || !this.selectedKelas || this.studentList.length === 0) return;

    for (let i = 0; i < this.studentList.length; i++) {
      const kegInput = document.getElementById('ekskul-kegiatan-' + i);
      const ketInput = document.getElementById('ekskul-ket-' + i);
      if (kegInput) this.kegiatanValues[i] = kegInput.value.trim();
      if (ketInput) this.keteranganValues[i] = ketInput.value.trim();
    }

    const kegField = this.selectedSemester === '1' ? 'ekskulKegiatan1' : 'ekskulKegiatan2';
    const ketField = this.selectedSemester === '1' ? 'ekskulKet1' : 'ekskulKet2';
    let savedCount = 0;

    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const nonAkademikArr = await DB.getNonAkademikByAkademik(student.id);
      const existing = nonAkademikArr.length > 0 ? nonAkademikArr[0] : null;

      if (existing) {
        const updated = { ...existing };
        updated[kegField] = this.kegiatanValues[i] || '';
        updated[ketField] = this.keteranganValues[i] || '';
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
        newRecord[kegField] = this.kegiatanValues[i] || '';
        newRecord[ketField] = this.keteranganValues[i] || '';
        await DB.addNonAkademik(newRecord);
      }
      savedCount++;
    }

    alert('Berhasil menyimpan data ekstrakurikuler Semester ' + this.selectedSemester + ' untuk ' + savedCount + ' siswa!');
    await this.loadExisting();
    this.markSavedIndicators();
  },

  markSavedIndicators() {
    for (let i = 0; i < this.studentList.length; i++) {
      const kegInput = document.getElementById('ekskul-kegiatan-' + i);
      const ketInput = document.getElementById('ekskul-ket-' + i);
      if (kegInput && kegInput.value.trim() !== '') {
        kegInput.style.backgroundColor = 'var(--emerald-light)';
      }
      if (ketInput && ketInput.value.trim() !== '') {
        ketInput.style.backgroundColor = 'var(--emerald-light)';
      }
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
    const rekapBody = document.getElementById('ekskul-rekap-tbody');
    if (!rekapBody) return;

    let rows = '';
    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const nonAkademikArr = await DB.getNonAkademikByAkademik(student.id);
      const na = nonAkademikArr.length > 0 ? nonAkademikArr[0] : null;
      const keg1 = na && na.ekskulKegiatan1 ? na.ekskulKegiatan1 : '-';
      const ket1 = na && na.ekskulKet1 ? na.ekskulKet1 : '-';
      const keg2 = na && na.ekskulKegiatan2 ? na.ekskulKegiatan2 : '-';
      const ket2 = na && na.ekskulKet2 ? na.ekskulKet2 : '-';
      rows += '<tr><td>' + (i + 1) + '</td><td>' + escapeHTMLDash(student.nama) + '</td><td>' + escapeHTMLDash(keg1) + '</td><td>' + escapeHTMLDash(ket1) + '</td><td>' + escapeHTMLDash(keg2) + '</td><td>' + escapeHTMLDash(ket2) + '</td></tr>';
    }
    rekapBody.innerHTML = rows;
  },

  renderRekapTable() {
    return '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><h3 class="section-title" style="margin-bottom:0;">Rekap Ekstrakurikuler - ' + escapeHTMLDash(this.selectedKelas) + '</h3><button type="button" class="btn btn-outline" onclick="Ekstrakurikuler.hideRekap()">Tutup Rekap</button></div><p class="muted" style="margin-bottom:12px;">' + this.studentList.length + ' siswa (urut alfabet). Data kedua semester ditampilkan.</p><div class="table-container"><table class="data-table"><thead><tr><th style="width:50px;">No</th><th style="min-width:150px;">Nama Siswa</th><th style="min-width:150px;">Ekskul Sem 1</th><th style="min-width:150px;">Keterangan Sem 1</th><th style="min-width:150px;">Ekskul Sem 2</th><th style="min-width:150px;">Keterangan Sem 2</th></tr></thead><tbody id="ekskul-rekap-tbody"><tr><td colspan="6" class="empty-state">Memuat data...</td></tr></tbody></table></div></div>';
  },

  render() {
    const page = document.getElementById('page-ekstrakurikuler');
    const tpList = this.getTPList();
    const kelasList = this.getKelasList();
    this.studentList = this.getStudentsInClass();
    const allSelected = this.selectedTP && this.selectedKelas && this.selectedSemester;
    const showRekapBtn = this.selectedTP && this.selectedKelas && !this.showingRekap;

    page.innerHTML = '<div class="page-header"><h2 class="page-title">Ekstrakurikuler</h2></div>' +
      '<div class="card" style="margin-bottom:16px;"><div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">' +
      '<div class="form-group" style="margin-bottom:0;min-width:180px;"><label>Tahun Pelajaran</label><select id="ekskul-tp" onchange="Ekstrakurikuler.onTPChange(this.value)"><option value="">-- Pilih TP --</option>' + tpList.map(tp => '<option value="' + escapeHTMLDash(tp) + '"' + (this.selectedTP === tp ? ' selected' : '') + '>' + escapeHTMLDash(tp) + '</option>').join('') + '</select></div>' +
      '<div class="form-group" style="margin-bottom:0;min-width:180px;"><label>Kelas</label><select id="ekskul-kelas" onchange="Ekstrakurikuler.onKelasChange(this.value)" ' + (!this.selectedTP ? 'disabled' : '') + '><option value="">-- Pilih Kelas --</option>' + kelasList.map(k => '<option value="' + escapeHTMLDash(k) + '"' + (this.selectedKelas === k ? ' selected' : '') + '>' + escapeHTMLDash(k) + '</option>').join('') + '</select></div>' +
      '<div class="form-group" style="margin-bottom:0;min-width:150px;"><label>Semester</label><select id="ekskul-semester" onchange="Ekstrakurikuler.onSemesterChange(this.value)" ' + (!this.selectedKelas ? 'disabled' : '') + '><option value="1" ' + (this.selectedSemester === '1' ? 'selected' : '') + '>Semester 1</option><option value="2" ' + (this.selectedSemester === '2' ? 'selected' : '') + '>Semester 2</option></select></div>' +
      (showRekapBtn ? '<div style="margin-bottom:0;"><button type="button" class="btn btn-outline" onclick="Ekstrakurikuler.showRekap()" style="margin-top:20px;">Lihat Rekap Ekskul</button></div>' : '') +
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
    return '<div class="card"><p class="muted">Pilih Tahun Pelajaran, Kelas, dan Semester untuk mulai input ekstrakurikuler.</p></div>';
  },

  renderInputArea() {
    const semLabel = this.selectedSemester === '1' ? 'Semester 1' : 'Semester 2';
    return '<div class="card" style="margin-bottom:16px;"><h3 class="section-title">Paste Batch - ' + escapeHTMLDash(semLabel) + '</h3><p class="muted" style="margin-bottom:12px;">Paste daftar kegiatan dan keterangan (satu baris per siswa, ' + this.studentList.length + ' baris urut alfabet). Jika siswa punya lebih dari 1 ekskul, pisahkan dengan koma.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;"><div class="form-group" style="margin-bottom:0;"><label>Paste Kegiatan</label><textarea id="paste-kegiatan-textarea" rows="6" style="width:100%;font-family:monospace;font-size:13px;padding:10px;border:1px solid var(--border-color);border-radius:8px;resize:vertical;" placeholder="Pramuka, Volly\nPMR\nPaskibra, Futsal\n..."></textarea></div><div class="form-group" style="margin-bottom:0;"><label>Paste Keterangan</label><textarea id="paste-keterangan-textarea" rows="6" style="width:100%;font-family:monospace;font-size:13px;padding:10px;border:1px solid var(--border-color);border-radius:8px;resize:vertical;" placeholder="Mampu baris-berbaris, Teknik dasar voli\nTerampil P3K\nDisiplin gerak, Teknik passing\n..."></textarea></div></div><button type="button" class="btn btn-outline" onclick="Ekstrakurikuler.applyPaste()" style="margin-top:12px;">Terapkan dari Paste</button></div>' +
    '<div class="card"><h3 class="section-title">Data Ekstrakurikuler - ' + escapeHTMLDash(this.selectedKelas) + ' (' + escapeHTMLDash(semLabel) + ')</h3><p class="muted" style="margin-bottom:12px;">' + this.studentList.length + ' siswa (urut alfabet). Bisa juga edit langsung di kolom tabel.</p><div class="table-container"><table class="data-table"><thead><tr><th style="width:50px;">No</th><th style="min-width:150px;">Nama Siswa</th><th style="min-width:200px;">Kegiatan Ekstrakurikuler</th><th style="min-width:200px;">Keterangan</th></tr></thead><tbody>' + this.studentList.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + escapeHTMLDash(s.nama) + '</td><td><textarea class="input-md" id="ekskul-kegiatan-' + i + '" rows="2" style="resize:vertical;min-height:40px;" onchange="Ekstrakurikuler.onManualKegiatan(' + i + ', this.value)" placeholder="Pramuka, Volly"></textarea></td><td><textarea class="input-md" id="ekskul-ket-' + i + '" rows="2" style="resize:vertical;min-height:40px;" onchange="Ekstrakurikuler.onManualKeterangan(' + i + ', this.value)" placeholder="Keterangan per kegiatan"></textarea></td></tr>').join('') + '</tbody></table></div><div class="form-actions" style="margin-top:16px;"><button type="button" class="btn btn-primary" onclick="Ekstrakurikuler.saveAll()">Simpan Semua</button></div></div>';
  }
};
