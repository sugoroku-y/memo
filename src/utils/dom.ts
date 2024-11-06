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
      for (const cancel of dialog.querySelectorAll('button[value=cancel]')) {
        if (!cancel.disabled) {
          // 無効でないキャンセルボタンが存在すればEscapeキーを無効化しない
          return;
        }
      }
      // Escapeキーを無効化
      ev.preventDefault();
    });
    const title = element('div', {
      classList: 'title',
      data: {title: options?.title ?? ''},
    })``;
    dialog.append(title);
    if (options?.closeable) {
      const button = element('button', {
        properties: {value: 'cancel', tabIndex: -1, title: '閉じる'},
      })/* html */ `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M4 4L20 20M4 20L20 4" />
        </svg>
      `;
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

function childrenToMarkdown(element: Element, indent: string): string {
  return ''.concat(
    ...(function* () {
      for (const child of element.childNodes) {
        const text = asText(child);
        if (text) {
          yield text.data.replace(/&nbsp;/g, ' ');
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
      return `![${img.alt || img.title || ''}](${img.src})`;
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
                toMarkdown(td, '').replace(/\n+$/, '').replace(/\n/g, '<br>')
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
