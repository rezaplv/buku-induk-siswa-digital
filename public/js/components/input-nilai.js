// Input Nilai Component - handles Nilai, Ekskul, Absensi, P5 entry per class
const InputNilai = {
  allAkademik: [],
  students: [],
  selectedTP: '',
  selectedKelas: '',
  studentList: [],
  currentStudentIndex: -1,
  currentAkademik: null,
  activeTab: 'nilai',
  nilaiData: [],
  nonAkademikData: null,
  p5Data: null,

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
    return akademikInClass.map(a => {
      const siswa = this.students.find(s => s.nis === a.nis);
      return { ...a, nama: siswa ? siswa.nama : a.nis, nisn: siswa ? siswa.nisn : '' };
    }).sort((a, b) => a.nama.localeCompare(b.nama));
  },
  async selectStudent(index) {
    this.currentStudentIndex = index;
    const studentAkad = this.studentList[index];
    if (!studentAkad) return;
    this.currentAkademik = studentAkad;
    this.nilaiData = await DB.getNilaiByAkademik(studentAkad.id);
    const nonAkadArr = await DB.getNonAkademikByAkademik(studentAkad.id);
    this.nonAkademikData = nonAkadArr.length > 0 ? nonAkadArr[0] : null;
    const p5Arr = await DB.getP5ByAkademik(studentAkad.id);
    this.p5Data = p5Arr.length > 0 ? p5Arr[0] : null;
    this.renderStudentForm();
  },
  onTPChange(val) { this.selectedTP = val; this.selectedKelas = ''; this.currentStudentIndex = -1; this.currentAkademik = null; this.render(); },
  onKelasChange(val) { this.selectedKelas = val; this.currentStudentIndex = -1; this.currentAkademik = null; this.studentList = this.getStudentsInClass(); this.render(); },
  setTab(tab) { this.activeTab = tab; this.renderStudentForm(); },

  render() {
    const page = document.getElementById('page-input-nilai');
    const tpList = this.getTPList();
    const kelasList = this.getKelasList();
    this.studentList = this.getStudentsInClass();

    page.innerHTML = `
      <div class="page-header"><h2 class="page-title">Input Nilai</h2></div>
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
          <div class="form-group" style="margin-bottom:0;min-width:200px;">
            <label>Tahun Pelajaran</label>
            <select id="in-tp" onchange="InputNilai.onTPChange(this.value)">
              <option value="">-- Pilih TP --</option>
              ${tpList.map(tp => '<option value="' + escapeHTMLDash(tp) + '"' + (this.selectedTP === tp ? ' selected' : '') + '>' + escapeHTMLDash(tp) + '</option>').join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;min-width:200px;">
            <label>Kelas</label>
            <select id="in-kelas" onchange="InputNilai.onKelasChange(this.value)" ${!this.selectedTP ? 'disabled' : ''}>
              <option value="">-- Pilih Kelas --</option>
              ${kelasList.map(k => '<option value="' + escapeHTMLDash(k) + '"' + (this.selectedKelas === k ? ' selected' : '') + '>' + escapeHTMLDash(k) + '</option>').join('')}
            </select>
          </div>
        </div>
      </div>
      ${this.selectedTP && this.selectedKelas ? this.renderStudentList() : '<div class="card"><p class="muted">Pilih Tahun Pelajaran dan Kelas untuk menampilkan daftar siswa.</p></div>'}
      <div id="in-student-form-area"></div>`;

    if (this.currentStudentIndex >= 0) this.renderStudentForm();
  },

  renderStudentList() {
    if (this.studentList.length === 0) return '<div class="card"><p class="muted">Tidak ada siswa di kelas ini.</p></div>';
    return `<div class="card"><div class="card-header"><h3>Daftar Siswa - ${escapeHTMLDash(this.selectedKelas)} (${this.studentList.length} siswa)</h3></div>
      <div class="table-container"><table class="data-table"><thead><tr><th>No</th><th>Nama</th><th>NIS</th><th>Aksi</th></tr></thead><tbody>
        ${this.studentList.map((s, i) => '<tr' + (i === this.currentStudentIndex ? ' style="background:var(--emerald-light);"' : '') + '><td>' + (i+1) + '</td><td><strong>' + escapeHTMLDash(s.nama) + '</strong></td><td>' + escapeHTMLDash(s.nis) + '</td><td><button class="btn btn-sm ' + (i === this.currentStudentIndex ? 'btn-primary' : 'btn-outline') + '" onclick="InputNilai.selectStudent(' + i + ')">Input Nilai</button></td></tr>').join('')}
      </tbody></table></div></div>`;
  },

  renderStudentForm() {
    const area = document.getElementById('in-student-form-area');
    if (!area || this.currentStudentIndex < 0 || !this.currentAkademik) { if (area) area.innerHTML = ''; return; }
    const s = this.currentAkademik;
    const hasPrev = this.currentStudentIndex > 0;
    const hasNext = this.currentStudentIndex < this.studentList.length - 1;

    area.innerHTML = `
      <div class="card" style="margin-top:16px;">
        <div class="student-nav">
          <button class="btn btn-sm btn-outline" onclick="InputNilai.selectStudent(${this.currentStudentIndex - 1})" ${!hasPrev ? 'disabled' : ''}>&#9664; Sebelumnya</button>
          <strong style="flex:1;text-align:center;font-size:16px;">${escapeHTMLDash(s.nama)} (${escapeHTMLDash(s.nis)})</strong>
          <button class="btn btn-sm btn-outline" onclick="InputNilai.selectStudent(${this.currentStudentIndex + 1})" ${!hasNext ? 'disabled' : ''}>Berikutnya &#9654;</button>
        </div>
        <div class="tabs" style="margin:-24px -24px 0 -24px;padding:0 24px;border-radius:0;">
          <button class="tab-btn ${this.activeTab === 'nilai' ? 'active' : ''}" onclick="InputNilai.setTab('nilai')">Nilai</button>
          <button class="tab-btn ${this.activeTab === 'ekskul' ? 'active' : ''}" onclick="InputNilai.setTab('ekskul')">Ekskul & Absen</button>
          <button class="tab-btn ${this.activeTab === 'p5' ? 'active' : ''}" onclick="InputNilai.setTab('p5')">P5</button>
        </div>
        <div style="padding-top:16px;">${this.renderActiveTab()}</div>
      </div>`;
  },

  renderActiveTab() {
    switch (this.activeTab) {
      case 'nilai': return this.renderNilaiTab();
      case 'ekskul': return this.renderEkskulTab();
      case 'p5': return this.renderP5Tab();
      default: return '';
    }
  },

  renderNilaiTab() {
    const nilaiMap = {};
    (this.nilaiData || []).forEach(n => { nilaiMap[n.mapel] = n; });
    return `<form onsubmit="InputNilai.saveNilai(event)"><div class="table-container"><table class="data-table nilai-table"><thead><tr><th>No</th><th>Mata Pelajaran</th><th>Nilai Sem 1</th><th>Nilai Sem 2</th><th>Deskripsi Sem 1</th><th>Deskripsi Sem 2</th></tr></thead><tbody>
      ${MATA_PELAJARAN.map((mp, i) => { const n = nilaiMap[mp] || {}; return '<tr><td>' + (i+1) + '</td><td>' + escapeHTMLDash(mp) + '</td><td><input type="number" class="input-sm" name="in_nilai_sem1_' + i + '" value="' + escapeHTMLDash(n.nilaiSem1 || '') + '" min="0" max="100"></td><td><input type="number" class="input-sm" name="in_nilai_sem2_' + i + '" value="' + escapeHTMLDash(n.nilaiSem2 || '') + '" min="0" max="100"></td><td><textarea class="input-desc" name="in_desc_sem1_' + i + '" rows="2">' + escapeHTMLDash(n.deskSem1 || '') + '</textarea></td><td><textarea class="input-desc" name="in_desc_sem2_' + i + '" rows="2">' + escapeHTMLDash(n.deskSem2 || '') + '</textarea></td></tr>'; }).join('')}
    </tbody></table></div><div class="form-actions" style="margin-top:16px;"><button type="submit" class="btn btn-primary">Simpan Nilai</button></div></form>`;
  },

  renderEkskulTab() {
    const na = this.nonAkademikData || {};
    return `<form onsubmit="InputNilai.saveEkskul(event)">
      <h3 class="section-title">Ekstrakurikuler</h3>
      <div class="table-container"><table class="data-table"><thead><tr><th>Sem</th><th>Kegiatan</th><th>Keterangan</th></tr></thead><tbody>
        <tr><td>1</td><td><input type="text" class="input-md" name="in_ekskul1" value="${escapeHTMLDash(na.ekskulKegiatan1 || '')}"></td><td><input type="text" class="input-md" name="in_ket1" value="${escapeHTMLDash(na.ekskulKet1 || '')}"></td></tr>
        <tr><td>2</td><td><input type="text" class="input-md" name="in_ekskul2" value="${escapeHTMLDash(na.ekskulKegiatan2 || '')}"></td><td><input type="text" class="input-md" name="in_ket2" value="${escapeHTMLDash(na.ekskulKet2 || '')}"></td></tr>
      </tbody></table></div>
      <h3 class="section-title" style="margin-top:24px;">Ketidakhadiran</h3>
      <div class="table-container"><table class="data-table"><thead><tr><th>Sem</th><th>Sakit</th><th>Izin</th><th>Tanpa Ket</th></tr></thead><tbody>
        <tr><td>1</td><td><input type="number" class="input-sm" name="in_sakit1" value="${na.sakit1 || ''}" min="0"></td><td><input type="number" class="input-sm" name="in_izin1" value="${na.izin1 || ''}" min="0"></td><td><input type="number" class="input-sm" name="in_alpha1" value="${na.alpha1 || ''}" min="0"></td></tr>
        <tr><td>2</td><td><input type="number" class="input-sm" name="in_sakit2" value="${na.sakit2 || ''}" min="0"></td><td><input type="number" class="input-sm" name="in_izin2" value="${na.izin2 || ''}" min="0"></td><td><input type="number" class="input-sm" name="in_alpha2" value="${na.alpha2 || ''}" min="0"></td></tr>
      </tbody></table></div>
      <div class="form-actions" style="margin-top:16px;"><button type="submit" class="btn btn-primary">Simpan Ekskul & Absensi</button></div></form>`;
  },

  renderP5Tab() {
    const p5 = this.p5Data || {};
    return `<form onsubmit="InputNilai.saveP5(event)">
      <h3 class="section-title">Proyek P5</h3>
      <div class="form-group"><label>Catatan P5 Semester 1</label><textarea name="in_p5_sem1" rows="5">${escapeHTMLDash(p5.catatanSem1 || '')}</textarea></div>
      <div class="form-group"><label>Catatan P5 Semester 2</label><textarea name="in_p5_sem2" rows="5">${escapeHTMLDash(p5.catatanSem2 || '')}</textarea></div>
      <div class="form-actions"><button type="submit" class="btn btn-primary">Simpan P5</button></div></form>`;
  },

  async saveNilai(event) {
    event.preventDefault();
    const form = event.target;
    const akadId = this.currentAkademik.id;
    const newRecords = [];
    for (let i = 0; i < MATA_PELAJARAN.length; i++) {
      const v1 = form.elements['in_nilai_sem1_' + i].value;
      const v2 = form.elements['in_nilai_sem2_' + i].value;
      newRecords.push({
        akademikId: akadId,
        mapel: MATA_PELAJARAN[i],
        nilaiSem1: v1 ? parseInt(v1) : null,
        nilaiSem2: v2 ? parseInt(v2) : null,
        deskSem1: form.elements['in_desc_sem1_' + i].value,
        deskSem2: form.elements['in_desc_sem2_' + i].value
      });
    }
    await DB.replaceNilaiByAkademik(akadId, newRecords);
    this.nilaiData = await DB.getNilaiByAkademik(akadId);
    alert('Nilai berhasil disimpan!');
  },

  async saveEkskul(event) {
    event.preventDefault();
    const form = event.target;
    const akadId = this.currentAkademik.id;
    const data = {
      akademikId: akadId,
      ekskulKegiatan1: form.elements['in_ekskul1'].value,
      ekskulKet1: form.elements['in_ket1'].value,
      ekskulKegiatan2: form.elements['in_ekskul2'].value,
      ekskulKet2: form.elements['in_ket2'].value,
      sakit1: parseInt(form.elements['in_sakit1'].value) || 0,
      izin1: parseInt(form.elements['in_izin1'].value) || 0,
      alpha1: parseInt(form.elements['in_alpha1'].value) || 0,
      sakit2: parseInt(form.elements['in_sakit2'].value) || 0,
      izin2: parseInt(form.elements['in_izin2'].value) || 0,
      alpha2: parseInt(form.elements['in_alpha2'].value) || 0
    };
    await DB.replaceNonAkademikByAkademik(akadId, [data]);
    const nonAkadArr = await DB.getNonAkademikByAkademik(akadId);
    this.nonAkademikData = nonAkadArr.length > 0 ? nonAkadArr[0] : null;
    alert('Data ekskul & absensi berhasil disimpan!');
  },

  async saveP5(event) {
    event.preventDefault();
    const form = event.target;
    const akadId = this.currentAkademik.id;
    await DB.replaceP5ByAkademik(akadId, [{ akademikId: akadId, catatanSem1: form.elements['in_p5_sem1'].value, catatanSem2: form.elements['in_p5_sem2'].value }]);
    const p5Arr = await DB.getP5ByAkademik(akadId);
    this.p5Data = p5Arr.length > 0 ? p5Arr[0] : null;
    alert('Data P5 berhasil disimpan!');
  }
};
