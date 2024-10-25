window.addEventListener('DOMContentLoaded', () => {
  const CONFIG_TITLE_FORMAT = 'title-format';
  const DEFAULT_TITLE_FORMAT = '[YYYY-MM-DD hh:mm] "memo"';
  const CONFIG_USE_PUBLIC_KEY_METHOD = 'use-public-key-method';
  const VALID_USE_PUBLIC_KEY_METHOD = 'true';
  /** 設定値 */
  const configuration = {
    get titleFormat() {
      return localStorage.getItem(CONFIG_TITLE_FORMAT) ?? DEFAULT_TITLE_FORMAT;
    },
    set titleFormat(newValue) {
      if (newValue === DEFAULT_TITLE_FORMAT) {
        localStorage.removeItem(CONFIG_TITLE_FORMAT);
      } else {
        localStorage.setItem(CONFIG_TITLE_FORMAT, newValue);
      }
    },
    get usePublicKeyMethod() {
      return (
        localStorage.getItem(CONFIG_USE_PUBLIC_KEY_METHOD) ===
        VALID_USE_PUBLIC_KEY_METHOD
      );
    },
    updateUsePublicKeyMethod(newValue: boolean) {
      if (this.usePublicKeyMethod === newValue) {
        return false;
      }
      if (newValue) {
        localStorage.setItem(
          CONFIG_USE_PUBLIC_KEY_METHOD,
          VALID_USE_PUBLIC_KEY_METHOD
        );
      } else {
        localStorage.removeItem(CONFIG_USE_PUBLIC_KEY_METHOD);
      }
      return true;
    },
  };

  menu.append(element('button', {
    properties: {id: 'settings', tabIndex: -1, title: '設定'},
    listeners: {
      click: () => {
        const settings = dialog({
          classList: 'settings',
          closeable: true,
        })/*html*/ `
          <label>初期タイトル</label><input />
          <label><input type="checkbox">公開鍵暗号を使う</label>
        `;
        const titleFormatField = settings.querySelector('input:not([type])')!;
        const usePublicKeyMethodCheckbox = settings.querySelector(
          'label > input[type=checkbox]'
        )!;
        titleFormatField.value = configuration.titleFormat;
        titleFormatField.addEventListener('change', () => {
          configuration.titleFormat = titleFormatField.value;
        });
        usePublicKeyMethodCheckbox.checked = configuration.usePublicKeyMethod;
        usePublicKeyMethodCheckbox.addEventListener('change', () => {
          if (
            !configuration.updateUsePublicKeyMethod(
              usePublicKeyMethodCheckbox.checked
            )
          ) {
            return;
          }
          (async () => {
            const answer = await confirmDialog(
              '再起動するまで設定は反映されません。再起動しますか?'
            );
            if (answer === 'yes') {
              location.href = location.pathname;
            }
          })();
        });
        showModal(settings);
      },
    },
  })/* html */ `
    <svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <path d="M1 12l1.1 4.8a2.7 2.7 0 0 1 3.1 3.8l4.4 2.1a2.7 2.7 0 0 1 4.9 0l4.4 -2.1a2.7 2.7 0 0 1 3.1 -3.8l1.1 -4.8a2.7 2.7 0 0 1 -1.1 -4.8l-3.1 -3.8a2.7 2.7 0 0 1 -4.4 -2.1l-4.9 -0a2.7 2.7 0 0 1 -4.4 2.1l-3.1 3.8a2.7 2.7 0 0 1 -1.1 4.8"/>
    </svg>
  `);
});
