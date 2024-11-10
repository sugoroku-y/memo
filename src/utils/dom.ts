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

let cache: {
  table: Record<ENTITY_CHARS, string>;
  pattern: RegExp;
};
function entityize(s: string): string {
  cache ??= (() => {
    const table = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    } satisfies Readonly<Record<ENTITY_CHARS, string>>;
    const pattern = new RegExp(`[${Object.keys(table).join('')}]`, 'g');
    return {table, pattern};
  })();
  return s.replace(cache.pattern, ch => cache.table[ch as ENTITY_CHARS]);
}

function html(template: TemplateStringsArray, ...values: unknown[]): string;
function html(
  map: Map<string, Node>
): (template: TemplateStringsArray, ...values: unknown[]) => string;
function html(
  ...args:
    | [map: Map<string, Node>]
    | [template: TemplateStringsArray, ...values: unknown[]]
) {
  if ('raw' in args[0]) {
    const [template, ...values] = args;
    return implement(undefined, template, ...values);
  }
  const [map] = args;
  return (template: TemplateStringsArray, ...values: unknown[]) =>
    implement(map, template, ...values);

  function implement(
    map: Map<string, Node> | undefined,
    template: TemplateStringsArray,
    ...values: unknown[]
  ) {
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
          if (value instanceof Node) {
            if (!map) {
              throw new Error();
            }
            const id = [1, 2, 3]
              .map(() => Math.random().toString(36).slice(2))
              .join('');
            map.set(id, value);
            yield `<!--${id}-->`;
            continue;
          }
          yield entityize(String(value));
        }
      })()
    );
  }
}
function applyNodes(node: Node, map: Map<string, Node>) {
  function traverse(node: Node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const id = (node as Comment).data;
      const target = map.get(id);
      if (target) {
        node.parentElement?.replaceChild(target, node);
        map.delete(id);
      }
    }
    for (const child of node.childNodes) {
      traverse(child);
    }
  }
  traverse(node);
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
    [Type in keyof HTMLElementEventMap as Type | `${Type}$`]?:
      | ((
          this: HTMLElementTagNameMap[N],
          ev: HTMLElementEventMap[Type]
        ) => void)
      | [
          (
            this: HTMLElementTagNameMap[N],
            ev: HTMLElementEventMap[Type]
          ) => void,
          boolean | AddEventListenerOptions
        ];
  };
  initialize?: (this: HTMLElementTagNameMap[N]) => void;
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
        if (type.endsWith('$')) {
          const [listener, options] = rest;
          e.addEventListener(
            type.slice(0, -1),
            listener,
            typeof options === 'object' ? {...options, passive: true} : true
          );
          continue;
        }
        e.addEventListener(type, ...rest);
      }
    }
    const map = new Map<string, Node>();
    e.innerHTML = html(map)(...args);
    applyNodes(e, map);
    if (map.size) {
      throw new Error();
    }
    options?.initialize?.call(e);
    return e;
  };
}

interface DialogOptions<T = string> extends ElementOptions<'dialog'> {
  title?: string;
  closeable?: boolean;
  returnValue?: (this: HTMLDialogElement) => T;
}

