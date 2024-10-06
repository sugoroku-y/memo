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
    root.innerHTML = /* html */ `
      <h1># [${formatDate('YYYY-MM-DD hh:mm')}] memo<h1>
      <div><br/></div>
    `.replace(/(?<=^|>)\s+(?=<|$)/g, '');
    const br = root.querySelector('br')!;
    getSelection()?.setPosition(br.parentElement, 0);
  }
  root.focus();
}
