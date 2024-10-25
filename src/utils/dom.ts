function asText(node: Node | null | undefined): Text | undefined {
  return node?.nodeType === Node.TEXT_NODE ? (node as Text) : undefined;
}

function asElement(node: Node | null | undefined): Element | undefined {
  return node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : undefined;
}

function closest<K extends string>(node: Node | null | undefined, selector: K) {
  return (
    (asText(node)?.parentElement ?? asElement(node))?.closest(selector) ??
    undefined
  );
}

function* ancestors(start: Node | null | undefined) {
  for (
    let node = asText(start)?.parentElement ?? asElement(start) ?? null;
    node;
    node = node.parentElement
  ) {
    yield node;
  }
}

function* safeSiblings(first: Node | null | undefined, last?: Node | null) {
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
  to.append(...withE.childNodes);
  withE.replaceWith(to);
  return to;
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
    return (
      asText(node.nextSibling)?.data === '' && isEndOfLine(node.nextSibling)
    );
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

type ENTITY_CHARS = '&' | '<' | '>' | '"';

function entityize(s: string): string {
  return s.replace(entityize.RE, ch => entityize.TABLE[ch as ENTITY_CHARS]);
}

entityize.TABLE = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
} satisfies Record<ENTITY_CHARS, string>;
entityize.RE = new RegExp(`[${Object.keys(entityize.TABLE).join('')}]`, 'g');

function html(template: TemplateStringsArray, ...values: unknown[]): string {
  return ''.concat(
    ...(function* () {
      const valueIterator = values[Symbol.iterator]();
      for (const e of template) {
        yield e.replace(/(?<=^|>)\s+|\s+(?=<|$)/g, '');
        const {value, done} = valueIterator.next();
        if (done) {
          break;
        }
        if (value == null) {
          // nullやundefinedは無視
          continue;
        }
        yield entityize(String(value));
      }
    })()
  );
}

type Equal<A, B> = (<T>() => T extends A ? 1 : 0) extends <T>() => T extends B
  ? 1
  : 0
  ? true
  : false;
type IsReadonly<T, K extends keyof T> = Equal<Pick<T, K>, Readonly<Pick<T, K>>>;

interface ElementOptions<N extends keyof HTMLElementTagNameMap> {
  classList?: string | string[];
  data?: Record<string, string>;
  attributes?: Record<string, string>;
  properties?: {
    [Key in keyof HTMLElementTagNameMap[N] as IsReadonly<
      HTMLElementTagNameMap[N],
      Key
    > extends true
      ? never
      : Key]?: HTMLElementTagNameMap[N][Key];
  };
  listeners?: {
    [Type in keyof HTMLElementEventMap]?:
      | ((ev: HTMLElementEventMap[Type]) => void)
      | [
          (ev: HTMLElementEventMap[Type]) => void,
          boolean | AddEventListenerOptions
        ];
  };
}

function element<N extends keyof HTMLElementTagNameMap>(
  name: N,
  options?: ElementOptions<N>
) {
  return (...args: [TemplateStringsArray, ...unknown[]]) => {
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
    if (options?.properties) {
      for (const [name, value] of Object.entries(options.properties)) {
        e[name as keyof typeof e] = value;
      }
    }
    if (options?.listeners) {
      for (const [type, listener] of Object.entries(options.listeners)) {
        const rest: [
          listener: EventListener,
          options?: boolean | AddEventListenerOptions
        ] =
          typeof listener === 'function'
            ? [listener as EventListener]
            : (listener as [EventListener, boolean | AddEventListenerOptions]);
        e.addEventListener(type, ...rest);
      }
    }
    e.innerHTML = html(...args);
    return e;
  };
}

function dialog(
  options?: ElementOptions<'dialog'> & {title?: string; closeable?: boolean}
) {
  return (...args: [TemplateStringsArray, ...unknown[]]) => {
    const dialog = element('dialog', options)``;
    dialog.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape') {
        // Escape以外はそのまま
        return;
      }
      if (options?.closeable) {
        const cancels = dialog.querySelectorAll('button[value=cancel]');
        if ([...cancels].some(cancel => !cancel.disabled)) {
          // キャンセルボタンが存在していずれかのキャンセルボタンが無効でなければEscapeキーを無効化しない
          return;
        }
      }
      // Escapeキーを無効化
      ev.preventDefault();
    });
    const title = element('div', {classList: 'title'})`${options?.title}`;
    dialog.append(title);
    if (options?.closeable) {
      const button = element('button', {
        properties: {value: 'cancel', tabIndex: -1, title: '閉じる'},
      })``;
      button.addEventListener('click', () => dialog.close('cancel')),
        title.append(button);
    }
    dialog.append(element('form', {properties: {method: 'dialog'}})(...args));
    return dialog;
  };
}

function showModal(dialog: HTMLDialogElement) {
  document.body.append(dialog);
  dialog.showModal();
  return new Promise<string>(resolve => {
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue);
      dialog.remove();
    });
  });
}
