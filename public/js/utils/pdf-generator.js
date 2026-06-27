// PDF Generator - Uses window.print() with print-ready HTML
// Format: Buku Induk Resmi (Laporan Hasil Capaian Kompetensi Peserta Didik)
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

  parseNewlineSeparated(str) {
    if (!str) return [];
    return str.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  },

  buildEkskulRows(kegiatan, keterangan, semester, minRows) {
    const kegiatanList = this.parseNewlineSeparated(kegiatan);
    const keteranganList = this.parseNewlineSeparated(keterangan);
    const maxLen = Math.max(kegiatanList.length, keteranganList.length, minRows);
    const esc = this.escapeHTML;
    let rows = '';
    for (let i = 0; i < maxLen; i++) {
      rows += '<tr>';
      if (i === 0) {
        rows += '<td class="center" rowspan="' + maxLen + '">' + semester + '</td>';
      }
      rows += '<td>' + esc(kegiatanList[i] || '') + '</td>';
      rows += '<td>' + esc(keteranganList[i] || '') + '</td>';
      rows += '</tr>';
    }
    return rows;
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

    // Determine status
    const statusNaik = (akad.status || '').toLowerCase() === 'naik';
    const statusTidakNaik = (akad.status || '').toLowerCase() === 'tidak naik';

    const semesterText1 = '1 (Satu)';
    const semesterText2 = '2 (Dua)';

    // Build ekstrakurikuler rows (parse newline-separated data)
    const ekskulRows1 = this.buildEkskulRows(nonAkad.ekskulKegiatan1, nonAkad.ekskulKet1, '1', 3);
    const ekskulRows2 = this.buildEkskulRows(nonAkad.ekskulKegiatan2, nonAkad.ekskulKet2, '2', 3);

    const printContent = `
      <div class="print-document">
        <div class="print-header">
          <h1>LAPORAN HASIL CAPAIAN KOMPETENSI PESERTA DIDIK</h1>
        </div>

        <div class="print-student-info">
          <span class="label-underline">NAMA PESERTA DIDIK</span> : <strong>${esc(s.nama)}</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <span class="label-underline">NIS</span> : <strong>${esc(s.nis)}</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <span class="label-underline">NISN</span> : <strong>${esc(s.nisn || '-')}</strong>
        </div>

        <table class="print-info-table">
          <tr>
            <td class="col-no" rowspan="4">NO</td>
            <td class="col-label">TAHUN PELAJARAN</td>
            <td colspan="2">${esc(akad.tahunPelajaran || '-')}</td>
          </tr>
          <tr>
            <td class="col-label">KELAS</td>
            <td colspan="2">${esc(akad.kelas || '-')}</td>
          </tr>
          <tr>
            <td class="col-label">SEMESTER</td>
            <td class="col-sem">${semesterText1}</td>
            <td class="col-sem">${semesterText2}</td>
          </tr>
          <tr>
            <td class="col-label">MATA PELAJARAN</td>
            <td class="col-sem">NILAI AKHIR</td>
            <td class="col-sem">NILAI AKHIR</td>
          </tr>
        </table>

        <table class="print-table">
          <tbody>
            ${MATA_PELAJARAN.map((mp, i) => {
              const n = nilaiMap[mp] || {};
              return `
                <tr>
                  <td class="center" style="width:40px;">${i + 1}</td>
                  <td>${esc(mp)}</td>
                  <td class="center" style="width:80px;">${esc(n.nilaiSem1 || '-')}</td>
                  <td class="center" style="width:80px;">${esc(n.nilaiSem2 || '-')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="print-section" style="margin-top:16px;">
          <div class="print-section-title">Ekstrakurikuler</div>
          <table class="print-table">
            <thead>
              <tr><th>Semester</th><th>Kegiatan Ekstrakurikuler</th><th>Keterangan</th></tr>
            </thead>
            <tbody>
              ${ekskulRows1}
              ${ekskulRows2}
            </tbody>
          </table>
        </div>

        <div class="print-section">
          <div class="print-section-title">Ketidakhadiran</div>
          <table class="print-table">
            <thead>
              <tr><th>Semester</th><th>Sakit (Hari)</th><th>Izin (Hari)</th><th>Tanpa Keterangan (Hari)</th></tr>
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
          <div class="print-section-title-no-underline">Status Akhir Tahun Pelajaran</div>
          <table class="print-table">
            <thead>
              <tr><th>Kelas</th><th>Status Akhir Tahun Pelajaran</th><th>Nama Wali Kelas</th><th>Tanda Tangan</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="center" rowspan="3">${esc(akad.kelas || '-')}</td>
                <td class="${statusNaik ? 'status-active' : 'status-inactive'}">Naik</td>
                <td rowspan="3">${esc(akad.waliKelas || '-')}</td>
                <td class="signature-cell" rowspan="3"></td>
              </tr>
              <tr><td>&nbsp;</td></tr>
              <tr>
                <td class="${statusTidakNaik ? 'status-active' : 'status-inactive'}">Tidak Naik</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="print-section page-break">
          <div class="print-section-title">Deskripsi Capaian Kompetensi</div>
          <table class="print-table">
            <thead>
              <tr><th style="width:30px;">No</th><th>Mata Pelajaran</th><th>Catatan Semester 1</th><th>Catatan Semester 2</th></tr>
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

        <div class="print-section page-break">
          <div class="kokurikuler-header">KOKURIKULER</div>
          <div class="kokurikuler-semester">SEMESTER 1 :</div>
          <div class="kokurikuler-box">${esc(p5.catatanSem1 || '-')}</div>
          <div class="kokurikuler-semester">SEMESTER 2 :</div>
          <div class="kokurikuler-box">${esc(p5.catatanSem2 || '-')}</div>
        </div>
      </div>
    `;

    // Set print content and trigger print
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = printContent;
    window.print();
  }
};
