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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path d="M1 50a49 49 0 0 0 2 13l11 2a39 39 0 0 0 7 11l-2 11a49 49 0 0 0 12 7l9-7a39 39 0 0 0 13 1l8 9a49 49 0 0 0 13-5l-0-12a39 39 0 0 0 9-10l12-0a49 49 0 0 0 4-13l-9-7a39 39 0 0 0-2-13l7-9a49 49 0 0 0-7-11l-11 3a39 39 0 0 0-12-7l-3-11a49 49 0 0 0-13-1l-5 11a39 39 0 0 0-13 5l-11-5a49 49 0 0 0-9 10l5 10a39 39 0 0 0-4 13zM50 25a25 25 0 0 0 0 50a25 25 0 0 0 0-50" fill="currentColor" stroke="none" fill-rule="evenodd"/>
  </svg>
  `);
  // https://www.typescriptlang.org/ja/play/?target=99&jsx=0#code/MYewdgzgLgBA7jAvDAjABjQGgLACgYEwC2SqAzDvoWKQOwDceoksATqQgPQwBMMAtKkqEYwAB4cY3HsMLAAnpOmyCrPsgCyAQygALAHSsQAVzAATABSsAVABZOAVgCUKmKzKltewyfNWpvE6MuAA2AKawEshYeCKK0a7ApADkGsmuZinJwQBmIOwW4bAAlqRo9DClADwwYBUA1PXFTjAA3rGE7VQiBMzQMGZhAOakFl4GAAoAkjDWvLOVLdxgrj3UUaISguP6oBAWg0Mtc6yra7Xxoor1MDsQxWAHw8duwecDMPXISTdmZgAGABJWmAtjAxABfGDAsCKQTyCH-N7nDag5FrS6w9EwCEdAhdd59WCHUY7aYLPhzCylOYkG62JxLGAWGi0lx4961DbiAS3HQGPZPI4LU4c96w0gKT587z3R6HF6sbEiTJfAYArTA1hQrVQtAwfX6mFgyHQkFwmAIpFiwiosTKwiY+TY3HdNo23rgfok5Bjfn6clzSnMmnEaUANkZARZCyI7Ld4u5YJ2goVIpkHp6Eu+1xlBjlQsVPAdBFVyD+-xCxt5pphFqtJfBpDRmadLo5BPORIGw1J-sD8ypobpqBQUe4MbZZzWoMlyf9qee6enWcuUpudwehfTjbL6v+mtaah1R54eoNF+rglr5t5DczdsbbY5rpEwGQyRC2TwrrMaorABeGjAuIJ5SoI7gQoekFmjBhoXkaR5kNYZ7QWQJ5wQhl6tPw7goYiTBeiA4T6CEIBDAcTh4HgOSmMAUDFOA6oWFAYREAADiEOhhAAXDAAAqbGcdxADKUCsA8QwQAAgqwrBaPImAwPoKkAG5aCExhhBAfFgMYRAAEZhKwADaAC6Th8dAElgCMnaqBExisDQrEcVxrGGGEZjGMAYQWFYSlhEpzRIAAfO6CZyF6sCqaQ6madpJmlIIKBmZmrCOc5MBAq0sU1PqAD8biecJvkWJwAA6ED1ICnBKckySWdqwKqfoUAgAAYsUYheRYaBOBCwJhARboQkEP4wEAA
});
