function applyFocusInfo() {
  const sel = getSelection();
  if (!sel) {
    return;
  }
  const {node, offset: _offset} = restoreFocusInfo() ?? {
    node: document.querySelector('h1 ~ *') ?? contentBox.firstChild,
    offset: 0,
  };
  const offset = node?.nodeType === Node.TEXT_NODE
    ? Math.min(_offset, (node as Text).data.length)
    : 0;
  sel.setPosition(node, offset);
}
