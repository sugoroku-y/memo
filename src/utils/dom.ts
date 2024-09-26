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

function* safeChildren(parent: Element | null) {
  if (!parent) {
    return;
  }
  yield* safeSiblings(parent.firstChild);
}

function* safeSiblings(first: Node | null | undefined, last?: Node) {
  for (
    let sibling = first, next: Node | null;
    sibling && sibling !== last;
    sibling = next
  ) {
    next = sibling.nextSibling;
    yield sibling;
  }
}

function replace(to: Element, withE: Element): Element {
  for (const child of safeChildren(withE)) {
    to.append(child);
  }
  withE.replaceWith(to);
  return to;
}

function expand(element: Element) {
  for (const child of safeChildren(element)) {
    element.before(child);
  }
  element.remove();
}
