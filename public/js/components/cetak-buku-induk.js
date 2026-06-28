// Cetak Buku Induk Component - Print student report per student or entire class
const CetakBukuInduk = {
  students: [],
  allAkademik: [],
  selectedTP: '',
  selectedKelas: '',
  selectedNIS: '',

  async init() {
    this.students = await DB.getAllSiswa();
    this.allAkademik = await DB.getAllAkademik();
    this.selectedTP = '';
    this.selectedKelas = '';
    this.selectedNIS = '';
    this.render();
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
    this.selectedNIS = '';
    this.render();
  },

  onKelasChange(val) {
    this.selectedKelas = val;
    this.selectedNIS = '';
    this.render();
  },

  onSiswaChange(val) {
    this.selectedNIS = val;
  },

  render() {
    const page = document.getElementById('page-cetak-buku-induk');
    const tpList = this.getTPList();
    const kelasList = this.getKelasList();
    const studentList = this.getStudentsInClass();
    const showOptions = this.selectedTP && this.selectedKelas && studentList.length > 0;

    page.innerHTML = '<div class="page-header"><h2 class="page-title">Cetak Buku Induk</h2></div>' +
      '<div class="card" style="margin-bottom:16px;">' +
        '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">' +
          '<div class="form-group" style="margin-bottom:0;min-width:200px;">' +
            '<label>Tahun Pelajaran</label>' +
            '<select onchange="CetakBukuInduk.onTPChange(this.value)">' +
              '<option value="">-- Pilih TP --</option>' +
              tpList.map(function(tp) { return '<option value="' + escapeHTMLDash(tp) + '"' + (CetakBukuInduk.selectedTP === tp ? ' selected' : '') + '>' + escapeHTMLDash(tp) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:0;min-width:200px;">' +
            '<label>Kelas</label>' +
            '<select onchange="CetakBukuInduk.onKelasChange(this.value)"' + (!this.selectedTP ? ' disabled' : '') + '>' +
              '<option value="">-- Pilih Kelas --</option>' +
              kelasList.map(function(k) { return '<option value="' + escapeHTMLDash(k) + '"' + (CetakBukuInduk.selectedKelas === k ? ' selected' : '') + '>' + escapeHTMLDash(k) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (showOptions ? this.renderOptions(studentList) : (this.selectedTP && this.selectedKelas && studentList.length === 0 ? '<div class="card"><p class="muted">Tidak ada siswa di kelas ini.</p></div>' : '<div class="card"><p class="muted">Pilih Tahun Pelajaran dan Kelas untuk melihat opsi cetak.</p></div>'));
  },

  renderOptions(studentList) {
    var count = studentList.length;
    var kelasLabel = escapeHTMLDash(this.selectedKelas);
    return '<div class="card" style="margin-bottom:16px;">' +
      '<h3 class="section-title">Opsi 1: Cetak Per Siswa</h3>' +
      '<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">' +
        '<div class="form-group" style="margin-bottom:0;min-width:250px;flex:1;">' +
          '<label>Pilih Siswa</label>' +
          '<select id="cetak-pilih-siswa" onchange="CetakBukuInduk.onSiswaChange(this.value)">' +
            '<option value="">-- Pilih Siswa --</option>' +
            studentList.map(function(s) { return '<option value="' + escapeHTMLDash(s.nis) + '"' + (CetakBukuInduk.selectedNIS === s.nis ? ' selected' : '') + '>' + escapeHTMLDash(s.nama) + ' (' + escapeHTMLDash(s.nis) + ')</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<button class="btn btn-primary" onclick="CetakBukuInduk.cetakPerSiswa()">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>' +
          ' Cetak Siswa Ini</button>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<h3 class="section-title">Opsi 2: Cetak Seluruh Kelas</h3>' +
      '<p class="muted" style="margin-bottom:12px;">Semua siswa di kelas ini akan dicetak dalam satu dokumen, dipisah page-break per siswa.</p>' +
      '<button class="btn btn-primary" onclick="CetakBukuInduk.cetakSeluruhKelas()">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>' +
        ' Cetak Semua Siswa di ' + kelasLabel + ' (' + count + ' siswa)</button>' +
    '</div>';
  },

  async cetakPerSiswa() {
    var nis = this.selectedNIS || (document.getElementById('cetak-pilih-siswa') ? document.getElementById('cetak-pilih-siswa').value : '');
    if (!nis) { alert('Pilih siswa terlebih dahulu!'); return; }
    var completeData = await DB.getCompleteStudentData(nis);
    if (!completeData) { alert('Data siswa tidak ditemukan!'); return; }
    var akad = completeData.akademik.find(function(a) { return a.tahunPelajaran === CetakBukuInduk.selectedTP && a.kelas === CetakBukuInduk.selectedKelas; });
    if (!akad) { alert('Data akademik tidak ditemukan untuk TP dan Kelas yang dipilih!'); return; }
    PDFGenerator.generate(completeData, akad);
  },

  async cetakSeluruhKelas() {
    var studentList = this.getStudentsInClass();
    if (studentList.length === 0) { alert('Tidak ada siswa di kelas ini!'); return; }
    var allHTML = '';
    for (var i = 0; i < studentList.length; i++) {
      var s = studentList[i];
      var completeData = await DB.getCompleteStudentData(s.nis);
      if (!completeData) continue;
      var akad = completeData.akademik.find(function(a) { return a.tahunPelajaran === CetakBukuInduk.selectedTP && a.kelas === CetakBukuInduk.selectedKelas; });
      if (!akad) continue;
      var html = PDFGenerator.buildHTML(completeData, akad);
      if (i > 0) {
        allHTML += '<div class="page-break"></div>';
      }
      allHTML += html;
    }
    if (!allHTML) { alert('Tidak ada data yang bisa dicetak!'); return; }
    document.getElementById('print-area').innerHTML = allHTML;
    window.print();
  }
};
