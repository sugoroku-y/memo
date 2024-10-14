/**
 * パスワード入力ダイアログを表示して入力されたパスワードを返す。
 *
 * - 初期状態では乱数で発生させたパスワードが設定されている。
 *   - 乱数で発生させたパスワードをコピーできるように初期状態ではパスワード入力モードにはなっていない。
 *   - 初期状態から何らかの変更を加えるとパスワード入力モードにはる。
 * - 5文字以上入力されないと設定ボタンはグレーアウトしてダイアログを閉じることができない
 * - ESCキーでもダイアログは閉じない。
 * - パスワードが5文字以上入力されていればEnterキーでもダイアログは閉じる
 * @param options パスワード入力時のオプション。省略可
 * @param options.minLength パスワードの必須文字数。省略時は5
 * @returns {Promise<string>} 入力されたパスワード
 */
async function passwordPrompt(options: {minLength?: number} = {}) {
  const {minLength = 5} = options;
  const randomPassword = Math.random().toString(36).slice(2);
  const dlg = dialog({
    classList: 'password-prompt',
    title: 'パスワードの設定',
  })/* html */ `
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
  // ダイアログを開いたときに選択状態にする
  input.select();
  document.body.append(dlg);
  dlg.showModal();
  // submitできたらパスワードを返す
  return await new Promise<string>(resolve => {
    dlg.addEventListener('submit', () => {
      resolve(input.value);
    });
  });
}
