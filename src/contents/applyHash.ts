async function applyHash(root: HTMLDivElement) {
  const encoded = location.hash.slice(1);
  if (encoded) {
    root.innerHTML = await decodeHash(encoded);
    const sel = getSelection();
    if (sel) {
      const {node, offset} = restoreFocusInfo(root) ?? {
        node: document.querySelector('h1 ~ *') ?? root.firstChild,
        offset: 0,
      };
      sel.setPosition(node, offset);
    }
  } else {
    root.appendChild(document.createElement('h1')).textContent = `[${formatDate('YYYY-MM-DD hh:mm')}] memo`
    const br = root
      .appendChild(document.createElement('div'))
      .appendChild(document.createElement('br'));
    getSelection()?.setPosition(br.parentElement, 0);
  }
  root.focus();
}
