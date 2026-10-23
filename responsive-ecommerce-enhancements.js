// Add this to the end of each HTML page after auth.js and cart.js
// Keeps the same design but improves mobile ecommerce behavior

document.addEventListener('DOMContentLoaded', function () {
  // Keep mobile drawer working smoothly
  const drawerOpenBtn = document.getElementById('drawerOpenBtn');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const sideDrawer = document.getElementById('sideDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');

  function openDrawer() {
    if (sideDrawer) sideDrawer.classList.add('open');
    if (drawerBackdrop) drawerBackdrop.classList.add('open');
    document.body.classList.add('drawer-open');
    if (drawerOpenBtn) drawerOpenBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    if (sideDrawer) sideDrawer.classList.remove('open');
    if (drawerBackdrop) drawerBackdrop.classList.remove('open');
    document.body.classList.remove('drawer-open');
    if (drawerOpenBtn) drawerOpenBtn.setAttribute('aria-expanded', 'false');
  }

  if (drawerOpenBtn) drawerOpenBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.getElementById('authModal') && document.getElementById('authModal').classList.contains('open')) {
        closeAuthModal();
      } else if (sideDrawer && sideDrawer.classList.contains('open')) {
        closeDrawer();
      }
    }
  });

  // Make product and cart areas feel more ecommerce-like on mobile
  const cartBox = document.getElementById('cartBox');
  if (window.innerWidth <= 768 && cartBox) {
    cartBox.style.position = 'sticky';
    cartBox.style.bottom = '12px';
    cartBox.style.top = '72px';
    cartBox.style.zIndex = '10';
  }

  // Keep nav auth slot synchronized across all pages
  if (typeof updateNavAuthUI === 'function') {
    updateNavAuthUI();
  }
});
