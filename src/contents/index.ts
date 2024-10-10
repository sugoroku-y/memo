function contents(root: HTMLDivElement) {
  new MutationObserver(_mutations => {
    (async () => {
      try {
        const data = getFocusInfo(root);
        const encoded = await encodeHash(await keyPromise, root.innerHTML);
        if (location.hash.slice(1) === encoded) {
          return;
        }
        const url = `${location.pathname}#${encoded}`;
        if (location.hash) {
          history.pushState(data, '', url);
        } else {
          history.replaceState(data, '', url);
        }
        if (documentId && modifiedSinceSaving) {
          saveDocument(documentId, encoded);
        }
      } finally {
        modifiedSinceSaving = true;
      }
    })();
  }).observe(root, {
    characterData: true,
    childList: true,
    attributes: true,
    subtree: true,
  });

  window.addEventListener('popstate', () => {
    void applyHash(root);
  });
  if (new URLSearchParams(location.search).has('open')) {
    openDocumentDialog()
  } else {
    applyHash(root);
  }
}
