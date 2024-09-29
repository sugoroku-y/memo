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
  // <dialog class="password-prompt">
  //   <form method="dialog">
  //     <label>パスワード: <input /></label>
  //     <button>設定</button>
  //   </form>
  // </dialog>
  const dialog = document.createElement('dialog');
  dialog.classList.add('password-prompt');
  const form = dialog.appendChild(document.createElement('form'));
  form.method = 'dialog';
  const label = form.appendChild(document.createElement('label'));
  label.append('パスワード: ')
  const input = label.appendChild(document.createElement('input'));
  input.type = 'text';
  input.value = Math.random().toString(36).slice(2);
  const button = form.appendChild(document.createElement('button'));
  button.append('設定')
  document.body.append(dialog);

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
  dialog.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
    }
  })
  validation();
  dialog.showModal();
  try {
    return await new Promise<string>(resolve => {
      dialog.addEventListener('submit', (ev) => {
        if (input.value.length < 5) {
          ev.preventDefault()
          return;
        }
        resolve(input.value);
      });
    });
  } finally {
    dialog?.remove();
  }
}
