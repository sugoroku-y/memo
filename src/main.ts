declare const menu: HTMLDivElement;
declare const contentBox: HTMLDivElement;
let worker: ServiceWorker | null | undefined;

window.addEventListener('load', () => {
  prepareEditor(contentBox);
  contents(contentBox);
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    (async () => {
      worker = (await navigator.serviceWorker.register('./sw.js')).active;
      if (worker) {
        const w = worker;
        window.addEventListener(
          'keydown',
          ev => {
            if (!ev.ctrlKey && !ev.altKey && ev.key === 'F5') {
              w.postMessage({type: 'cache-clear'});
            }
          },
          true
        );
      }
    })();
  }
});
