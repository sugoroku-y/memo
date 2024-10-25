/**
 * localStorageに保存したキーがあればそちらを、なければキーを生成
 */
const keyPromise = (async () => {
  await new Promise<void>(resolve =>
    window.addEventListener('DOMContentLoaded', () => resolve())
  );
  if (configuration.usePublicKeyMethod) {
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
  const password = await passwordPrompt();
  const key = await generateKey(password);
  const oldKeyPair = localStorage.getItem('crypto-key-pair');
  if (oldKeyPair) {
    const keyPair = await importKeyPair(oldKeyPair);
    await migration(keyPair, key);
    localStorage.removeItem('crypto-key-pair');
  }
  localStorage.setItem('crypto-key', await exportKey(key));
  return key;
})();

/**
 * localStorageに保存したキーをクリアしてリロードする。
 */
function resetKey(): never {
  localStorage.removeItem('crypto-key-pair');
  localStorage.removeItem('crypto-key');
  return location.reload() as never;
}