function openModalDialog<T>(
  options: DialogOptions<T>
): (template: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
function openModalDialog(
  options: Omit<DialogOptions, 'returnValue'>
): (template: TemplateStringsArray, ...values: unknown[]) => Promise<string>;
function openModalDialog<T>({
  title = '',
  closeable,
  initialize,
  returnValue,
  ...options
}: DialogOptions<T>): (
  template: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T> {
  return (...args) => {
    const titleBlock = element('div', {
      classList: 'title',
      data: {title},
    })`${
      closeable
        ? element('button', {
            properties: {value: 'cancel', tabIndex: -1, title: '閉じる'},
            listeners: {
              click() {
                this.closest('dialog')?.close('cancel');
              },
            },
          })/* html */ `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M4 4L20 20M4 20L20 4" />
            </svg>
          `
        : undefined
    }`;
    const form = element('form', {properties: {method: 'dialog'}})(...args);
    const dlg = element('dialog', {
      ...options,
      initialize() {
        this.addEventListener('keydown', ev => {
          if (ev.key !== 'Escape') {
            // Escape以外はそのまま
            return;
          }
          for (const cancel of this.querySelectorAll('button[value=cancel]')) {
            if (!cancel.disabled) {
              // 無効でないキャンセルボタンが存在すればEscapeキーを無効化しない
              return;
            }
          }
          // Escapeキーを無効化
          ev.preventDefault();
        });
        initialize?.call(this);
      },
    })`
      ${titleBlock}
      ${form}
    `;
    document.body.append(dlg);
    dlg.showModal();
    return new Promise<T>(resolve => {
      dlg.addEventListener('close', () => {
        resolve(returnValue ? returnValue.call(dlg) : (dlg.returnValue as T));
        dlg.remove();
      });
    });
  };
}

function childrenToMarkdown(element: Element, indent: string): string {
  return ''.concat(
    ...(function* () {
      for (const child of element.childNodes) {
        const text = asText(child);
        if (text) {
          yield text.data.replace(/&nbsp;|\xa0/g, ' ');
          continue;
        }
        const elm = asElement(child);
        if (!elm) {
          continue;
        }
        yield toMarkdown(elm as HTMLElement, indent);
      }
    })()
  );
}

function listToMarkdown(
  element: Element,
  indent: string,
  makePrefix: (i: number) => string
): string {
  return ''.concat(
    ...(function* () {
      let i = 1;
      let prefix = indent + ' '.repeat(makePrefix(0).length);
      for (const child of element.childNodes) {
        const elm = asElement(child);
        prefix = indent + makePrefix(i++);
        switch (elm?.localName) {
          case 'li':
            {
              const text = `${prefix}${childrenToMarkdown(
                child as HTMLElement,
                ' '.repeat(prefix.length)
              )}`
                .replace(/^[ \t]+$/gm, '')
                .replace(/(?<!  )\n*$/, '\n');
              yield text;
            }
            continue;
          case 'ol':
          case 'ul':
            yield `${listToMarkdown(
              child as HTMLElement,
              ' '.repeat(prefix.length),
              elm.localName === 'ul' ? () => '- ' : i => `${i}. `
            )}`.replace(/\n*$/, '\n');
            continue;
        }
      }
    })()
  );
}

function toMarkdown(element: HTMLElement, indent: string): string {
  switch (element.localName) {
    case 'th':
    case 'td':
    case 'p':
    case 'div': {
      const text = childrenToMarkdown(element, indent);
      return text.replace(/(?:(?:  )?\n)?$/, '\n\n');
    }
    case 'img': {
      const img = element as HTMLImageElement;
      return `![${img.alt || img.title || 'image'}](${img.src})`;
    }
    case 'a': {
      const anchor = element as HTMLAnchorElement;
      return `[${childrenToMarkdown(element, indent)}](${anchor.href})`;
    }
    case 'input': {
      const input = element as HTMLInputElement;
      if (input.type !== 'checkbox') {
        throw new Error(input.type);
      }
      return input.checked ? '[x] ' : '[ ] ';
    }
    case 'br':
      return `  \n${indent}`;
    case 'hr':
      return `\n${indent}---\n${indent}`;
    case 'em':
      return `*${childrenToMarkdown(element, indent)}*`;
    case 'strong':
      return `**${childrenToMarkdown(element, indent)}**`;
    case 'strike':
      return `~~${childrenToMarkdown(element, indent)}~~`;
    case 'code': {
      const text = childrenToMarkdown(element, indent);
      return text.includes('`') ? `\`\` ${text} \`\`` : `\`${text}\``;
    }
    case 'h1': {
      const text = childrenToMarkdown(element, indent);
      return `# ${text.replace(/^#+[ \xa0]/, '')}\n\n`;
    }
    case 'h2': {
      const text = childrenToMarkdown(element, indent);
      return `## ${text.replace(/^#+[ \xa0]/, '')}\n\n`;
    }
    case 'h3': {
      const text = childrenToMarkdown(element, indent);
      return `### ${text.replace(/^#+[ \xa0]/, '')}\n\n`;
    }
    case 'h4': {
      const text = childrenToMarkdown(element, indent);
      return `#### ${text.replace(/^#+[ \xa0]/, '')}\n\n`;
    }
    case 'h5': {
      const text = childrenToMarkdown(element, indent);
      return `##### ${text.replace(/^#+[ \xa0]/, '')}\n\n`;
    }
    case 'h6': {
      const text = childrenToMarkdown(element, indent);
      return `###### ${text.replace(/^#+[ \xa0]/, '')}\n\n`;
    }
    case 'ol':
      return listToMarkdown(element, indent, i => `${i}. `) + '\n';
    case 'ul':
      return listToMarkdown(element, indent, i => `- `) + '\n';
    case 'pre':
      return `${indent}\`\`\`plaintext\n${element.innerText.replace(
        /\n/g,
        `\n${indent}`
      )}\n${indent}\`\`\`\n\n`;
    case 'table': {
      const header = element.querySelector('tr')?.querySelectorAll('th,td');
      if (!header) {
        return '';
      }
      return `\n${indent}|${[...header]
        .map(td =>
          toMarkdown(td, '').replace(/\n+$/, '').replace(/ *\n/g, '<br>')
        )
        .join('|')}|\n${indent}|${[...header]
        .map(() => '-')
        .join('|')}|\n`.concat(
        ...(function* () {
          for (const tr of (
            element as ParentNode
          ).querySelectorAll<HTMLTableRowElement>('tr:nth-of-type(n+2)')) {
            yield `${indent}|${[...tr.querySelectorAll('th,td')]
              .map(td =>
                toMarkdown(td, '').replace(/\n+$/, '').replace(/ *\n/g, '<br>')
              )
              .join('|')}|\n`;
          }
        })(),
        '\n'
      );
    }
    default:
      // 未対応のタグは無視
      return '';
  }
}
