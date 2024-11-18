window.addEventListener('DOMContentLoaded', () => {
  menu.append(element('button', {
    properties: {id: 'settings', tabIndex: -1, title: '設定'},
    listeners: {
      click() {
        openModalDialog({
          classList: 'settings',
          closeable: true,
          initialize() {
            // 初期タイトル
            const titleFormatField = this.querySelector('input:not([type])')!;
            titleFormatField.value = configuration.titleFormat;
            titleFormatField.addEventListener('change', () => {
              configuration.titleFormat = titleFormatField.value;
            });
            // 公開鍵暗号を使う
            const usePublicKeyMethodCheckbox = this.querySelector(
              'label > input[type=checkbox]'
            )!;
            usePublicKeyMethodCheckbox.checked =
              configuration.usePublicKeyMethod;
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
            this.querySelector('button[name="key-reset"]')!.addEventListener(
              'click',
              () => {
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
              }
            );
          },
        })/*html*/ `
          <label>初期タイトル</label><input />
          <label><input type="checkbox">公開鍵暗号を使う</label>
          <button type="button" name="key-reset">${
            configuration.usePublicKeyMethod ? '共通鍵' : 'パスワード'
          }のリセット</button>
        `;
      },
    },
  })/* html */ `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path d="M1 50l2 13 11 2 7 11-2 11 12 7 9-7 13 1 8 9 13-5 0-12 9-10 12 0 4-13-9-7-2-13 7-9-7-11-11 3-12-7-3-11-13-1-5 11-13 5-11-5-9 10 5 10-4 13zM50 25a25 25 0 0 0 0 50a25 25 0 0 0 0-50" fill="currentColor" stroke="none" fill-rule="evenodd"/>
  </svg>
  `);
  // https://www.typescriptlang.org/ja/play/?target=99&jsx=0#code/MYewdgzgLgBA7jAvDAjABjQGgLACgYEwC2SqAzDvoWKQOwDceoksATqQgPQwBMMAtCkqEYwAB4cY3HsMLAAnpOmyCrPsgCyAQygALAHSsQAVzAATABQX2AKhgAWAJRSYAVkcqYrMqW17DJubWLjyOjLgANgCmsBLI4gJenorx8p5mpADaAOQa2ZgwYgVpMNkR2QC64QBmpsBQAJbgMGasWnDWOlEAXDBgxkQARlGsBay9-UMjzgDeeCLM0F5aGZo6BgAKAJIwdnx2bVBRniJgcaIS-DB+BqAQnWbOByfUKaKKANTX6-oQDWAPJ5ecIiBrVGAWG76LSDe5nRIWBJXViOZwAHhgaH0aBQMAAZHjvv4YXDFFcFOjMdiULN5iJCKwYsZWGAQYQAL50ghmfQAB2MEF0FnhVyKfTJMHkYS5hVIZzZBDeYHk4U5uGqIHYFmisAapDQ9BgeoxrJgHw+DVpVG5bQ6Fj1dhIXycLmFu2IHi80utLVtVgdxDNMAAbM5uG7HZ61N6RK12v73U7UDTXTRI2NQgrffH7YmgygyGGIWmPWNvWqefzBRYZdkAF75Wt5TziFsS7yebJaRs+jsyvs+rAyoeDzwjkTed0yWvdzwDicUYdj5dLmX8Sd7SjexYgaL6CIgADmFgABng0RAAG6HwpECKQRAAIl0UCgvO6nE4cG-+jgZH0mqHpwPAYGgnBXoej4wJeDRRHAABCIBiE+aCYjAAAkMxwOyGFYeyj4AHx0mivLrC0T6YTyjJmMYwBRBeUCsP8h4EVYowwFEziIARMBzD6BA6hxUSkFA8i8lEIDgsJiAyaUkzDKw2QwAA-Bx+hQCAABiDRiFElhoM4vRRFmBBghCUTSbJ2T8Gg2RWvS9IWaQ2S2SZMBqg5ZkWJwAB6AA6ZicOpUTQBYFnOASUgBehQVHKFKL2Q5DKkKw+jMMAOgWEpdluR59KMlAzI0Kl6WZeFbLsgU2R2fhMDVA0EQRE+wDMoyYBQAAwrumpQdARgANZRE+YDgFEUH1Y167GNET5RJeUQjWYZiPpwRG4Gi4HXmtJ7ekAA
});
