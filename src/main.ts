declare const contentBox: HTMLDivElement;

window.addEventListener('load', () => {
  prepareEditor(contentBox);
  contents(contentBox);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/memo/sw.js');
  }
});
