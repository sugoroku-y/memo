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
  const randomPassword = Math.random().toString(36).slice(2);
  const dlg = dialog({classList: 'password-prompt'})/* html */ `
    <label>パスワード:</label>
    <input type="text"
           required
           minLength="${minLength}"
           value="${randomPassword}"/>
    <summary>
      内容をURLに積む際の暗号化に使用されるパスワードです<br>
      同じパスワードを使うことで別のブラウザでも同じURLを<br>
      表示および編集できます。
    </summary>
    <label>パスワード(確認):</label>
    <input type="password"
           required
           minLength="${minLength}"
           value="${randomPassword}"/>
    <summary>
      パスワードに打ち間違いがないか確認します。<br>
      上のパスワードと同じものを入力してください。
    </summary>
    <button>設定</button>
  `;
  const [input, input2] = dlg.querySelectorAll('input');
  const customValidation = (valid: boolean) => {
    input2.setCustomValidity(valid ? '' : '確認用のパスワードが一致しません。');
    input2.reportValidity();
  };
  input.addEventListener(
    'input',
    () => {
      // 入力があればパスワードフィールドに変えて確認用フィールドをクリアする
      input.type = 'password';
      input2.value = '';
    },
    {once: true}
  );
  input2.addEventListener('input', () => {
    // 入力があったら一時的に確認結果を解除
    if (input2.validity.customError) {
      customValidation(true);
    }
  });
  input2.addEventListener('change', () => {
    // 値が変更されたら再度確認
    customValidation(input.value === input2.value);
  });
  // Escapeで閉じられなくする
  dlg.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
    }
  });
  // submitできたらパスワードを返す値に設定して閉じる
  dlg.addEventListener('submit', () => {
    dlg.close(input.value);
  });
  // ダイアログを開いたときに選択状態にする
  input.select();
  document.body.append(dlg);
  dlg.showModal();
  // 閉じたときの返す値を返値にする
  return await new Promise<string>(resolve => {
    dlg.addEventListener('close', () => {
      resolve(dlg.returnValue);
    });
  });
}
