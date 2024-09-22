function restoreFocusInfo() {
  if (!Array.isArray(history.state)) {
    return undefined;
  }
  const [offset, ...indices] = history.state;
  let node: Node = contentBox;
  for (const index of indices) {
    node = node.childNodes[index];
    if (!node) {
      return undefined;
    }
  }
  return {node, offset};
}
