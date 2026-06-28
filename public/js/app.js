// Main Application Entry Point - Buku Induk Siswa Digital
(async function() {
  try {
    await DB.init();
    console.log('Database initialized successfully');
  } catch (e) {
    console.error('Failed to initialize database:', e);
    document.body.innerHTML = '<div style="padding:40px;text-align:center;"><h2>Error</h2><p>Gagal menginisialisasi database. Pastikan browser mendukung IndexedDB.</p></div>';
    return;
  }

  if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    return; // Login screen sudah visible by default (HTML display:flex)
  }
  showApp();

  // Load custom mapel from localStorage
  const storedMapel = localStorage.getItem('mapelList');
  if (storedMapel) {
    const parsed = JSON.parse(storedMapel);
    MATA_PELAJARAN.length = 0;
    parsed.forEach(m => MATA_PELAJARAN.push(m));
  }

  // Render sidebar
  Sidebar.render();

  // Listen for page changes
  window.addEventListener('page-change', async (event) => {
    const { page, params } = event.detail;

    switch (page) {
      case 'dashboard':
        await Dashboard.init();
        break;
      case 'input-data':
        await InputData.init();
        break;
      case 'student-detail':
        if (params && params.nis) {
          await StudentDetail.init(params.nis);
        }
        break;
      case 'data-akademik':
        DataAkademik.init();
        break;
      case 'input-nilai':
        await InputNilai.init();
        break;
      case 'ekstrakurikuler':
        await Ekstrakurikuler.init();
        break;
      case 'ketidakhadiran':
        await Ketidakhadiran.init();
        break;
      case 'status-wali':
        await StatusWali.init();
        break;
      case 'kokurikuler':
        await Kokurikuler.init();
        break;
      case 'cetak-buku-induk':
        await CetakBukuInduk.init();
        break;

      case 'reset-data':
        ResetData.init();
        break;
    }
  });

  // Initialize with dashboard
  Router.navigateTo('dashboard');
})();
