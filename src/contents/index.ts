function contents(root: HTMLDivElement) {
  new MutationObserver(_mutations => {
    (async () => {
      const data = getFocusInfo(root);
      const encoded = await encodeHash(root.innerHTML);
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
  }).observe(root, {
    characterData: true,
    childList: true,
    attributes: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true,
  });

  window.addEventListener('popstate', () => {
    void applyHash(root);
  });
  applyHash(root);
}
