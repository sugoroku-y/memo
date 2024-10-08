function getFocusInfo(root: HTMLDivElement) {
  const {focusNode, focusOffset} = getSelection() ?? {};
  const indices = [];
  for (let node = focusNode; node && node !== root; node = node.parentElement) {
    if (!node) {
      indices.length = 0;
      break;
    }
    const index = indexOf(node.parentElement?.childNodes, node);
    if (index === undefined) {
      break;
    }
    indices.push(index);
  }
  return indices.length > 0 ? [focusOffset, ...indices.reverse()] : null;
}
