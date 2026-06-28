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

// Dashboard Component - Read-only statistics overview
const Dashboard = {
  students: [],
  akademikData: [],
  nilaiData: [],
  nonAkademikData: [],

  async init() {
    await this.loadData();
    this.render();
  },

  async loadData() {
    this.students = await DB.getAllSiswa();
    this.akademikData = await DB.getAllAkademik();
    this.nilaiData = await getAllRecords('nilai');
    this.nonAkademikData = await getAllRecords('nonAkademik');
  },

  render() {
    const page = document.getElementById('page-dashboard');
    const totalSiswa = this.students.length;

    // Compute kelas and TP
    const kelasSet = new Set();
    const tpSet = new Set();
    const kelasCount = {};
    this.akademikData.forEach(a => {
      if (a.kelas) { kelasSet.add(a.kelas); kelasCount[a.kelas] = (kelasCount[a.kelas] || 0) + 1; }
      if (a.tahunPelajaran) tpSet.add(a.tahunPelajaran);
    });
    const totalKelas = kelasSet.size;
    const totalMapel = MATA_PELAJARAN.length;
    const tpList = Array.from(tpSet).sort();
    const latestTP = tpList.length > 0 ? tpList[tpList.length - 1] : '-';

    // Distribusi kelas
    const kelasNames = Object.keys(kelasCount).sort();
    const maxKelas = Math.max(...Object.values(kelasCount), 1);
    const barColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];

    // Status akhir tahun
    let statusNaik = 0, statusTidakNaik = 0, statusBelum = 0;
    this.akademikData.forEach(a => {
      if (a.statusAkhirTahun === 'Naik') statusNaik++;
      else if (a.statusAkhirTahun === 'Tidak Naik') statusTidakNaik++;
      else statusBelum++;
    });

    // Rekap Ekstrakurikuler
    const ekskulCount = {};
    this.nonAkademikData.forEach(na => {
      const fields = [na.ekskulSem1, na.ekskulSem2, na.kegiatan];
      fields.forEach(field => {
        if (field && typeof field === 'string') {
          field.split('\n').forEach(line => {
            const name = line.trim();
            if (name) ekskulCount[name] = (ekskulCount[name] || 0) + 1;
          });
        }
      });
    });
    const ekskulNames = Object.keys(ekskulCount).sort((a, b) => ekskulCount[b] - ekskulCount[a]);

    // Rekap Kehadiran
    let totalSakit = 0, totalIzin = 0, totalAlpha = 0;
    this.nonAkademikData.forEach(na => {
      totalSakit += parseInt(na.sakitSem1 || 0) + parseInt(na.sakitSem2 || 0);
      totalIzin += parseInt(na.izinSem1 || 0) + parseInt(na.izinSem2 || 0);
      totalAlpha += parseInt(na.alphaSem1 || 0) + parseInt(na.alphaSem2 || 0);
    });

    // Progress Input Nilai
    const totalAkademik = this.akademikData.length;
    const nilaiByMapel = {};
    MATA_PELAJARAN.forEach(mp => { nilaiByMapel[mp] = 0; });
    this.nilaiData.forEach(n => {
      if (n.mapel && (n.nilaiSem1 != null || n.nilaiSem2 != null)) {
        if (nilaiByMapel[n.mapel] !== undefined) nilaiByMapel[n.mapel]++;
      }
    });

    page.innerHTML = `
      <div class="page-header"><h2 class="page-title">Dashboard</h2></div>

      <div class="stat-cards-row">
        <div class="stat-card-gradient bg-gradient-green">
          <div class="stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
          <div class="stat-value">${totalSiswa}</div>
          <div class="stat-label">Total Siswa</div>
        </div>
        <div class="stat-card-gradient bg-gradient-blue">
          <div class="stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"></rect><rect x="2" y="14" width="20" height="8" rx="2"></rect></svg></div>
          <div class="stat-value">${totalKelas}</div>
          <div class="stat-label">Total Kelas</div>
        </div>
        <div class="stat-card-gradient bg-gradient-purple">
          <div class="stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>
          <div class="stat-value">${totalMapel}</div>
          <div class="stat-label">Total Mapel</div>
        </div>
        <div class="stat-card-gradient bg-gradient-orange">
          <div class="stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
          <div class="stat-value" style="font-size:22px;">${escapeHTMLDash(latestTP)}</div>
          <div class="stat-label">Tahun Pelajaran</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header"><h3>Distribusi Siswa Per Kelas</h3></div>
          ${kelasNames.length === 0 ? '<p class="muted">Belum ada data kelas.</p>' : kelasNames.map((kelas, i) => {
            const count = kelasCount[kelas];
            const pct = Math.round((count / maxKelas) * 100);
            const color = barColors[i % barColors.length];
            return '<div class="progress-row"><span class="progress-label">' + escapeHTMLDash(kelas) + '</span><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + pct + '%;background:' + color + ';"></div></div><span class="progress-percent">' + count + '</span></div>';
          }).join('')}
        </div>

        <div class="card">
          <div class="card-header"><h3>Status Akhir Tahun</h3></div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <span class="badge badge-green">Naik: ${statusNaik}</span>
            <span class="badge badge-red">Tidak Naik: ${statusTidakNaik}</span>
            <span class="badge badge-gray">Belum Ditentukan: ${statusBelum}</span>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Kegiatan Ekstrakurikuler</h3></div>
          ${ekskulNames.length === 0 ? '<p class="muted">Belum ada data ekstrakurikuler.</p>' : '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + ekskulNames.slice(0, 20).map(name => '<span class="badge badge-green">' + escapeHTMLDash(name) + ' <strong>' + ekskulCount[name] + '</strong></span>').join('') + '</div>'}
        </div>

        <div class="card">
          <div class="card-header"><h3>Rekap Ketidakhadiran</h3></div>
          <div style="display:flex;gap:24px;flex-wrap:wrap;">
            <div style="text-align:center;"><div style="font-size:28px;font-weight:800;color:#F59E0B;">${totalSakit}</div><div style="font-size:12px;color:var(--text-muted);font-weight:500;">Sakit</div></div>
            <div style="text-align:center;"><div style="font-size:28px;font-weight:800;color:#3B82F6;">${totalIzin}</div><div style="font-size:12px;color:var(--text-muted);font-weight:500;">Izin</div></div>
            <div style="text-align:center;"><div style="font-size:28px;font-weight:800;color:#EF4444;">${totalAlpha}</div><div style="font-size:12px;color:var(--text-muted);font-weight:500;">Alpha</div></div>
          </div>
        </div>

        <div class="card" style="grid-column: 1 / -1;">
          <div class="card-header"><h3>Progress Input Nilai</h3></div>
          ${totalAkademik === 0 ? '<p class="muted">Belum ada data akademik.</p>' : MATA_PELAJARAN.map(mp => {
            const count = nilaiByMapel[mp] || 0;
            const pct = totalAkademik > 0 ? Math.round((count / totalAkademik) * 100) : 0;
            return '<div class="progress-row"><span class="progress-label">' + escapeHTMLDash(mp) + '</span><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + pct + '%;background:#10B981;"></div></div><span class="progress-percent">' + pct + '%</span></div>';
          }).join('')}
        </div>
      </div>`;
  }
};
