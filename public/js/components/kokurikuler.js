// Kokurikuler P5 Component - Input catatan Proyek Penguatan Profil Pelajar Pancasila per siswa per semester
const Kokurikuler = {
  allAkademik: [],
  students: [],
  selectedTP: '',
  selectedKelas: '',
  selectedSemester: '1',
  studentList: [],
  catatanValues: [],
  showingRekap: false,
  rekapSelectedNIS: '',

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
    this.catatanValues = [];
    this.showingRekap = false;
    this.rekapSelectedNIS = '';
    this.render();
  },

  onKelasChange(val) {
    this.selectedKelas = val;
    this.studentList = this.getStudentsInClass();
    this.catatanValues = this.studentList.map(() => '');
    this.showingRekap = false;
    this.rekapSelectedNIS = '';
    this.render();
    if (this.studentList.length > 0) this.loadExisting();
  },

  onSemesterChange(val) {
    this.selectedSemester = val;
    this.catatanValues = this.studentList.map(() => '');
    this.showingRekap = false;
    this.rekapSelectedNIS = '';
    this.render();
    if (this.studentList.length > 0) this.loadExisting();
  },

  async loadExisting() {
    if (!this.selectedTP || !this.selectedKelas || this.studentList.length === 0) return;
    const field = this.selectedSemester === '1' ? 'catatanSem1' : 'catatanSem2';

    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const p5Arr = await DB.getP5ByAkademik(student.id);
      const p5 = p5Arr.length > 0 ? p5Arr[0] : null;
      this.catatanValues[i] = p5 ? (p5[field] || '') : '';
    }
    this.updateTableInputs();
    this.updateTextareaFromValues();
  },

  updateTableInputs() {
    for (let i = 0; i < this.studentList.length; i++) {
      const ta = document.getElementById('p5-catatan-' + i);
      if (ta) ta.value = this.catatanValues[i] || '';
    }
  },

  updateTextareaFromValues() {
    const ta = document.getElementById('paste-p5-textarea');
    if (ta) ta.value = this.catatanValues.map(v => (v || '').replace(/\n/g, ';')).join('\n');
  },

  applyPaste() {
    const ta = document.getElementById('paste-p5-textarea');
    if (!ta) return;

    const lines = ta.value.split('\n');

    for (let i = 0; i < this.studentList.length; i++) {
      this.catatanValues[i] = (lines[i] || '').trim().replace(/;/g, '\n');
    }
    this.updateTableInputs();

    const filled = lines.filter(l => l.trim() !== '').length;
    if (filled > 0 && filled < this.studentList.length) {
      alert('Perhatian: jumlah baris paste (' + filled + ') kurang dari jumlah siswa (' + this.studentList.length + '). Baris kosong tidak diisi.');
    }
  },

  onManualCatatan(index, value) {
    this.catatanValues[index] = value;
  },

  htmlToCleanText(html) {
    const BREAK = '\u0001';
    let s = html;
    // Strip everything before <body> if present (Word includes lots of header markup)
    const bodyMatch = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) s = bodyMatch[1];
    // Mark real line breaks
    s = s.replace(/<br\s*\/?>/gi, BREAK);
    s = s.replace(/<\/p\s*>/gi, BREAK);
    s = s.replace(/<\/div\s*>/gi, BREAK);
    s = s.replace(/<\/tr\s*>/gi, BREAK);
    // Remove all remaining tags
    s = s.replace(/<[^>]+>/g, '');
    // Decode HTML entities
    s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#xa0;/gi, ' ').replace(/&#160;/g, ' ');
    // Collapse all whitespace (incl. source newlines) into single spaces
    s = s.replace(/\s+/g, ' ');
    // Restore real breaks, trim each line, drop empty lines
    s = s.split(BREAK).map(function(line) { return line.trim(); }).filter(function(line) { return line !== ''; }).join('\n');
    return s.trim();
  },

  onP5Paste(event, index) {
    const clip = (event.clipboardData || window.clipboardData);
    if (!clip) return;
    const html = clip.getData('text/html');
    if (html && html.trim() !== '') {
      const clean = this.htmlToCleanText(html);
      if (clean) {
        event.preventDefault();
        this.catatanValues[index] = clean;
        const ta = document.getElementById('p5-catatan-' + index);
        if (ta) ta.value = clean;
        return;
      }
    }
    // No HTML clipboard — let browser handle plain text normally
  },

  async saveAll() {
    if (!this.selectedTP || !this.selectedKelas || this.studentList.length === 0) return;

    for (let i = 0; i < this.studentList.length; i++) {
      const ta = document.getElementById('p5-catatan-' + i);
      if (ta) this.catatanValues[i] = ta.value.trim();
    }

    const field = this.selectedSemester === '1' ? 'catatanSem1' : 'catatanSem2';
    let savedCount = 0;

    for (let i = 0; i < this.studentList.length; i++) {
      const student = this.studentList[i];
      const p5Arr = await DB.getP5ByAkademik(student.id);
      const existing = p5Arr.length > 0 ? p5Arr[0] : null;

      if (existing) {
        const updated = { ...existing };
        updated[field] = this.catatanValues[i] || '';
        await DB.updateP5(updated);
      } else {
        const newRecord = {
          akademikId: student.id,
          catatanSem1: '',
          catatanSem2: ''
        };
        newRecord[field] = this.catatanValues[i] || '';
        await DB.addP5(newRecord);
      }
      savedCount++;
    }

    alert('Berhasil menyimpan catatan P5 Semester ' + this.selectedSemester + ' untuk ' + savedCount + ' siswa!');
    await this.loadExisting();
    this.markSavedIndicators();
  },

  markSavedIndicators() {
    for (let i = 0; i < this.studentList.length; i++) {
      const ta = document.getElementById('p5-catatan-' + i);
      if (ta && ta.value.trim() !== '') {
        ta.style.backgroundColor = 'var(--emerald-light)';
      }
    }
  },

  showRekap() {
    this.showingRekap = true;
    this.rekapSelectedNIS = '';
    this.render();
  },

  hideRekap() {
    this.showingRekap = false;
    this.rekapSelectedNIS = '';
    this.render();
    if (this.studentList.length > 0) this.loadExisting();
  },

  async onRekapStudentChange(nis) {
    this.rekapSelectedNIS = nis;
    const rekapContent = document.getElementById('p5-rekap-content');
    if (!rekapContent || !nis) {
      if (rekapContent) rekapContent.innerHTML = '<p class="muted">Pilih siswa untuk melihat rekap.</p>';
      return;
    }

    const student = this.studentList.find(s => s.nis === nis);
    if (!student) { rekapContent.innerHTML = '<p class="muted">Siswa tidak ditemukan.</p>'; return; }

    const p5Arr = await DB.getP5ByAkademik(student.id);
    const p5 = p5Arr.length > 0 ? p5Arr[0] : null;
    const sem1 = p5 && p5.catatanSem1 ? p5.catatanSem1 : '-';
    const sem2 = p5 && p5.catatanSem2 ? p5.catatanSem2 : '-';

    rekapContent.innerHTML = '<div style="margin-bottom:16px;"><h4 style="font-size:14px;font-weight:600;color:var(--navy);margin-bottom:8px;">Catatan P5 Semester 1</h4><div style="background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:12px;white-space:pre-wrap;font-size:13px;">' + escapeHTMLDash(sem1) + '</div></div>' +
      '<div><h4 style="font-size:14px;font-weight:600;color:var(--navy);margin-bottom:8px;">Catatan P5 Semester 2</h4><div style="background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:12px;white-space:pre-wrap;font-size:13px;">' + escapeHTMLDash(sem2) + '</div></div>';
  },

  renderRekapSection() {
    return '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><h3 class="section-title" style="margin-bottom:0;">Rekap P5 - ' + escapeHTMLDash(this.selectedKelas) + '</h3><button type="button" class="btn btn-outline" onclick="Kokurikuler.hideRekap()">Tutup Rekap</button></div>' +
      '<div class="form-group" style="margin-bottom:16px;max-width:300px;"><label>Pilih Siswa</label><select id="p5-rekap-student" onchange="Kokurikuler.onRekapStudentChange(this.value)"><option value="">-- Pilih Siswa --</option>' +
      this.studentList.map(s => '<option value="' + escapeHTMLDash(s.nis) + '"' + (this.rekapSelectedNIS === s.nis ? ' selected' : '') + '>' + escapeHTMLDash(s.nama) + '</option>').join('') +
      '</select></div><div id="p5-rekap-content"><p class="muted">Pilih siswa untuk melihat rekap.</p></div></div>';
  },

  render() {
    const page = document.getElementById('page-kokurikuler');
    const tpList = this.getTPList();
    const kelasList = this.getKelasList();
    this.studentList = this.getStudentsInClass();
    const allSelected = this.selectedTP && this.selectedKelas && this.selectedSemester;
    const showRekapBtn = this.selectedTP && this.selectedKelas && !this.showingRekap;

    page.innerHTML = '<div class="page-header"><h2 class="page-title">Kokurikuler P5</h2></div>' +
      '<div class="card" style="margin-bottom:16px;"><div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">' +
      '<div class="form-group" style="margin-bottom:0;min-width:180px;"><label>Tahun Pelajaran</label><select id="p5-tp" onchange="Kokurikuler.onTPChange(this.value)"><option value="">-- Pilih TP --</option>' + tpList.map(tp => '<option value="' + escapeHTMLDash(tp) + '"' + (this.selectedTP === tp ? ' selected' : '') + '>' + escapeHTMLDash(tp) + '</option>').join('') + '</select></div>' +
      '<div class="form-group" style="margin-bottom:0;min-width:180px;"><label>Kelas</label><select id="p5-kelas" onchange="Kokurikuler.onKelasChange(this.value)" ' + (!this.selectedTP ? 'disabled' : '') + '><option value="">-- Pilih Kelas --</option>' + kelasList.map(k => '<option value="' + escapeHTMLDash(k) + '"' + (this.selectedKelas === k ? ' selected' : '') + '>' + escapeHTMLDash(k) + '</option>').join('') + '</select></div>' +
      '<div class="form-group" style="margin-bottom:0;min-width:150px;"><label>Semester</label><select id="p5-semester" onchange="Kokurikuler.onSemesterChange(this.value)" ' + (!this.selectedKelas ? 'disabled' : '') + '><option value="1" ' + (this.selectedSemester === '1' ? 'selected' : '') + '>Semester 1</option><option value="2" ' + (this.selectedSemester === '2' ? 'selected' : '') + '>Semester 2</option></select></div>' +
      (showRekapBtn ? '<div style="margin-bottom:0;"><button type="button" class="btn btn-outline" onclick="Kokurikuler.showRekap()" style="margin-top:20px;">Lihat Rekap P5</button></div>' : '') +
      '</div></div>' +
      (this.showingRekap ? this.renderRekapSection() : (allSelected && this.studentList.length > 0 ? this.renderInputArea() : this.renderPlaceholder()));

    if (!this.showingRekap && allSelected && this.studentList.length > 0) {
      this.updateTableInputs();
      this.updateTextareaFromValues();
    }
  },

  renderPlaceholder() {
    if (this.selectedTP && this.selectedKelas && this.studentList.length === 0) {
      return '<div class="card"><p class="muted">Tidak ada siswa di kelas ini. Tambahkan data akademik terlebih dahulu.</p></div>';
    }
    return '<div class="card"><p class="muted">Pilih Tahun Pelajaran, Kelas, dan Semester untuk mulai input catatan Proyek P5.</p></div>';
  },

  renderInputArea() {
    const semLabel = this.selectedSemester === '1' ? 'Semester 1' : 'Semester 2';
    return '<div class="card" style="margin-bottom:16px;"><h3 class="section-title">Paste Catatan P5 - ' + escapeHTMLDash(semLabel) + '</h3><p class="muted" style="margin-bottom:12px;">Paste catatan P5 (satu per baris per siswa, ' + this.studentList.length + ' baris urut alfabet). Gunakan titik koma (;) jika catatan panjang butuh multi-kalimat.</p>' +
      '<div class="form-group" style="margin-bottom:0;"><textarea id="paste-p5-textarea" rows="6" style="width:100%;font-family:monospace;font-size:13px;padding:10px;border:1px solid var(--border-color);border-radius:8px;resize:vertical;" placeholder="Catatan siswa 1;lanjutan catatan\nCatatan siswa 2\nCatatan siswa 3\n..."></textarea></div>' +
      '<button type="button" class="btn btn-outline" onclick="Kokurikuler.applyPaste()" style="margin-top:12px;">Terapkan dari Paste</button></div>' +
      '<div class="card"><h3 class="section-title">Data Catatan P5 - ' + escapeHTMLDash(this.selectedKelas) + ' (' + escapeHTMLDash(semLabel) + ')</h3><p class="muted" style="margin-bottom:12px;">' + this.studentList.length + ' siswa (urut alfabet). Edit langsung di kolom textarea.</p><div class="table-container"><table class="data-table"><thead><tr><th style="width:50px;">No</th><th style="min-width:150px;">Nama Siswa</th><th style="min-width:300px;">Catatan Proyek P5</th></tr></thead><tbody>' +
      this.studentList.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + escapeHTMLDash(s.nama) + '</td><td><textarea class="input-md" id="p5-catatan-' + i + '" rows="4" style="resize:vertical;min-height:80px;" onchange="Kokurikuler.onManualCatatan(' + i + ', this.value)" onpaste="Kokurikuler.onP5Paste(event, ' + i + ')" placeholder="Catatan proyek P5"></textarea></td></tr>').join('') +
      '</tbody></table></div><div class="form-actions" style="margin-top:16px;"><button type="button" class="btn btn-primary" onclick="Kokurikuler.saveAll()">Simpan Semua</button></div></div>';
  }
};
