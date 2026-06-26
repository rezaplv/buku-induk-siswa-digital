// Input Nilai Component - redesigned: paste kolom nilai per mapel per semester
const InputNilai = {
  allAkademik: [],
  students: [],
  selectedTP: '',
  selectedKelas: '',
  selectedSemester: '1',
  selectedMapel: '',
  studentList: [],
  nilaiValues: [],
  deskValues: [],
  mode: 'nilai', // 'nilai' or 'deskripsi'
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

  onTPChange(val) { this.selectedTP = val; this.selectedKelas = ''; this.selectedMapel = ''; this.studentList = []; this.nilaiValues = []; this.deskValues = []; this.showingRekap = false; this.render(); },
  onKelasChange(val) { this.selectedKelas = val; this.selectedMapel = ''; this.studentList = this.getStudentsInClass(); this.nilaiValues = []; this.deskValues = []; this.showingRekap = false; this.render(); },
  onSemesterChange(val) { this.selectedSemester = val; this.nilaiValues = []; this.deskValues = []; this.showingRekap = false; this.render(); if (this.selectedMapel) this.loadExistingNilai(); },
  onMapelChange(val) { this.selectedMapel = val; this.nilaiValues = []; this.deskValues = []; this.showingRekap = false; this.render(); if (val) this.loadExistingNilai(); },

  setMode(mode) {
    this.mode = mode;
    this.nilaiValues = [];
    this.deskValues = [];
    this.render();
    if (this.selectedMapel) this.loadExistingNilai();
  },

  async loadExistingNilai() {
    if (!this.selectedMapel || !this.selectedSemester || this.studentList.length === 0) return;
    if (this.mode === 'deskripsi') {
      const field = this.selectedSemester === '1' ? 'deskSem1' : 'deskSem2';
      const values = [];
      for (const student of this.studentList) {
        const nilaiArr = await DB.getNilaiByAkademik(student.id);
        const found = nilaiArr.find(n => n.mapel === this.selectedMapel);
        values.push(found && found[field] ? String(found[field]) : '');
      }
      this.deskValues = values;
      this.updateDeskInputs();
      this.updateDeskTextareaFromValues();
    } else {
      const field = this.selectedSemester === '1' ? 'nilaiSem1' : 'nilaiSem2';
      const values = [];
      for (const student of this.studentList) {
        const nilaiArr = await DB.getNilaiByAkademik(student.id);
        const found = nilaiArr.find(n => n.mapel === this.selectedMapel);
        values.push(found && found[field] != null ? String(found[field]) : '');
      }
      this.nilaiValues = values;
      this.updateTableInputs();
      this.updateTextareaFromValues();
    }
  },

  updateTableInputs() {
    for (let i = 0; i < this.studentList.length; i++) {
      const input = document.getElementById('nilai-input-' + i);
      if (input) input.value = this.nilaiValues[i] || '';
    }
  },

  updateTextareaFromValues() {
    const ta = document.getElementById('paste-nilai-textarea');
    if (ta) ta.value = this.nilaiValues.join('\n');
  },

  updateDeskInputs() {
    for (let i = 0; i < this.studentList.length; i++) {
      const ta = document.getElementById('desk-input-' + i);
      if (ta) ta.value = this.deskValues[i] || '';
    }
  },

  updateDeskTextareaFromValues() {
    const ta = document.getElementById('paste-desk-textarea');
    if (ta) ta.value = this.deskValues.join('\n');
  },

  getMapelShortNames() {
    return {
      'Pendidikan Agama dan Budi Pekerti': 'PAI',
      'Pendidikan Pancasila': 'PKn',
      'Bahasa Indonesia': 'B.ID',
      'Matematika': 'MTK',
      'IPA': 'IPA',
      'IPS': 'IPS',
      'Bahasa Inggris': 'B.Ing',
      'PJOK': 'PJOK',
      'Informatika': 'Info',
      'Seni Budaya dan Prakarya': 'SBP',
      'Bahasa Jawa': 'B.Jw'
    };
  },

  render() {
    const page = document.getElementById('page-input-nilai');
    const tpList = this.getTPList();
    const kelasList = this.getKelasList();
    this.studentList = this.getStudentsInClass();
    const allSelected = this.selectedTP && this.selectedKelas && this.selectedSemester && this.selectedMapel;
    const canShowRekap = this.selectedTP && this.selectedKelas && this.selectedSemester && this.studentList.length > 0;

    page.innerHTML = `
      <div class="page-header"><h2 class="page-title">Input Nilai</h2></div>
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
          <div class="form-group" style="margin-bottom:0;min-width:180px;">
            <label>Tahun Pelajaran</label>
            <select id="in-tp" onchange="InputNilai.onTPChange(this.value)">
              <option value="">-- Pilih TP --</option>
              ${tpList.map(tp => '<option value="' + escapeHTMLDash(tp) + '"' + (this.selectedTP === tp ? ' selected' : '') + '>' + escapeHTMLDash(tp) + '</option>').join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;min-width:180px;">
            <label>Kelas</label>
            <select id="in-kelas" onchange="InputNilai.onKelasChange(this.value)" ${!this.selectedTP ? 'disabled' : ''}>
              <option value="">-- Pilih Kelas --</option>
              ${kelasList.map(k => '<option value="' + escapeHTMLDash(k) + '"' + (this.selectedKelas === k ? ' selected' : '') + '>' + escapeHTMLDash(k) + '</option>').join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;min-width:150px;">
            <label>Semester</label>
            <select id="in-semester" onchange="InputNilai.onSemesterChange(this.value)" ${!this.selectedKelas ? 'disabled' : ''}>
              <option value="1" ${this.selectedSemester === '1' ? 'selected' : ''}>Semester 1</option>
              <option value="2" ${this.selectedSemester === '2' ? 'selected' : ''}>Semester 2</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;min-width:220px;flex:1;">
            <label>Mata Pelajaran</label>
            <select id="in-mapel" onchange="InputNilai.onMapelChange(this.value)" ${!this.selectedKelas ? 'disabled' : ''}>
              <option value="">-- Pilih Mapel --</option>
              ${MATA_PELAJARAN.map(mp => '<option value="' + escapeHTMLDash(mp) + '"' + (this.selectedMapel === mp ? ' selected' : '') + '>' + escapeHTMLDash(mp) + '</option>').join('')}
            </select>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:12px;">
          <label style="font-size:13px;font-weight:600;color:var(--text-secondary);">Mode:</label>
          <button class="btn btn-sm ${this.mode === 'nilai' ? 'btn-primary' : 'btn-outline'}" onclick="InputNilai.setMode('nilai')">Nilai Angka</button>
          <button class="btn btn-sm ${this.mode === 'deskripsi' ? 'btn-primary' : 'btn-outline'}" onclick="InputNilai.setMode('deskripsi')">Deskripsi Capaian</button>
        </div>
      </div>
      ${canShowRekap ? '<div style="margin-bottom:16px;"><button type="button" class="btn btn-outline" onclick="InputNilai.showRekap()" id="btn-rekap-kelas"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px;"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>Lihat Rekap Kelas</button></div>' : ''}
      ${this.showingRekap ? '<div id="rekap-kelas-container"></div>' : (allSelected && this.studentList.length > 0 ? (this.mode === 'deskripsi' ? this.renderDeskripsiArea() : this.renderInputArea()) : this.renderPlaceholder())}`;

    if (!this.showingRekap && allSelected && this.studentList.length > 0) {
      if (this.mode === 'deskripsi') {
        this.updateDeskInputs();
        this.updateDeskTextareaFromValues();
      } else {
        this.updateTableInputs();
        this.updateTextareaFromValues();
      }
    }

    if (this.showingRekap) {
      this.renderRekapTable();
    }
  },

  renderPlaceholder() {
    if (this.selectedTP && this.selectedKelas && this.studentList.length === 0) {
      return '<div class="card"><p class="muted">Tidak ada siswa di kelas ini. Tambahkan data akademik terlebih dahulu.</p></div>';
    }
    if (!this.selectedMapel && this.selectedKelas) {
      return '<div class="card"><p class="muted">Pilih Mata Pelajaran untuk mulai input nilai.</p></div>';
    }
    return '<div class="card"><p class="muted">Pilih Tahun Pelajaran, Kelas, Semester, dan Mata Pelajaran untuk mulai input nilai.</p></div>';
  },

  renderInputArea() {
    const semLabel = this.selectedSemester === '1' ? 'Semester 1' : 'Semester 2';
    return '<div class="card" style="margin-bottom:16px;"><h3 class="section-title">Paste Nilai - ' + escapeHTMLDash(this.selectedMapel) + ' (' + semLabel + ')</h3><p class="muted" style="margin-bottom:8px;">Copy satu kolom nilai dari Excel (' + this.studentList.length + ' baris, urut alfabet), lalu paste di bawah ini. Satu nilai per baris. Nilai desimal gunakan koma (83,5) atau titik (83.5).</p><textarea id="paste-nilai-textarea" rows="6" style="width:100%;font-family:monospace;font-size:14px;padding:10px;border:1px solid var(--border-color);border-radius:8px;resize:vertical;margin-bottom:12px;" placeholder="Paste ' + this.studentList.length + ' nilai di sini (satu per baris)..."></textarea><button type="button" class="btn btn-outline" onclick="InputNilai.applyPaste()" style="margin-bottom:16px;">Terapkan dari Paste</button></div><div class="card"><h3 class="section-title">Preview Nilai - ' + escapeHTMLDash(this.selectedMapel) + ' (' + semLabel + ')</h3><p class="muted" style="margin-bottom:12px;">' + this.studentList.length + ' siswa (urut alfabet). Edit manual juga bisa langsung di kolom Nilai.</p><div class="table-container"><table class="data-table"><thead><tr><th style="width:50px;">No</th><th>Nama Siswa</th><th style="width:100px;">NIS</th><th style="width:120px;">Nilai</th></tr></thead><tbody>' + this.studentList.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + escapeHTMLDash(s.nama) + '</td><td>' + escapeHTMLDash(s.nis) + '</td><td><input type="text" class="input-sm" id="nilai-input-' + i + '" value="" style="width:80px;text-align:center;" onchange="InputNilai.onManualInput(' + i + ', this.value)"></td></tr>').join('') + '</tbody></table></div><div class="form-actions" style="margin-top:16px;"><button type="button" class="btn btn-primary" onclick="InputNilai.saveAll()">Simpan Semua</button><button type="button" class="btn btn-outline" onclick="InputNilai.clearAll()" style="margin-left:8px;">Hapus Semua Nilai</button></div></div>';
  },

  renderDeskripsiArea() {
    const semLabel = this.selectedSemester === '1' ? 'Semester 1' : 'Semester 2';
    return '<div class="card" style="margin-bottom:16px;"><h3 class="section-title">Paste Deskripsi - ' + escapeHTMLDash(this.selectedMapel) + ' (' + semLabel + ')</h3><p class="muted" style="margin-bottom:8px;">Paste Deskripsi (satu per baris per siswa). Urut alfabet sesuai daftar siswa (' + this.studentList.length + ' baris).</p><textarea id="paste-desk-textarea" rows="6" style="width:100%;font-family:monospace;font-size:14px;padding:10px;border:1px solid var(--border-color);border-radius:8px;resize:vertical;margin-bottom:12px;" placeholder="Paste ' + this.studentList.length + ' deskripsi di sini (satu per baris)..."></textarea><button type="button" class="btn btn-outline" onclick="InputNilai.applyPasteDeskripsi()" style="margin-bottom:16px;">Terapkan dari Paste</button></div><div class="card"><h3 class="section-title">Deskripsi Capaian - ' + escapeHTMLDash(this.selectedMapel) + ' (' + semLabel + ')</h3><p class="muted" style="margin-bottom:12px;">' + this.studentList.length + ' siswa (urut alfabet). Edit langsung di kolom Deskripsi Capaian.</p><div class="table-container"><table class="data-table"><thead><tr><th style="width:50px;">No</th><th style="width:180px;">Nama Siswa</th><th>Deskripsi Capaian</th></tr></thead><tbody>' + this.studentList.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + escapeHTMLDash(s.nama) + '</td><td><textarea id="desk-input-' + i + '" rows="3" style="width:100%;font-size:13px;padding:8px;border:1px solid var(--border-color);border-radius:6px;resize:vertical;" onchange="InputNilai.onManualDeskInput(' + i + ', this.value)"></textarea></td></tr>').join('') + '</tbody></table></div><div class="form-actions" style="margin-top:16px;"><button type="button" class="btn btn-primary" onclick="InputNilai.saveAll()">Simpan Semua</button><button type="button" class="btn btn-outline" onclick="InputNilai.clearAllDesk()" style="margin-left:8px;">Hapus Semua Deskripsi</button></div></div>';
  },

  onManualInput(index, value) {
    this.nilaiValues[index] = value.trim();
  },

  applyPaste() {
    const ta = document.getElementById('paste-nilai-textarea');
    if (!ta) return;
    const lines = ta.value.split('\n').map(l => l.trim());
    for (let i = 0; i < this.studentList.length; i++) {
      const raw = (lines[i] || '').replace(',', '.');
      this.nilaiValues[i] = raw;
      const input = document.getElementById('nilai-input-' + i);
      if (input) input.value = raw;
    }
    if (lines.filter(l => l !== '').length < this.studentList.length && lines.filter(l => l !== '').length > 0) {
      alert('Perhatian: jumlah baris paste (' + lines.filter(l => l !== '').length + ') kurang dari jumlah siswa (' + this.studentList.length + '). Baris yang kosong tidak diisi.');
    }
  },

  onManualDeskInput(index, value) {
    this.deskValues[index] = value;
  },

  applyPasteDeskripsi() {
    const ta = document.getElementById('paste-desk-textarea');
    if (!ta) return;
    const lines = ta.value.split('\n');
    for (let i = 0; i < this.studentList.length; i++) {
      const raw = lines[i] !== undefined ? lines[i] : '';
      this.deskValues[i] = raw;
      const input = document.getElementById('desk-input-' + i);
      if (input) input.value = raw;
    }
    if (lines.filter(l => l !== '').length < this.studentList.length && lines.filter(l => l !== '').length > 0) {
      alert('Perhatian: jumlah baris paste (' + lines.filter(l => l !== '').length + ') kurang dari jumlah siswa (' + this.studentList.length + '). Baris yang kosong tidak diisi.');
    }
  },

  clearAllDesk() {
    if (!confirm('Hapus semua deskripsi di tabel?')) return;
    this.deskValues = this.studentList.map(() => '');
    this.updateDeskInputs();
    const ta = document.getElementById('paste-desk-textarea');
    if (ta) ta.value = '';
  },

  clearAll() {
    if (!confirm('Hapus semua nilai di tabel?')) return;
    this.nilaiValues = this.studentList.map(() => '');
    this.updateTableInputs();
    const ta = document.getElementById('paste-nilai-textarea');
    if (ta) ta.value = '';
    // Remove saved indicators
    for (let i = 0; i < this.studentList.length; i++) {
      const input = document.getElementById('nilai-input-' + i);
      if (input) input.style.background = '';
    }
  },

  parseNilai(raw) {
    if (!raw || raw === '') return null;
    const normalized = raw.replace(',', '.');
    const val = parseFloat(normalized);
    if (isNaN(val)) return null;
    return val;
  },

  markSavedIndicators() {
    for (let i = 0; i < this.studentList.length; i++) {
      const input = document.getElementById('nilai-input-' + i);
      if (input && this.nilaiValues[i] !== '') {
        input.style.background = 'var(--emerald-light)';
      }
    }
  },

  async saveAll() {
    if (!this.selectedMapel || !this.selectedSemester || this.studentList.length === 0) return;
    if (this.mode === 'deskripsi') {
      // Collect current textarea values from DOM
      for (let i = 0; i < this.studentList.length; i++) {
        const ta = document.getElementById('desk-input-' + i);
        if (ta) this.deskValues[i] = ta.value;
      }
      const field = this.selectedSemester === '1' ? 'deskSem1' : 'deskSem2';
      let savedCount = 0;
      for (let i = 0; i < this.studentList.length; i++) {
        const student = this.studentList[i];
        const deskVal = this.deskValues[i] || '';
        const nilaiArr = await DB.getNilaiByAkademik(student.id);
        const existing = nilaiArr.find(n => n.mapel === this.selectedMapel);
        if (existing) {
          const updated = { ...existing };
          updated[field] = deskVal;
          await DB.updateNilai(updated);
        } else {
          const newRecord = { akademikId: student.id, mapel: this.selectedMapel, nilaiSem1: null, nilaiSem2: null, deskSem1: '', deskSem2: '' };
          newRecord[field] = deskVal;
          await DB.addNilai(newRecord);
        }
        savedCount++;
      }
      alert('Berhasil menyimpan deskripsi ' + this.selectedMapel + ' (Semester ' + this.selectedSemester + ') untuk ' + savedCount + ' siswa!');
      await this.loadExistingNilai();
    } else {
      // Collect current input values from DOM
      for (let i = 0; i < this.studentList.length; i++) {
        const input = document.getElementById('nilai-input-' + i);
        if (input) this.nilaiValues[i] = input.value.trim();
      }
      // Validate
      for (let i = 0; i < this.studentList.length; i++) {
        const raw = this.nilaiValues[i] || '';
        if (raw === '') continue;
        const val = this.parseNilai(raw);
        if (val === null || val < 0 || val > 100) {
          alert('Nilai baris ' + (i + 1) + ' (' + this.studentList[i].nama + ') tidak valid: "' + raw + '". Harus angka 0-100.');
          return;
        }
      }
      const field = this.selectedSemester === '1' ? 'nilaiSem1' : 'nilaiSem2';
      let savedCount = 0;
      for (let i = 0; i < this.studentList.length; i++) {
        const student = this.studentList[i];
        const raw = this.nilaiValues[i] || '';
        const parsedVal = this.parseNilai(raw);
        const nilaiArr = await DB.getNilaiByAkademik(student.id);
        const existing = nilaiArr.find(n => n.mapel === this.selectedMapel);
        if (existing) {
          const updated = { ...existing };
          updated[field] = parsedVal;
          await DB.updateNilai(updated);
        } else {
          const newRecord = { akademikId: student.id, mapel: this.selectedMapel, nilaiSem1: null, nilaiSem2: null, deskSem1: '', deskSem2: '' };
          newRecord[field] = parsedVal;
          await DB.addNilai(newRecord);
        }
        savedCount++;
      }
      alert('Berhasil menyimpan nilai ' + this.selectedMapel + ' (Semester ' + this.selectedSemester + ') untuk ' + savedCount + ' siswa!');
      await this.loadExistingNilai();
      // Mark saved indicators with green background
      this.markSavedIndicators();
    }
  },

  async showRekap() {
    this.showingRekap = true;
    this.render();
  },

  hideRekap() {
    this.showingRekap = false;
    this.render();
  },

  async renderRekapTable() {
    const container = document.getElementById('rekap-kelas-container');
    if (!container) return;
    const shortNames = this.getMapelShortNames();
    const semLabel = this.selectedSemester === '1' ? 'Semester 1' : 'Semester 2';
    const field = this.selectedSemester === '1' ? 'nilaiSem1' : 'nilaiSem2';

    // Load all nilai for all students in the class
    const rekapData = [];
    for (const student of this.studentList) {
      const nilaiArr = await DB.getNilaiByAkademik(student.id);
      const nilaiMap = {};
      nilaiArr.forEach(n => { nilaiMap[n.mapel] = n; });
      rekapData.push({ student, nilaiMap });
    }

    // Build header
    let headerCols = '<th style="width:40px;position:sticky;left:0;background:var(--bg-primary);z-index:1;">No</th><th style="min-width:150px;position:sticky;left:40px;background:var(--bg-primary);z-index:1;">Nama Siswa</th><th style="width:80px;">NIS</th>';
    MATA_PELAJARAN.forEach(mp => {
      const short = shortNames[mp] || mp.substring(0, 4);
      headerCols += '<th style="width:50px;text-align:center;font-size:11px;">' + escapeHTMLDash(short) + '</th>';
    });

    // Build rows
    let rows = '';
    rekapData.forEach((item, idx) => {
      let cols = '<td style="position:sticky;left:0;background:#fff;z-index:1;">' + (idx + 1) + '</td>';
      cols += '<td style="position:sticky;left:40px;background:#fff;z-index:1;white-space:nowrap;">' + escapeHTMLDash(item.student.nama) + '</td>';
      cols += '<td>' + escapeHTMLDash(item.student.nis) + '</td>';
      MATA_PELAJARAN.forEach(mp => {
        const n = item.nilaiMap[mp];
        const val = n && n[field] != null ? String(n[field]) : '-';
        cols += '<td style="text-align:center;">' + escapeHTMLDash(val) + '</td>';
      });
      rows += '<tr>' + cols + '</tr>';
    });

    container.innerHTML = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h3 class="section-title" style="margin-bottom:0;">Rekap Nilai Kelas ' + escapeHTMLDash(this.selectedKelas) + ' - ' + semLabel + '</h3><button type="button" class="btn btn-outline" onclick="InputNilai.hideRekap()">Tutup Rekap</button></div><p class="muted" style="margin-bottom:12px;">Rekap semua mata pelajaran untuk ' + this.studentList.length + ' siswa. Scroll horizontal jika kolom tidak muat.</p><div style="overflow-x:auto;"><table class="data-table" style="min-width:900px;font-size:13px;"><thead><tr>' + headerCols + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
};
