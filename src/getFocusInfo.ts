function getFocusInfo() {
  const {focusNode, focusOffset} = getSelection() ?? {};
  const indices = [];
  for (let node = focusNode; node && node !== contentBox; node = node.parentElement) {
    if (!node) {
      indices.length = 0;
      break;
    }
    const index = node.parentElement?.childNodes
      .entries()
      .find(([, child]) => child === node)?.[0];
    if (index === undefined) {
      break;
    }
    indices.push(index);
  }
  return indices.length > 0 ? [focusOffset, ...indices.reverse()] : null;
}
