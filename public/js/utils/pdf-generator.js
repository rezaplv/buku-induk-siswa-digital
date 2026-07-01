// PDF Generator - Generates MS Word (.doc) document via HTML-to-Word technique
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

  escapeHTMLWithBreaks(str) {
    if (str == null) return '';
    var escaped = this.escapeHTML(str);
    // Normalize line endings then convert newlines to <br>
    escaped = escaped.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br>');
    return escaped;
  },

  parseNewlineSeparated(str) {
    if (!str) return [];
    return str.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  },

  buildEkskulRows(kegiatan, keterangan, semester, minRows) {
    const kegiatanList = this.parseNewlineSeparated(kegiatan);
    const keteranganList = this.parseNewlineSeparated(keterangan);
    const esc = this.escapeHTML;
    const maxLen = Math.max(kegiatanList.length, keteranganList.length);
    const kegHtml = [];
    const ketHtml = [];
    for (let i = 0; i < maxLen; i++) {
      kegHtml.push(esc(kegiatanList[i] || ''));
      ketHtml.push(esc(keteranganList[i] || ''));
    }
    // One single row per semester; activities stacked with <br> inside one cell.
    // Add a min-height so empty cells keep a reasonable row height.
    const kegCell = kegHtml.length > 0 ? kegHtml.join('<br>') : '&nbsp;';
    const ketCell = ketHtml.length > 0 ? ketHtml.join('<br>') : '&nbsp;';
    return '<tr>' +
      '<td class="center" style="vertical-align:middle;">' + semester + '</td>' +
      '<td style="vertical-align:top;">' + kegCell + '</td>' +
      '<td style="vertical-align:top;">' + ketCell + '</td>' +
      '</tr>';
  },

  buildHTML(studentData, akademikData) {
    const s = studentData;
    const akad = akademikData;
    const nilaiRecords = akad.nilai || [];
    const nonAkad = akad.nonAkademik || {};
    const p5 = akad.p5 || {};
    const esc = this.escapeHTML;
    const escBr = this.escapeHTMLWithBreaks.bind(this);

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
          <strong>NAMA PESERTA DIDIK</strong> : <strong>${esc(s.nama)}</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>NIS</strong> : <strong>${esc(s.nis)}</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>NISN</strong> : <strong>${esc(s.nisn || '-')}</strong>
        </div>

        <table class="print-table">
          <tbody>
            <tr>
              <td rowspan="4" style="width:6%;text-align:center;vertical-align:middle;"><strong>NO</strong></td>
              <td style="width:44%;"><strong>TAHUN PELAJARAN</strong></td>
              <td colspan="2">${esc(akad.tahunPelajaran || '-')}</td>
            </tr>
            <tr>
              <td><strong>KELAS</strong></td>
              <td colspan="2">${esc(akad.kelas || '-')}</td>
            </tr>
            <tr>
              <td><strong>SEMESTER</strong></td>
              <td style="text-align:center;"><strong>${semesterText1}</strong></td>
              <td style="text-align:center;"><strong>${semesterText2}</strong></td>
            </tr>
            <tr>
              <td><strong>MATA PELAJARAN</strong></td>
              <td style="text-align:center;"><strong>NILAI AKHIR</strong></td>
              <td style="text-align:center;"><strong>NILAI AKHIR</strong></td>
            </tr>
            ${MATA_PELAJARAN.map((mp, i) => {
              const n = nilaiMap[mp] || {};
              return `
                <tr>
                  <td class="center" style="width:6%;">${i + 1}</td>
                  <td>${esc(mp)}</td>
                  <td class="center" style="width:25%;">${esc(n.nilaiSem1 || '-')}</td>
                  <td class="center" style="width:25%;">${esc(n.nilaiSem2 || '-')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="print-section" style="margin-top:16px;">
          <div class="print-section-title">Ekstrakurikuler</div>
          <table class="print-table">
            <thead>
              <tr><th style="width:14%;">Semester</th><th style="width:43%;">Kegiatan Ekstrakurikuler</th><th style="width:43%;">Keterangan</th></tr>
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
              <tr><th rowspan="2" style="width:16%;">Semester</th><th colspan="3">Ketidakhadiran</th></tr>
<tr><th style="width:28%;">Sakit (Hari)</th><th style="width:28%;">Izin (Hari)</th><th style="width:28%;">Tanpa Keterangan (Hari)</th></tr>
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
              <tr><th style="width:15%;">Kelas</th><th style="width:35%;">Status Akhir Tahun Pelajaran</th><th style="width:30%;">Nama Wali Kelas</th><th style="width:20%;">Tanda Tangan</th></tr>
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
              <tr><th style="width:6%;">No</th><th style="width:24%;">Mata Pelajaran</th><th style="width:35%;">Catatan Semester 1</th><th style="width:35%;">Catatan Semester 2</th></tr>
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
          <div class="kokurikuler-box">${p5.catatanSem1 ? escBr(p5.catatanSem1) : '-'}</div>
          <div class="kokurikuler-semester">SEMESTER 2 :</div>
          <div class="kokurikuler-box">${p5.catatanSem2 ? escBr(p5.catatanSem2) : '-'}</div>
        </div>
      </div>
    `;

    return printContent;
  },

  generate(studentData, akademikData) {
    const html = this.buildHTML(studentData, akademikData);
    const filename = studentData.nama.replace(/\s+/g, '_') + '_Buku_Induk.doc';
    this.downloadAsWord(html, filename);
  },

  generateBatch(allHTML) {
    this.downloadAsWord(allHTML, 'Buku_Induk_Kelas.doc');
  },

  downloadAsWord(bodyContent, filename) {
    const fullHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:AutoHyphenation/><w:HyphenationZone>360</w:HyphenationZone></w:WordDocument></xml><![endif]-->
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Arial Narrow', Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #000; padding: 4px 6px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
        th { text-align: center; font-weight: bold; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        .page-break { page-break-before: always; }
        .status-active { font-weight: bold; }
        .status-inactive { text-decoration: line-through; color: #666; }
        .print-document { line-height: 1.4; }
        .print-header { page-break-after: avoid; break-after: avoid; }
        .print-header h1 { font-size: 11pt; font-weight: bold; margin-bottom: 16px; page-break-after: avoid; break-after: avoid; }
        .print-student-info { margin-bottom: 16px; font-weight: bold; page-break-after: avoid; break-after: avoid; }
        .label-underline { font-weight: bold; }
        .print-info-table { margin-bottom: 0; }
        .print-info-table td { padding: 4px 8px; }
        .print-info-table .col-no { width: 40px; text-align: center; vertical-align: middle; font-weight: bold; }
        .print-info-table .col-label { font-weight: bold; width: 250px; }
        .print-info-table .col-sem { text-align: center; font-weight: bold; }
        .print-table { width: 100%; margin-bottom: 0; table-layout: fixed; }
        .print-section { margin-top: 20px; }
        .print-table thead { display: table-header-group; }
        tr { page-break-inside: avoid; break-inside: avoid; }
        .print-section-title { font-weight: bold; margin-bottom: 8px; page-break-after: avoid; break-after: avoid; }
        .print-section-title-no-underline { font-weight: bold; margin-bottom: 8px; page-break-after: avoid; break-after: avoid; }
        .desc-cell { text-align: justify; text-justify: inter-word; font-size: 11pt; }
        .signature-cell { width: 120px; height: 80px; vertical-align: bottom; }
        .kokurikuler-header { border: 1px solid #000; text-align: center; font-weight: bold; padding: 10px; margin-bottom: 24px; font-size: 11pt; }
        .kokurikuler-semester { font-weight: bold; margin-bottom: 8px; margin-top: 20px; }
        .kokurikuler-box { border: 1px solid #000; padding: 12px; margin-bottom: 12px; min-height: 130px; line-height: 1.6; }
      </style>
    </head>
    <body>${bodyContent}</body>
    </html>`;
    const blob = new Blob(['\ufeff' + fullHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
