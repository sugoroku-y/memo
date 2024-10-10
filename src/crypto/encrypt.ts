function encrypt(key: CryptoKey, value: ArrayBuffer | ArrayBufferView) {
  return crypto.subtle.encrypt(algorismWithIv, key, value);
}
