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
  const dlg = dialog({
    title,
    classList: 'confirm',
  })/*html*/ `
    <div class="message">${message}</div>
    <div class="buttons"></div>
  `;
  dlg.querySelector('.buttons')?.append(
    ...buttons.map(
      value =>
        element('button', {
          properties: {value, tabIndex: 0},
        })`${labels?.[value]}`
    )
  );
  queueMicrotask(() => {
    let focusee: HTMLButtonElement | undefined;
    for (const button of dlg.querySelectorAll('.buttons button')) {
      focusee ??= button;
      if (!defaultValue) {
        break;
      }
      if (button.value === defaultValue) {
        focusee = button;
        break;
      }
    }
    focusee?.focus();
  });
  return showModal(dlg);
}
