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

function isBeginningOfLine(node: Node): boolean {
  if (!node.previousSibling) {
    return true;
  }
  const element = asElement(node.previousSibling);
  if (!element) {
    return false;
  }
  if (element.localName === 'br') {
    return true;
  }
  const style = window.getComputedStyle(element);
  if (!style.display.startsWith('inline')) {
    return true;
  }
  return false;
}

function isEndOfLine(node: Node): boolean {
  if (!node.nextSibling) {
    return true;
  }
  const element = asElement(node.nextSibling);
  if (!element) {
    return false;
  }
  if (element.localName === 'br') {
    return true;
  }
  const style = window.getComputedStyle(element);
  if (!style.display.startsWith('inline')) {
    return true;
  }
  return false;
}

function dialog(
  options?: ElementOptions
): (template: TemplateStringsArray, ...values: unknown[]) => HTMLDialogElement {
  return (...args) => {
    const dialog = element(
      'dialog',
      options
    )/* html */ `<form method="dialog"></form>`;
    dialog.firstElementChild!.innerHTML = args[0].reduce(
      (r, e, i) => `${r}${args[i]}${e}`
    );
    return dialog;
  };
}

interface ElementOptions {
  classList?: string | string[];
  data?: Record<string, string>;
  attributes?: Record<string, string>;
}

function element<N extends keyof HTMLElementTagNameMap>(
  name: N,
  options?: ElementOptions
): (...args: [TemplateStringsArray, ...unknown[]]) => HTMLElementTagNameMap[N] {
  return (...args) => {
    const e = document.createElement(name);
    if (options?.classList) {
      e.classList.add(
        ...(Array.isArray(options.classList)
          ? options.classList
          : [options.classList])
      );
    }
    if (options?.data) {
      for (const [name, value] of Object.entries(options.data)) {
        e.setAttribute(`data-${name}`, value);
      }
    }
    if (options?.attributes) {
      for (const [name, value] of Object.entries(options.attributes)) {
        e.setAttribute(name, value);
      }
    }
    const TABLE = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    } as const;
    e.innerHTML = args[0].reduce(
      (r, e, i) =>
        `${r}${String(args[i]).replace(
          /[&<>"]/g,
          ch => TABLE[ch as keyof typeof TABLE]
        )}${e}`
    );
    return e;
  };
}
