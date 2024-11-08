/** 設定値 */
const configuration = (() => {
  const CONFIG_TITLE_FORMAT = 'title-format';
  const DEFAULT_TITLE_FORMAT = '[YYYY-MM-DD hh:mm] "memo"';
  const CONFIG_USE_PUBLIC_KEY_METHOD = 'use-public-key-method';
  const VALID_USE_PUBLIC_KEY_METHOD = 'true';
  const CRYPTO_KEY = 'crypto-key';
  const CRYPTO_KEY_PAIR = 'crypto-key-pair';
  return {
    get titleFormat() {
      return localStorage.getItem(CONFIG_TITLE_FORMAT) ?? DEFAULT_TITLE_FORMAT;
    },
    set titleFormat(newValue) {
      if (newValue === DEFAULT_TITLE_FORMAT) {
        localStorage.removeItem(CONFIG_TITLE_FORMAT);
      } else {
        localStorage.setItem(CONFIG_TITLE_FORMAT, newValue);
      }
    },
    get usePublicKeyMethod() {
      return (
        localStorage.getItem(CONFIG_USE_PUBLIC_KEY_METHOD) ===
        VALID_USE_PUBLIC_KEY_METHOD
      );
    },
    updateUsePublicKeyMethod(newValue: boolean) {
      if (this.usePublicKeyMethod === newValue) {
        return false;
      }
      if (newValue) {
        localStorage.setItem(
          CONFIG_USE_PUBLIC_KEY_METHOD,
          VALID_USE_PUBLIC_KEY_METHOD
        );
      } else {
        localStorage.removeItem(CONFIG_USE_PUBLIC_KEY_METHOD);
      }
      return true;
    },
    /**
     * localStorageに保存したキーがあればそちらを読み込み、なければキーを生成
     */
    async loadCryptoKey() {
      if (this.usePublicKeyMethod) {
        const saved = localStorage.getItem(CRYPTO_KEY_PAIR);
        if (saved) {
          return importKeyPair(saved);
        }
        const keyPair = await generateKeyPair();
        // migration
        const oldKey = localStorage.getItem(CRYPTO_KEY);
        if (oldKey) {
          const key = await importKey(oldKey);
          await migration(key, keyPair);
          localStorage.removeItem(CRYPTO_KEY);
        }
        localStorage.setItem(CRYPTO_KEY_PAIR, await exportKeyPair(keyPair));
        return keyPair;
      }
      const saved = localStorage.getItem(CRYPTO_KEY);
      if (saved) {
        return importKey(saved);
      }
      // 共通鍵暗号の場合はパスワードを必要とする
      const password = await passwordPrompt();
      const key = await generateKey(password!);
      // migration
      const oldKeyPair = localStorage.getItem(CRYPTO_KEY_PAIR);
      if (oldKeyPair) {
        const keyPair = await importKeyPair(oldKeyPair);
        await migration(keyPair, key);
        localStorage.removeItem(CRYPTO_KEY_PAIR);
      }
      localStorage.setItem(CRYPTO_KEY, await exportKey(key));
      return key;
    },
    /**
     * localStorageに保存したキーをクリアしてリロードする。
     */
    resetCryptoKey() {
      localStorage.removeItem(CRYPTO_KEY_PAIR);
      localStorage.removeItem(CRYPTO_KEY);
      return location.reload() as never;
    },
  };
})();
