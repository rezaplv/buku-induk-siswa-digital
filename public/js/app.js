// Main Application Entry Point - Buku Induk Siswa Digital
(async function() {
  // Initialize database
  try {
    await DB.init();
    console.log('Database initialized successfully');
  } catch (e) {
    console.error('Failed to initialize database:', e);
    document.body.innerHTML = '<div style="padding:40px;text-align:center;"><h2>Error</h2><p>Gagal menginisialisasi database. Pastikan browser mendukung IndexedDB.</p></div>';
    return;
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
      case 'import-data-file':
        ImportData.init();
        break;
    }
  });

  // Initialize with dashboard
  Router.navigateTo('dashboard');
})();
