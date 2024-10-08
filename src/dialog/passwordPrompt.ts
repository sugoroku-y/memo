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
async function passwordPrompt() {
  const dlg = dialog({classList: 'password-prompt'})/* html */ `
    <label>パスワード: <input type="text"/></label>
    <summary>
      URLに積む内容を暗号化するためのパスワードです<br>
      同じパスワードを使うことで同じURLを<br>
      別のブラウザでも表示編集できます。
    </summary>
    <button>設定</button>
  `;
  const input = dlg.querySelector('input')!;
  const button = dlg.querySelector('button')!;
  input.addEventListener('input', () => {
    if (input.type !== 'password') {
      input.type = 'password';
    }
    button.disabled = input.value.length < 5;
  });
  dlg.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
    }
  });
  dlg.addEventListener('submit', () => {
    dlg.returnValue = input.value;
  });
  document.body.append(dlg);
  input.value = Math.random().toString(36).slice(2);
  input.select();
  dlg.showModal();
  return await new Promise<string>(resolve => {
    dlg.addEventListener('close', () => {
      resolve(dlg.returnValue);
      dlg.remove();
    });
  });
}
