declare const menu: HTMLDivElement;
declare const contentBox: HTMLDivElement;

window.addEventListener('load', () => {
  prepareEditor(contentBox);
  contents(contentBox);
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    (async () => {
      const {active: worker} = await navigator.serviceWorker.register(
        './sw.js'
      );
      if (worker) {
        window.addEventListener(
          'keydown',
          ev => {
            if (!ev.ctrlKey && !ev.altKey && ev.key === 'F5') {
              worker.postMessage({type: 'cache-clear'});
            }
          },
          true
        );
      }
    })();
  }
});
