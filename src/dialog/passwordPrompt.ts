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
      <label>
        <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3"/>
          <path d="m2 12c2 4 6 7 10 7c4 0 8-3 10-7c-2-4-6-7-10-7c-4 0-8 3-10 7Z"/>
          <line x1="4" x2="20" y1="20" y2="4"/>
        </svg>
        <input type="checkbox" checked/>
      </label>
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
  dlg.showModal();
  // submitできたらパスワードを返す
  return await new Promise<string>(resolve => {
    dlg.addEventListener('submit', () => {
      resolve(input.value);
    });
  });
}
