declare const settings: HTMLButtonElement;

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

  settings.addEventListener('click', () => {
    const settings = dialog({
      classList: 'settings',
      closeable: true,
      title: '設定',
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
