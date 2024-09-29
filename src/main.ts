declare const contentBox: HTMLDivElement;

window.addEventListener('load', () => {
  let rr: ServiceWorkerRegistration | undefined;
  prepareEditor(contentBox);
  contents(contentBox);
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').then((r) => {
      rr = r;
    });
  }
  window.addEventListener('keydown', (ev) => {
    if (!ev.ctrlKey && !ev.altKey && ev.key === 'F5') {
      rr?.active?.postMessage({type: 'cache-clear'});
    }
  }, true);
});
