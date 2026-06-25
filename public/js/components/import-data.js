// Import Data Component
const ImportData = {
  parsedData: null,
  importType: 'siswa',
  fileName: '',

  init() {
    this.render();
  },

  render() {
    const page = document.getElementById('page-import-data');
    page.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Import Data</h2>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Upload File</h3>
        </div>
        <div class="import-section">
          <div class="form-group">
            <label>Jenis Data yang Diimport</label>
            <select id="import-type" onchange="ImportData.importType = this.value">
              <option value="siswa">Data Siswa (Nama, NIS, NISN)</option>
              <option value="nilai">Nilai (NIS, Mapel, Nilai Sem 1, Nilai Sem 2, Desc Sem 1, Desc Sem 2)</option>
              <option value="akademik">Data Akademik (NIS, Tahun Pelajaran, Kelas, Wali Kelas, Status)</option>
              <option value="nonakademik">Ekskul & Absensi</option>
            </select>
          </div>

          <div class="upload-area" id="upload-area" 
               ondragover="ImportData.handleDragOver(event)" 
               ondrop="ImportData.handleDrop(event)"
               ondragleave="ImportData.handleDragLeave(event)">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p class="upload-text">Drag & drop file CSV di sini</p>
            <p class="upload-hint">atau</p>
            <label class="btn btn-outline upload-btn">
              Pilih File
              <input type="file" accept=".csv,.xlsx,.xls" onchange="ImportData.handleFileSelect(event)" style="display:none;">
            </label>
            <p class="upload-format">Format yang didukung: CSV, XLSX</p>
            ${this.fileName ? `<p class="upload-filename">File: ${this.fileName}</p>` : ''}
          </div>
        </div>
      </div>

      ${this.parsedData ? this.renderPreview() : ''}
      
      <div id="import-results"></div>
    `;
  },

  renderPreview() {
    const data = this.parsedData;
    if (!data || data.length === 0) return '<div class="card"><p>Tidak ada data yang bisa dibaca.</p></div>';

    const headers = Object.keys(data[0]);
    const preview = data.slice(0, 10);

    return `
      <div class="card" style="margin-top:16px;">
        <div class="card-header">
          <h3>Preview Data (${data.length} baris)</h3>
          <button class="btn btn-primary" onclick="ImportData.doImport()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 16 12 12 8 16"></polyline>
              <line x1="12" y1="12" x2="12" y2="21"></line>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
            </svg>
            Import ${data.length} Data
          </button>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${preview.map(row => `
                <tr>
                  ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
                </tr>
              `).join('')}
              ${data.length > 10 ? `<tr><td colspan="${headers.length}" class="muted" style="text-align:center;">... dan ${data.length - 10} baris lainnya</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  handleDragOver(event) {
    event.preventDefault();
    document.getElementById('upload-area').classList.add('drag-over');
  },

  handleDragLeave(event) {
    event.preventDefault();
    document.getElementById('upload-area').classList.remove('drag-over');
  },

  handleDrop(event) {
    event.preventDefault();
    document.getElementById('upload-area').classList.remove('drag-over');
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  },

  handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  },

  processFile(file) {
    this.fileName = file.name;
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      XLSXParser.parse(file).then(data => {
        if (data) {
          this.parsedData = data;
          this.render();
        }
      }).catch(() => {
        alert('Untuk file Excel (.xlsx), disarankan simpan sebagai CSV terlebih dahulu lalu upload ulang.');
        this.render();
      });
    } else if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        this.parsedData = CSVParser.parse(text);
        this.render();
      };
      reader.readAsText(file);
    } else {
      alert('Format file tidak didukung. Gunakan CSV atau XLSX.');
    }
  },

  async doImport() {
    if (!this.parsedData || this.parsedData.length === 0) {
      alert('Tidak ada data untuk diimport.');
      return;
    }

    const resultsDiv = document.getElementById('import-results');
    resultsDiv.innerHTML = '<div class="card"><p>Mengimport data...</p><div class="progress-bar"><div class="progress-fill" id="import-progress" style="width:0%"></div></div></div>';

    try {
      let results;
      switch (this.importType) {
        case 'siswa':
          results = await this.importSiswa();
          break;
        case 'nilai':
          results = await this.importNilai();
          break;
        case 'akademik':
          results = await this.importAkademik();
          break;
        case 'nonakademik':
          results = await this.importNonAkademik();
          break;
        default:
          results = { success: 0, failed: 0, errors: [] };
      }

      resultsDiv.innerHTML = `
        <div class="card" style="margin-top:16px;">
          <div class="card-header"><h3>Hasil Import</h3></div>
          <div class="import-results-summary">
            <div class="result-item success">
              <strong>${results.success}</strong> berhasil
            </div>
            <div class="result-item failed">
              <strong>${results.failed}</strong> gagal
            </div>
          </div>
          ${results.errors.length > 0 ? `
            <div class="error-list">
              <h4>Detail Error:</h4>
              <ul>
                ${results.errors.slice(0, 10).map(e => `<li>${JSON.stringify(e)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    } catch (e) {
      resultsDiv.innerHTML = `<div class="card"><p class="error">Import gagal: ${e.message}</p></div>`;
    }
  },

  async importSiswa() {
    const results = { success: 0, failed: 0, errors: [] };
    for (const row of this.parsedData) {
      const nama = row['Nama'] || row['nama'] || row['NAMA'] || row['Nama Peserta Didik'] || '';
      const nis = row['NIS'] || row['nis'] || '';
      const nisn = row['NISN'] || row['nisn'] || '';

      if (!nama || !nis) {
        results.failed++;
        results.errors.push({ row, error: 'Nama atau NIS kosong' });
        continue;
      }

      try {
        await DB.addSiswa({ nama: nama.trim(), nis: nis.toString().trim(), nisn: nisn.toString().trim() });
        results.success++;
      } catch (e) {
        try {
          await DB.updateSiswa({ nama: nama.trim(), nis: nis.toString().trim(), nisn: nisn.toString().trim() });
          results.success++;
        } catch (e2) {
          results.failed++;
          results.errors.push({ row, error: e2.message });
        }
      }
    }
    return results;
  },

  async importAkademik() {
    const results = { success: 0, failed: 0, errors: [] };
    for (const row of this.parsedData) {
      const nis = (row['NIS'] || row['nis'] || '').toString().trim();
      const tp = row['Tahun Pelajaran'] || row['tahunPelajaran'] || row['TP'] || '';
      const kelas = row['Kelas'] || row['kelas'] || '';
      const wali = row['Wali Kelas'] || row['waliKelas'] || '';
      const status = row['Status'] || row['status'] || '';

      if (!nis || !tp) {
        results.failed++;
        results.errors.push({ row, error: 'NIS atau Tahun Pelajaran kosong' });
        continue;
      }

      try {
        await DB.addAkademik({ nis, tahunPelajaran: tp, kelas, waliKelas: wali, status });
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push({ row, error: e.message });
      }
    }
    return results;
  },

  async importNilai() {
    const results = { success: 0, failed: 0, errors: [] };
    for (const row of this.parsedData) {
      const nis = (row['NIS'] || row['nis'] || '').toString().trim();
      const mapel = row['Mata Pelajaran'] || row['mapel'] || row['Mapel'] || '';
      const nilaiSem1 = parseInt(row['Nilai Sem 1'] || row['nilaiSem1'] || row['Nilai Akhir Semester 1'] || '0');
      const nilaiSem2 = parseInt(row['Nilai Sem 2'] || row['nilaiSem2'] || row['Nilai Akhir Semester 2'] || '0');
      const deskSem1 = row['Deskripsi Sem 1'] || row['deskSem1'] || row['Catatan Semester 1'] || '';
      const deskSem2 = row['Deskripsi Sem 2'] || row['deskSem2'] || row['Catatan Semester 2'] || '';

      if (!nis || !mapel) {
        results.failed++;
        results.errors.push({ row, error: 'NIS atau Mapel kosong' });
        continue;
      }

      // Find the latest akademik for this student
      const akademikRecords = await DB.getAkademikBySiswa(nis);
      if (akademikRecords.length === 0) {
        results.failed++;
        results.errors.push({ row, error: 'Data akademik tidak ditemukan untuk NIS: ' + nis });
        continue;
      }

      const latestAkad = akademikRecords[akademikRecords.length - 1];
      try {
        await DB.addNilai({
          akademikId: latestAkad.id,
          mapel,
          nilaiSem1: nilaiSem1 || null,
          nilaiSem2: nilaiSem2 || null,
          deskSem1,
          deskSem2,
        });
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push({ row, error: e.message });
      }
    }
    return results;
  },

  async importNonAkademik() {
    const results = { success: 0, failed: 0, errors: [] };
    for (const row of this.parsedData) {
      const nis = (row['NIS'] || row['nis'] || '').toString().trim();

      if (!nis) {
        results.failed++;
        results.errors.push({ row, error: 'NIS kosong' });
        continue;
      }

      const akademikRecords = await DB.getAkademikBySiswa(nis);
      if (akademikRecords.length === 0) {
        results.failed++;
        results.errors.push({ row, error: 'Data akademik tidak ditemukan untuk NIS: ' + nis });
        continue;
      }

      const latestAkad = akademikRecords[akademikRecords.length - 1];
      try {
        await DB.addNonAkademik({
          akademikId: latestAkad.id,
          ekskulKegiatan1: row['Ekskul Sem 1'] || row['ekskulKegiatan1'] || '',
          ekskulKet1: row['Ket Sem 1'] || row['ekskulKet1'] || '',
          ekskulKegiatan2: row['Ekskul Sem 2'] || row['ekskulKegiatan2'] || '',
          ekskulKet2: row['Ket Sem 2'] || row['ekskulKet2'] || '',
          sakit1: parseInt(row['Sakit Sem 1'] || '0') || 0,
          izin1: parseInt(row['Izin Sem 1'] || '0') || 0,
          alpha1: parseInt(row['Alpha Sem 1'] || '0') || 0,
          sakit2: parseInt(row['Sakit Sem 2'] || '0') || 0,
          izin2: parseInt(row['Izin Sem 2'] || '0') || 0,
          alpha2: parseInt(row['Alpha Sem 2'] || '0') || 0,
        });
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push({ row, error: e.message });
      }
    }
    return results;
  }
};
