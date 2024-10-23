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

  const settings = element('button', {
    properties: {id: 'settings', tabIndex: -1, title: '設定'},
  })/* html */ `
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="5"/>
      <path d="M16 3C16 2.5 15.5 2 15 2H13C12.5 2 12 2.5 12 3V3.5C12 4 11.5 4 11 4.5C10.5 4.5 10 5 9 5C9 5.5 8 5.5 8 5L7.5 4.5C7 4.5 6.5 4.5 6 4.5L4.5 6C4.5 6.5 4.5 7 4.5 7.5L5 8C5.5 8 5.5 9 5 9C5 10 4.5 10.5 4.5 11C4.5 11.5 4 12 3.5 12H3C2.5 12 2 12.5 2 13V15C2 15.5 2.5 16 3 16H3.5C4 16 4.5 16.5 4.5 17C4.5 17.5 5 18 5 18.5C5.5 19 5.5 19.5 5 20L4.5 20.5C4.5 20.5 4.5 21.5 4.5 21.5L6 23C6.5 23.5 7 23.5 7.5 23L8 23C8 22.5 8.5 22.5 9 22.5C9.5 23 10.5 23.5 11 23.5C11.5 23.5 12 24 12 24.5V25C12 25.5 12.5 26 13 26H15C15.5 26 16 25.5 16 25V24.5C16 24 16.5 23.5 17 23.5C17.5 23.5 18 23 19 23C19 22.5 20 22.5 20 23L20.5 23C20.5 23.5 21.5 23.5 21.5 23L23 21.5C23.5 21.5 23.5 20.5 23 20.5L23 20C22.5 20 22.5 19 23 19C23 18 23.5 17.5 23.5 17C23.5 16.5 24 16 24.5 16H25C25.5 16 26 15.5 26 15V13C26 12.5 25.5 12 25 12H24.5C24 12 23.5 11.5 23.5 11C23.5 10.5 23 9.5 22.5 9C22.5 8.5 22.5 8 23 8L23 7.5C23.5 7 23.5 6.5 23 6L21.5 4.5C21.5 4.5 20.5 4.5 20.5 4.5L20 5C19.5 5.5 19 5.5 18.5 5C18 5 17.5 4.5 17 4.5C16.5 4.5 16 4 16 3.5V3Z"/>
    </svg>
  `;
  menu.append(settings);
  settings.addEventListener('click', () => {
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
  });
});
