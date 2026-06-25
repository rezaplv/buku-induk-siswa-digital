// PDF Generator - Uses window.print() with print-ready HTML
const PDFGenerator = {
  escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  generate(studentData, akademikData) {
    const s = studentData;
    const akad = akademikData;
    const nilaiRecords = akad.nilai || [];
    const nonAkad = akad.nonAkademik || {};
    const p5 = akad.p5 || {};
    const esc = this.escapeHTML;

    // Build nilai map
    const nilaiMap = {};
    nilaiRecords.forEach(n => { nilaiMap[n.mapel] = n; });

    const printContent = `
      <div class="print-document">
        <div class="print-header">
          <h1>LAPORAN HASIL CAPAIAN KOMPETENSI PESERTA DIDIK</h1>
        </div>

        <div class="print-student-info">
          <table class="info-table">
            <tr><td class="label-td">NAMA PESERTA DIDIK</td><td>: ${esc(s.nama)}</td></tr>
            <tr><td class="label-td">NIS</td><td>: ${esc(s.nis)}</td></tr>
            <tr><td class="label-td">NISN</td><td>: ${esc(s.nisn || '-')}</td></tr>
            <tr><td class="label-td">TAHUN PELAJARAN</td><td>: ${esc(akad.tahunPelajaran || '-')}</td></tr>
            <tr><td class="label-td">KELAS</td><td>: ${esc(akad.kelas || '-')}</td></tr>
          </table>
        </div>

        <div class="print-section">
          <h2>A. NILAI AKHIR</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>MATA PELAJARAN</th>
                <th>NILAI AKHIR<br>Semester 1</th>
                <th>NILAI AKHIR<br>Semester 2</th>
              </tr>
            </thead>
            <tbody>
              ${MATA_PELAJARAN.map((mp, i) => {
                const n = nilaiMap[mp] || {};
                return `
                  <tr>
                    <td class="center">${i + 1}</td>
                    <td>${esc(mp)}</td>
                    <td class="center">${esc(n.nilaiSem1 || '-')}</td>
                    <td class="center">${esc(n.nilaiSem2 || '-')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="print-section">
          <h2>B. EKSTRAKURIKULER</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>SEMESTER</th>
                <th>KEGIATAN EKSTRAKURIKULER</th>
                <th>KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="center">1</td>
                <td>${esc(nonAkad.ekskulKegiatan1 || '-')}</td>
                <td>${esc(nonAkad.ekskulKet1 || '-')}</td>
              </tr>
              <tr>
                <td class="center">2</td>
                <td>${esc(nonAkad.ekskulKegiatan2 || '-')}</td>
                <td>${esc(nonAkad.ekskulKet2 || '-')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="print-section">
          <h2>C. KETIDAKHADIRAN</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>SEMESTER</th>
                <th>SAKIT (Hari)</th>
                <th>IZIN (Hari)</th>
                <th>TANPA KETERANGAN (Hari)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="center">1</td>
                <td class="center">${esc(nonAkad.sakit1 || 0)}</td>
                <td class="center">${esc(nonAkad.izin1 || 0)}</td>
                <td class="center">${esc(nonAkad.alpha1 || 0)}</td>
              </tr>
              <tr>
                <td class="center">2</td>
                <td class="center">${esc(nonAkad.sakit2 || 0)}</td>
                <td class="center">${esc(nonAkad.izin2 || 0)}</td>
                <td class="center">${esc(nonAkad.alpha2 || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="print-section">
          <h2>D. STATUS AKHIR TAHUN PELAJARAN</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>KELAS</th>
                <th>STATUS</th>
                <th>WALI KELAS</th>
                <th>TANDA TANGAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="center">${esc(akad.kelas || '-')}</td>
                <td class="center">${esc(akad.status || '-')}</td>
                <td class="center">${esc(akad.waliKelas || '-')}</td>
                <td class="center signature-cell">
                  <br><br><br>
                  <span class="signature-line">____________________</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="print-section page-break">
          <h2>E. DESKRIPSI CAPAIAN KOMPETENSI</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>MATA PELAJARAN</th>
                <th>CATATAN SEMESTER 1</th>
                <th>CATATAN SEMESTER 2</th>
              </tr>
            </thead>
            <tbody>
              ${MATA_PELAJARAN.map((mp, i) => {
                const n = nilaiMap[mp] || {};
                return `
                  <tr>
                    <td class="center">${i + 1}</td>
                    <td>${esc(mp)}</td>
                    <td class="desc-cell">${esc(n.deskSem1 || '-')}</td>
                    <td class="desc-cell">${esc(n.deskSem2 || '-')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="print-section">
          <h2>F. KOKURIKULER (Proyek Penguatan Profil Pelajar Pancasila / P5)</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>SEMESTER</th>
                <th>CATATAN PROYEK P5</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="center">1</td>
                <td class="desc-cell">${esc(p5.catatanSem1 || '-')}</td>
              </tr>
              <tr>
                <td class="center">2</td>
                <td class="desc-cell">${esc(p5.catatanSem2 || '-')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Set print content and trigger print
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = printContent;
    window.print();
  }
};
