function asText(node: Node | null | undefined): Text | undefined {
  return node?.nodeType === Node.TEXT_NODE ? (node as Text) : undefined;
}

function asElement(node: Node | null | undefined): Element | undefined {
  return node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : undefined;
}

function ensureElement(node: Node | null | undefined): Element | undefined {
  return asText(node)?.parentElement ?? asElement(node);
}

function* ancestors(node: Node | null | undefined) {
  for (; node; node = node.parentNode) {
    yield node;
  }
}