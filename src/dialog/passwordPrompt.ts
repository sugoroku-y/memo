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
  // 自動生成したパスワード
  const randomPassword = Math.random().toString(36).slice(2);
  const dlg = dialog({
    classList: 'password-prompt',
    title: ' ',
  })/* html */ `
    <label></label>
    <div>
      <input required
            minLength="${minLength}"
            value="${randomPassword}"/>
      <label><input type="checkbox" checked/></label>
    </div>
    <summary></summary>
    <button></button>
  `;
  const input = dlg.querySelector('input:not([type])')!;
  const checkbox = dlg.querySelector('input[type=checkbox]')!;
  input.addEventListener(
    'input',
    () => {
      // 初回だけ入力があればパスワードフィールドに変える
      input.type = 'password';
      checkbox.checked = false;
    },
    {once: true}
  );
  checkbox.addEventListener('change', () => {
    // 目のアイコンをクリックすることでパスワード入力フィールドと通常のテキストフィールドを切り替える
    input.type = checkbox.checked ? 'text' : 'password';
  });
  // ダイアログを開いたときに自動生成したパスワードを選択状態にする
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
