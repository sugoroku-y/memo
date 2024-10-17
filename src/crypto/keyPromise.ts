/**
 * localStorageに保存したキーがあればそちらを、なければキーを生成
 */
const keyPromise = (async () => {
  if (localStorage.getItem('use-public-key-method') === 'true') {
    const saved = localStorage.getItem('crypto-key-pair');
    if (saved) {
      return importKeyPair(saved);
    }
    const keyPair = await generateKeyPair();
    // migration
    const oldKey = localStorage.getItem('crypto-key');
    if (oldKey) {
      await migration(await importKey(oldKey), keyPair);
      localStorage.removeItem('crypto-key');
    }
    localStorage.setItem('crypto-key-pair', await exportKeyPair(keyPair));
    return keyPair;
  }
  const saved = localStorage.getItem('crypto-key');
  if (saved) {
    return importKey(saved);
  }
  await new Promise<void>(resolve =>
    window.addEventListener('load', () => resolve())
  );
  const password = await passwordPrompt();
  const key = await generateKey(password);
  localStorage.setItem('crypto-key', await exportKey(key));
  return key;
})();

/**
 * localStorageに保存したキーをクリアしてリロードする。
 */
function resetKey(): never {
  localStorage.removeItem('crypto-key-pair');
  return location.reload() as never;
}
