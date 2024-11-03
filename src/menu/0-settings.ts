window.addEventListener('DOMContentLoaded', () => {
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
          <button type="button" name="key-reset">${
            configuration.usePublicKeyMethod ? '共通鍵' : 'パスワード'
          }のリセット</button>
        `;
        // 初期タイトル
        const titleFormatField = settings.querySelector('input:not([type])')!;
        titleFormatField.value = configuration.titleFormat;
        titleFormatField.addEventListener('change', () => {
          configuration.titleFormat = titleFormatField.value;
        });
        // 公開鍵暗号を使う
        const usePublicKeyMethodCheckbox = settings.querySelector(
          'label > input[type=checkbox]'
        )!;
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
        // 共通鍵/パスワードのリセット
        settings
          .querySelector('button[name="key-reset"]')!
          .addEventListener('click', () => {
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
          });
        showModal(settings);
      },
    },
  })/* html */ `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path d="M1 50a49 49 0 0 0 2 13l11 2a39 39 0 0 0 7 11l-2 11a49 49 0 0 0 12 7l9-7a39 39 0 0 0 13 1l8 9a49 49 0 0 0 13-5l-0-12a39 39 0 0 0 9-10l12-0a49 49 0 0 0 4-13l-9-7a39 39 0 0 0-2-13l7-9a49 49 0 0 0-7-11l-11 3a39 39 0 0 0-12-7l-3-11a49 49 0 0 0-13-1l-5 11a39 39 0 0 0-13 5l-11-5a49 49 0 0 0-9 10l5 10a39 39 0 0 0-4 13zM50 25a25 25 0 0 0 0 50a25 25 0 0 0 0-50" fill="currentColor" stroke="none" fill-rule="evenodd"/>
  </svg>
  `);
  // https://www.typescriptlang.org/ja/play/?target=99&jsx=0#code/MYewdgzgLgBA7jAvDAjABjQGgLACgYEwC2SqAzDvoWKQOwDceoksATqQgPQwBMMAtKkqEYwAB4cY3HsMLAAnpOmyCrPsgCyAQygALAHSsQAVzAATABQX2AKhgAWAJRSYAVkcqYrMqW17DJubWLjyOjLgANgCmsBLIWHgiivGewKQA5BrpnmYZ6eEAZiDsFtGwAJakaPQwlQA8MGA1ANTN5c4A3omEXVQiBMzQMGZRAOakFn4GAAoAkjB2fHYWlXYkzTBojs7cFjRrHt39-WBxohKCU-qgEBYjo852rJ7HBGDJooobVxDlYHdjR5ecKvYYwZrINIbMxmAAGABIOqcBDAxABfGCI94o+Ro2Eg15nU4E44fd4kmBoo4wXqgwawe4TK5zBa8VkrVnrBzbFx7TmHPqgxpncQoq43AEPVnPamg7GQr4wH5-SVA1gUkS5CHDOFaRGsDH6jFoTamrEXVGGpGKQS4-GywhEsQawhk+QUqmC2mvenDMZMnQzeaLdmrYjgmAANh5u32xAFQuoIot4pAt3uapkDuO8s+EeV-wz0p4LoIWuQMNhEXNKPRmOtOLxpdRpGJ2Zgbo91O9x19jOQk0D+hZIeWYa5KBQMZgfIOL1eyMhKaHEqLTyzgrlHwU+aHv0LgOLzfLOtheo6aitl9NJpNNcEdaxNo7TfbTubnepnpEaWQ6Qi+R4J6J6VgAXhoiLiFaO6CN4aLnnB9aIbeN5IT4izwfqZBXthqEoYi1L8N4rI8EB9q4IMIDRPoEQgKMFiwngdQQAAbuMYhEBEkCIAARLoUBQAADgAXJwnBwBJ+hwGQ+jFKMnA8BgaCcKxow8TALHlFEcAAEIgGIvH4R0cBWiZPEAHzdHUgmBsMvGImYaLqQU5QRBEvHAMYrCsFEYBQAAwlRxTqdARgANZRLxYDgFEzmuRERHGNEvFRCxvkgDCPGcJZuB1CpbE5bCYR4HgBSmMAUDlOAOoWFAUREIJEQ6FEwkwAAKvVjXNQAylArB-KMEAAILeVo8iYDA+hTSxWgRMYUQQK1phhdFcBgAA2gAuo4rWhQNNLUj5UBeTQdUNU1dWGFEZjGMAURWM8MBRBN7RIOZB2bnI4BDCxpAzXNC3rZUggoJtzZHSdMAIh0UDyIJUQgAUGlIIgf5gMYRAAEZRKw6QwAAZPjyMNCaAD8XhXV1d0WJwAA6EDNPCnATek6TOK1BoEZ9xyw-DiPI6jaMY9juMwOTLH6FAIAAGLlGI10WFsMCtSx7ZooiUSvoKaLFbgnpAA
});
