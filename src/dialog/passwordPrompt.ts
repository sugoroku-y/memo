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
async function passwordPrompt({minLength = 5}: {minLength?: number} = {}) {
  const dlg = dialog({classList: 'password-prompt'})/* html */ `
    <label>パスワード:</label><input type="text" minLength="${minLength}"/>
    <summary>
      内容をURLに積む際の暗号化に使用されるパスワードです<br>
      同じパスワードを使うことで別のブラウザでも同じURLを<br>
      表示および編集できます。
    </summary>
    <label>パスワード(確認):</label> <input type="text" minLength="${minLength}"/>
    <summary>
      パスワードに打ち間違いがないか確認します。<br>
      上のパスワードと同じものを入力してください。
    </summary>
    <button>設定</button>
  `;
  const [input, input2] = dlg.querySelectorAll('input');
  const button = dlg.querySelector('button')!;
  dlg.addEventListener('input', ev => {
    if (ev.target !== input && ev.target !== input2) {
      return;
    }
    if (input.type !== 'password') {
      input.type = 'password';
      input2.type = 'password';
      (ev.target === input2 ? input : input2).value = '';
    }
    if (input.validity.valid) {
      input2.setCustomValidity(
        input.value === input2.value ? '' : '確認用のパスワードが一致しません。'
      );
      input2.reportValidity();
    }
    button.disabled = !input.validity.valid || !input2.validity.valid;
  });
  dlg.addEventListener(
    'keydown',
    ev => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
      }
    },
    true
  );
  dlg.addEventListener('submit', () => {
    dlg.returnValue = input.value;
  });
  document.body.append(dlg);
  input.value = input2.value = Math.random().toString(36).slice(2);
  input.select();
  dlg.showModal();
  return await new Promise<string>(resolve => {
    dlg.addEventListener('close', () => {
      resolve(dlg.returnValue);
    });
  });
}
