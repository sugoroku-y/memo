declare const passwordPromptDialog: HTMLDialogElement;

/**
 * パスワード入力ダイアログを表示して入力されたパスワードを返す。
 *
 * - 初期状態では乱数で発生させたパスワードが設定されている。
 *   - 乱数で発生させたパスワードをコピーできるように初期状態ではパスワード入力モードにはなっていない。
 *   - 初期状態から何らかの変更を加えるとパスワード入力モードにはる。
 * - 5文字以上入力されないと設定ボタンはグレーアウトしてダイアログを閉じることができない
 * - ESCキーでもダイアログは閉じない。
 * - パスワードが5文字以上入力されていればEnterキーでもダイアログは閉じる
 * @returns {Promise<string>} 入力されたパスワード
 */
function passwordPrompt() {
  return new Promise<string>(resolve => {
    const input = passwordPromptDialog.querySelector('input')!;
    const button = passwordPromptDialog.querySelector('button')!;
    input.type = 'text';
    input.value = Math.random().toString(36).slice(2);
    input.select();
    const validation = () => {
      button.disabled = input.value.length < 5;
    };
    input.addEventListener('input', () => {
      if (input.type !== 'password') {
        input.type = 'password';
      }
      validation();
    });
    button.addEventListener('click', () => {
      if (input.value.length < 5) {
        return;
      }
      resolve(input.value);
      passwordPromptDialog.close();
    });
    validation();
    passwordPromptDialog.show();
  });
}
