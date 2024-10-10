function restoreFocusInfo(root: HTMLDivElement) {
  if (!Array.isArray(history.state)) {
    return undefined;
  }
  const [offset, ...indices] = history.state;
  let node: Node = root;
  for (const index of indices) {
    node = node.childNodes[index];
    if (!node) {
      return undefined;
    }
  }
  return {
    node,
    offset:
      node?.nodeType === Node.TEXT_NODE
        ? Math.min(offset, (node as Text).data.length)
        : 0,
  };
}
