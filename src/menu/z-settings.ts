window.addEventListener('DOMContentLoaded', () => {
  menu.append(element('button', {
    properties: {id: 'settings', tabIndex: -1, title: '設定'},
    listeners: {
      click: () => {
        const settings = dialog({
          classList: 'settings',
          closeable: true,
          listeners: {
            click(ev) {
              if ((ev.target as HTMLButtonElement).name === 'key-reset') {
                (async () => {
                  const answer = await confirmDialog(
                    `${
                      configuration.usePublicKeyMethod ? '共通鍵' : 'パスワード'
                    }をリセットして再読込しますか?`
                  );
                  if (answer === 'yes') {
                    configuration.resetCryptoKey();
                  }
                })();
                return;
              }
            },
          },
        })/*html*/ `
          <label>初期タイトル</label><input />
          <label><input type="checkbox">公開鍵暗号を使う</label>
          <button type="button" name="key-reset">${
            configuration.usePublicKeyMethod ? '共通鍵' : 'パスワード'
          }のリセット</button>
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
