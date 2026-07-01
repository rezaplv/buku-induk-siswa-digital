// HTML escape utility to prevent XSS
function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Student Detail Component with Tabs
const MATA_PELAJARAN = [
  'Pendidikan Agama dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'IPA',
  'IPS',
  'Bahasa Inggris',
  'PJOK',
  'Informatika',
  'Seni Budaya dan Prakarya',
  'Bahasa Jawa'
];

const StudentDetail = {
  nis: null,
  studentData: null,
  currentAkademikId: null,
  activeTab: 'biodata',

  async init(nis) {
    this.nis = nis;
    this.activeTab = 'biodata';
    await this.loadData();
    this.render();
  },

  async loadData() {
    this.studentData = await DB.getCompleteStudentData(this.nis);
  },

  setTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  render() {
    const page = document.getElementById('page-student-detail');
    if (!this.studentData) {
      page.innerHTML = '<div class="card"><p>Siswa tidak ditemukan.</p><button class="btn btn-outline" onclick="Router.navigateTo(\'dashboard\')">Kembali</button></div>';
      return;
    }

    const s = this.studentData;
    const akademikRecords = s.akademik || [];
    const latestAkademik = akademikRecords.length > 0 ? akademikRecords[akademikRecords.length - 1] : null;

    if (!this.currentAkademikId && latestAkademik) {
      this.currentAkademikId = latestAkademik.id;
    }

    const currentAkad = akademikRecords.find(a => a.id === this.currentAkademikId) || latestAkademik;

    page.innerHTML = `
      <div class="page-header">
        <button class="btn btn-outline" onclick="Router.navigateTo('dashboard')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Kembali
        </button>
        <button class="btn btn-primary" onclick="StudentDetail.printBukuInduk()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Cetak Buku Induk
        </button>
      </div>

      <div class="student-info-header card">
        <h2>${escapeHTML(s.nama)}</h2>
        <div class="student-meta">
          <span><strong>NIS:</strong> ${escapeHTML(s.nis)}</span>
          <span><strong>NISN:</strong> ${escapeHTML(s.nisn || '-')}</span>
          ${currentAkad ? `<span><strong>Kelas:</strong> ${escapeHTML(currentAkad.kelas || '-')}</span>
          <span><strong>TP:</strong> ${escapeHTML(currentAkad.tahunPelajaran || '-')}</span>` : ''}
        </div>
      </div>

      ${akademikRecords.length > 0 ? `
      <div class="akademik-selector card">
        <label>Pilih Tahun Pelajaran:</label>
        <select onchange="StudentDetail.switchAkademik(parseInt(this.value))">
          ${akademikRecords.map(a => `
            <option value="${a.id}" ${a.id === this.currentAkademikId ? 'selected' : ''}>
              ${escapeHTML(a.tahunPelajaran)} - ${escapeHTML(a.kelas)}
            </option>
          `).join('')}
        </select>
        <button class="btn btn-sm btn-outline" onclick="StudentDetail.showAddAkademikModal()">+ Tahun Baru</button>
      </div>
      ` : `
      <div class="card">
        <p>Belum ada data akademik. Tambahkan tahun pelajaran untuk memulai.</p>
        <button class="btn btn-primary" onclick="StudentDetail.showAddAkademikModal()">+ Tambah Tahun Pelajaran</button>
      </div>
      `}

      <div class="tabs">
        <button class="tab-btn ${this.activeTab === 'biodata' ? 'active' : ''}" onclick="StudentDetail.setTab('biodata')">Biodata</button>
        <button class="tab-btn ${this.activeTab === 'nilai' ? 'active' : ''}" onclick="StudentDetail.setTab('nilai')">Nilai & Deskripsi</button>
        <button class="tab-btn ${this.activeTab === 'ekskul' ? 'active' : ''}" onclick="StudentDetail.setTab('ekskul')">Ekskul & Absen</button>
        <button class="tab-btn ${this.activeTab === 'p5' ? 'active' : ''}" onclick="StudentDetail.setTab('p5')">Proyek P5</button>
      </div>

      <div class="tab-content card">
        ${this.renderTabContent(currentAkad)}
      </div>

      <!-- Akademik Modal -->
      <div id="akademik-modal" class="modal" style="display:none;">
        <div class="modal-overlay" onclick="StudentDetail.closeAkademikModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>Tambah Data Akademik</h3>
            <button class="modal-close" onclick="StudentDetail.closeAkademikModal()">&times;</button>
          </div>
          <form onsubmit="StudentDetail.saveAkademik(event)">
            <div class="form-group">
              <label>Tahun Pelajaran</label>
              <input type="text" id="akad-tp" required placeholder="Contoh: 2025/2026">
            </div>
            <div class="form-group">
              <label>Kelas</label>
              <input type="text" id="akad-kelas" required placeholder="Contoh: VII D">
            </div>
            <div class="form-group">
              <label>Wali Kelas</label>
              <input type="text" id="akad-wali" placeholder="Nama wali kelas">
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="StudentDetail.closeAkademikModal()">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderTabContent(akad) {
    switch (this.activeTab) {
      case 'biodata': return this.renderBiodata(akad);
      case 'nilai': return this.renderNilai(akad);
      case 'ekskul': return this.renderEkskul(akad);
      case 'p5': return this.renderP5(akad);
      default: return '';
    }
  },

  renderBiodata(akad) {
    const s = this.studentData;
    return `
      <h3 class="section-title">Data Biodata Siswa</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>Nama Peserta Didik</label>
          <p>${escapeHTML(s.nama)}</p>
        </div>
        <div class="info-item">
          <label>NIS</label>
          <p>${escapeHTML(s.nis)}</p>
        </div>
        <div class="info-item">
          <label>NISN</label>
          <p>${escapeHTML(s.nisn || '-')}</p>
        </div>
      </div>
      ${akad ? `
      <h3 class="section-title" style="margin-top:24px;">Data Akademik (${escapeHTML(akad.tahunPelajaran)})</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>Tahun Pelajaran</label>
          <p>${escapeHTML(akad.tahunPelajaran)}</p>
        </div>
        <div class="info-item">
          <label>Kelas</label>
          <p>${escapeHTML(akad.kelas)}</p>
        </div>
        <div class="info-item">
          <label>Wali Kelas</label>
          <p>${escapeHTML(akad.waliKelas || '-')}</p>
        </div>
        <div class="info-item">
          <label>Status Akhir Tahun</label>
          <p>${escapeHTML(akad.status || '-')}</p>
        </div>
      </div>
      <button class="btn btn-sm btn-outline" style="margin-top:12px;" onclick="StudentDetail.editAkademik()">Edit Data Akademik</button>
      ` : '<p class="muted">Tambahkan data akademik terlebih dahulu.</p>'}
    `;
  },

  renderNilai(akad) {
    if (!akad) return '<p class="muted">Tambahkan data akademik terlebih dahulu.</p>';
    const nilaiRecords = akad.nilai || [];

    // Build a map of subject to nilai
    const nilaiMap = {};
    nilaiRecords.forEach(n => {
      nilaiMap[n.mapel] = n;
    });

    return `
      <h3 class="section-title">Nilai & Deskripsi Capaian Kompetensi</h3>
      <p class="muted">Tahun Pelajaran: ${escapeHTML(akad.tahunPelajaran)} | Kelas: ${escapeHTML(akad.kelas)}</p>
      <form onsubmit="StudentDetail.saveNilai(event)">
        <div class="table-container">
          <table class="data-table nilai-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Mata Pelajaran</th>
                <th>Nilai Sem 1</th>
                <th>Nilai Sem 2</th>
                <th>Deskripsi Sem 1</th>
                <th>Deskripsi Sem 2</th>
              </tr>
            </thead>
            <tbody>
              ${MATA_PELAJARAN.map((mp, i) => {
                const n = nilaiMap[mp] || {};
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${escapeHTML(mp)}</td>
                    <td><input type="number" class="input-sm" name="nilai_sem1_${i}" value="${escapeHTML(n.nilaiSem1 || '')}" min="0" max="100"></td>
                    <td><input type="number" class="input-sm" name="nilai_sem2_${i}" value="${escapeHTML(n.nilaiSem2 || '')}" min="0" max="100"></td>
                    <td><textarea class="input-desc" name="desc_sem1_${i}" rows="2" placeholder="Catatan...">${escapeHTML(n.deskSem1 || '')}</textarea></td>
                    <td><textarea class="input-desc" name="desc_sem2_${i}" rows="2" placeholder="Catatan...">${escapeHTML(n.deskSem2 || '')}</textarea></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="form-actions" style="margin-top:16px;">
          <button type="submit" class="btn btn-primary">Simpan Nilai</button>
        </div>
      </form>
    `;
  },

  renderEkskul(akad) {
    if (!akad) return '<p class="muted">Tambahkan data akademik terlebih dahulu.</p>';
    const nonAkad = akad.nonAkademik || {};

    return `
      <h3 class="section-title">Ekstrakurikuler</h3>
      <p class="muted" style="margin-bottom:8px;">Satu kegiatan per baris. Baris ke-1 kegiatan dipasangkan dengan baris ke-1 keterangan.</p>
      <form onsubmit="StudentDetail.saveNonAkademik(event)">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Semester</th>
                <th>Kegiatan Ekstrakurikuler</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><textarea class="input-md" name="ekskul_kegiatan_1" rows="3" style="resize:vertical;min-height:50px;" placeholder="Satu per baris">${escapeHTML(nonAkad.ekskulKegiatan1 || '')}</textarea></td>
                <td><textarea class="input-md" name="ekskul_ket_1" rows="3" style="resize:vertical;min-height:50px;" placeholder="Satu per baris">${escapeHTML(nonAkad.ekskulKet1 || '')}</textarea></td>
              </tr>
              <tr>
                <td>2</td>
                <td><textarea class="input-md" name="ekskul_kegiatan_2" rows="3" style="resize:vertical;min-height:50px;" placeholder="Satu per baris">${escapeHTML(nonAkad.ekskulKegiatan2 || '')}</textarea></td>
                <td><textarea class="input-md" name="ekskul_ket_2" rows="3" style="resize:vertical;min-height:50px;" placeholder="Satu per baris">${escapeHTML(nonAkad.ekskulKet2 || '')}</textarea></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="section-title" style="margin-top:24px;">Rekap Ketidakhadiran</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Semester</th>
                <th>Sakit (Hari)</th>
                <th>Izin (Hari)</th>
                <th>Tanpa Keterangan (Hari)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><input type="number" class="input-sm" name="sakit_1" value="${nonAkad.sakit1 || ''}" min="0"></td>
                <td><input type="number" class="input-sm" name="izin_1" value="${nonAkad.izin1 || ''}" min="0"></td>
                <td><input type="number" class="input-sm" name="alpha_1" value="${nonAkad.alpha1 || ''}" min="0"></td>
              </tr>
              <tr>
                <td>2</td>
                <td><input type="number" class="input-sm" name="sakit_2" value="${nonAkad.sakit2 || ''}" min="0"></td>
                <td><input type="number" class="input-sm" name="izin_2" value="${nonAkad.izin2 || ''}" min="0"></td>
                <td><input type="number" class="input-sm" name="alpha_2" value="${nonAkad.alpha2 || ''}" min="0"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="form-actions" style="margin-top:16px;">
          <button type="submit" class="btn btn-primary">Simpan Data Ekskul & Absensi</button>
        </div>
      </form>
    `;
  },

  renderP5(akad) {
    if (!akad) return '<p class="muted">Tambahkan data akademik terlebih dahulu.</p>';
    const p5 = akad.p5 || {};

    return `
      <h3 class="section-title">Kokurikuler - Proyek Penguatan Profil Pelajar Pancasila (P5)</h3>
      <form onsubmit="StudentDetail.saveP5(event)">
        <div class="form-group">
          <label>Catatan Proyek P5 Semester 1</label>
          <textarea name="p5_sem1" rows="5" placeholder="Masukkan catatan proyek P5 semester 1...">${escapeHTML(p5.catatanSem1 || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Catatan Proyek P5 Semester 2</label>
          <textarea name="p5_sem2" rows="5" placeholder="Masukkan catatan proyek P5 semester 2...">${escapeHTML(p5.catatanSem2 || '')}</textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Simpan Data P5</button>
        </div>
      </form>
    `;
  },

  switchAkademik(id) {
    this.currentAkademikId = id;
    this.render();
  },

  showAddAkademikModal() {
    document.getElementById('akademik-modal').style.display = 'flex';
  },

  closeAkademikModal() {
    document.getElementById('akademik-modal').style.display = 'none';
  },

  async saveAkademik(event) {
    event.preventDefault();
    const data = {
      nis: this.nis,
      tahunPelajaran: document.getElementById('akad-tp').value.trim(),
      kelas: document.getElementById('akad-kelas').value.trim(),
      waliKelas: document.getElementById('akad-wali').value.trim(),
    };

    try {
      const id = await DB.addAkademik(data);
      this.currentAkademikId = id;
      this.closeAkademikModal();
      await this.loadData();
      this.render();
    } catch (e) {
      alert('Gagal menyimpan: ' + e.message);
    }
  },

  async editAkademik() {
    const akad = this.studentData.akademik.find(a => a.id === this.currentAkademikId);
    if (!akad) return;

    const tp = prompt('Tahun Pelajaran:', akad.tahunPelajaran);
    if (tp === null) return;
    const kelas = prompt('Kelas:', akad.kelas);
    if (kelas === null) return;
    const wali = prompt('Wali Kelas:', akad.waliKelas || '');
    if (wali === null) return;
    try {
      await DB.updateAkademik({
        id: akad.id,
        nis: this.nis,
        tahunPelajaran: tp,
        kelas: kelas,
        waliKelas: wali,
        status: akad.status || '',
      });
      await this.loadData();
      this.render();
    } catch (e) {
      alert('Gagal update: ' + e.message);
    }
  },

  async saveNilai(event) {
    event.preventDefault();
    const form = event.target;
    const akad = this.studentData.akademik.find(a => a.id === this.currentAkademikId);
    if (!akad) return;

    // Build new records
    const newRecords = [];
    for (let i = 0; i < MATA_PELAJARAN.length; i++) {
      const nilaiSem1 = form.elements['nilai_sem1_' + i].value;
      const nilaiSem2 = form.elements['nilai_sem2_' + i].value;
      const deskSem1 = form.elements['desc_sem1_' + i].value;
      const deskSem2 = form.elements['desc_sem2_' + i].value;

      newRecords.push({
        akademikId: akad.id,
        mapel: MATA_PELAJARAN[i],
        nilaiSem1: nilaiSem1 ? parseInt(nilaiSem1) : null,
        nilaiSem2: nilaiSem2 ? parseInt(nilaiSem2) : null,
        deskSem1: deskSem1,
        deskSem2: deskSem2,
      });
    }

    // Atomic replace in a single transaction
    await DB.replaceNilaiByAkademik(akad.id, newRecords);

    await this.loadData();
    this.render();
    alert('Nilai berhasil disimpan!');
  },

  async saveNonAkademik(event) {
    event.preventDefault();
    const form = event.target;
    const akad = this.studentData.akademik.find(a => a.id === this.currentAkademikId);
    if (!akad) return;

    const data = {
      akademikId: akad.id,
      ekskulKegiatan1: form.elements['ekskul_kegiatan_1'].value,
      ekskulKet1: form.elements['ekskul_ket_1'].value,
      ekskulKegiatan2: form.elements['ekskul_kegiatan_2'].value,
      ekskulKet2: form.elements['ekskul_ket_2'].value,
      sakit1: parseInt(form.elements['sakit_1'].value) || 0,
      izin1: parseInt(form.elements['izin_1'].value) || 0,
      alpha1: parseInt(form.elements['alpha_1'].value) || 0,
      sakit2: parseInt(form.elements['sakit_2'].value) || 0,
      izin2: parseInt(form.elements['izin_2'].value) || 0,
      alpha2: parseInt(form.elements['alpha_2'].value) || 0,
    };

    // Atomic replace in a single transaction
    await DB.replaceNonAkademikByAkademik(akad.id, [data]);

    await this.loadData();
    this.render();
    alert('Data ekskul & absensi berhasil disimpan!');
  },

  async saveP5(event) {
    event.preventDefault();
    const form = event.target;
    const akad = this.studentData.akademik.find(a => a.id === this.currentAkademikId);
    if (!akad) return;

    const data = {
      akademikId: akad.id,
      catatanSem1: form.elements['p5_sem1'].value,
      catatanSem2: form.elements['p5_sem2'].value,
    };

    // Atomic replace in a single transaction
    await DB.replaceP5ByAkademik(akad.id, [data]);

    await this.loadData();
    this.render();
    alert('Data P5 berhasil disimpan!');
  },

  async printBukuInduk() {
    await this.loadData();
    const akad = this.studentData.akademik.find(a => a.id === this.currentAkademikId);
    if (!akad) {
      alert('Pilih tahun pelajaran terlebih dahulu!');
      return;
    }
    PDFGenerator.generate(this.studentData, akad);
  }
};
