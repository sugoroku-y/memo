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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M0 12a3.0 3.0 0 0 1 1.2 5.2l3.3 4.2a3.0 3.0 0 0 1 4.8 2.3l5.3 0a3.0 3.0 0 0 1 4.8 -2.3l3.3 -4.2a3.0 3.0 0 0 1 1.2 -5.2l-1.2 -5.2a3.0 3.0 0 0 1 -3.3 -4.2l-4.8 -2.3a3.0 3.0 0 0 1 -5.3 -0l-4.8 2.3a3.0 3.0 0 0 1 -3.3 4.2zM12 6a6 6 0 0 0 0 12a6 6 0 0 0 0-12" fill="currentColor" stroke="none" fill-rule="evenodd"/>
    </svg>
  `);
});
