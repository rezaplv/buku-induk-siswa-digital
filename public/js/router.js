// Simple SPA Router - show/hide page sections
const Router = {
  currentPage: 'dashboard',
  currentParams: {},

  pages: ['dashboard', 'student-detail', 'import-data'],

  navigateTo(page, params = {}) {
    this.currentPage = page;
    this.currentParams = params;

    // Hide all pages
    this.pages.forEach(p => {
      const el = document.getElementById('page-' + p);
      if (el) el.style.display = 'none';
    });

    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) target.style.display = 'block';

    // Update active sidebar item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) item.classList.add('active');
    });

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('page-change', {
      detail: { page, params }
    }));
  },

  getCurrentPage() {
    return this.currentPage;
  },

  getParams() {
    return this.currentParams;
  }
};
