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
async function passwordPrompt(
  options: {minLength?: number; automatic?: boolean} = {}
) {
  const {minLength = 5, automatic = true} = options;
  const dlg = dialog({
    classList: 'password-prompt',
    listeners: {
      submit: () => {
        // submitできたらパスワードを返す
        dlg.close(input.value);
      },
    },
  })/* html */ `
    <label></label>
    <div>
      <input type="password" required minLength="${minLength}"/>
      <svg
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1 12a12 13 0 0 1 22 0a12 13 0 0 1-22 0m2 0a10 11 0 0 1 18 0a10 11 0 0 1-18 0m9-4a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 1a3 3 0 0 1 3 3a1 1 0 0 1-2 0a1 1 0 0 0-1-1a1 1 0 0 1 0-2"
          fill="currentColor"
          fill-rule="evenodd"
          stroke="none"/>
        <path d="M4 20l16-16"/>
      </svg>
    </div>
    <summary></summary>
    <button></button>
  `;
  const input = dlg.querySelector('div > input[type=password]')!;
  const svg = input.nextElementSibling!;
  if (automatic) {
    // 自動生成したパスワード
    input.value = Math.random().toString(36).slice(2);
    // パスワードを自動生成するときは最初から通常のテキストフィールドにする
    input.removeAttribute('type'); // 目のアイコンを非表示にするため属性自体を消す
    input.addEventListener(
      'input',
      () => {
        // パスワードを自動生成したときは、初回の入力でパスワードフィールドに変える
        input.type = 'password';
      },
      {once: true}
    );
  }
  svg.addEventListener('click', () => {
    // 目のアイコンをクリックすることでパスワード入力フィールドと通常のテキストフィールドを切り替える
    input.type = input.type === 'password' ? 'text' : 'password';
  });
  // ダイアログを開いたときに自動生成したパスワードを選択状態にする
  input.select();
  return showModal(dlg);
}
