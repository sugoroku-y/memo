declare const contentBox: HTMLDivElement;

window.addEventListener('load', () => {
  new MutationObserver(_mutations => {
    (async () => {
      const data = getFocusInfo(contentBox);
      const encoded = await encodeHash(contentBox.innerHTML);
      if (location.hash.slice(1) === encoded) {
        return;
      }
      const url = `${location.pathname}#${encoded}`;
      if (location.hash) {
        history.pushState(data, '', url);
      } else {
        history.replaceState(data, '', url);
      }
    })();
  }).observe(contentBox, {
    characterData: true,
    childList: true,
    attributes: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true,
  });
  window.addEventListener('popstate', () => {
    void applyHash(contentBox);
  });
  applyHash(contentBox);
});
