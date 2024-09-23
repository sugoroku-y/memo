/**
 * localStorageに保存したキーがあればそちらを、なければ入力されたパスワードからキーを生成
 */

const keyPromise = (async () => {
  const saved = localStorage.getItem('crypto-key');
  if (saved) {
    return importKey(saved);
  }
  await new Promise<void>(resolve => window.addEventListener('load', () => resolve())
  );
  const password = await passwordPrompt();
  const key = await generateKey(password);
  localStorage.setItem('crypto-key', await exportKey(key));
  return key;
})();
