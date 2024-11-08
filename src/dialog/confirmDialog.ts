interface ConfirmDialogOptions {
  title?: string;
  buttons?: string[];
  default?: string;
  labels?: Record<string, string>;
}

function confirmDialog(message: string, options?: ConfirmDialogOptions) {
  const {
    title,
    default: defaultValue,
    labels,
    buttons = labels ? Object.keys(labels) : ['yes', 'no'],
  } = options ?? {};
  return openModalDialog({
    title,
    classList: 'confirm',
    initialize() {
      // 開いたあとフォーカスを移すボタン
      let focusee: HTMLButtonElement | undefined | null;
      this.querySelector('.buttons')?.append(
        ...buttons.map(value => {
          const button = element('button', {
            properties: {value, tabIndex: 0},
          })`${labels?.[value]}`;
          if (!focusee || value === defaultValue) {
            // 先頭もしくはdefaultで指定された値と一致するボタン
            focusee = button;
          }
          return button;
        })
      );
      const target = focusee;
      if (target) {
        // この時点ではまだフォーカスを移せないのでちょっと後に実行
        queueMicrotask(() => {
          target.focus();
        });
      }
    },
  })/*html*/ `
    <div class="message">${message}</div>
    <div class="buttons"></div>
  `;
}
