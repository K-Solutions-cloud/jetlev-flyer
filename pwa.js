(() => {
  if (typeof __JETLEV_PRODUCTION__ === 'undefined') return;
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })
      .catch(error => console.warn('Offline-Modus derzeit nicht verfügbar:', error));
  });
})();
