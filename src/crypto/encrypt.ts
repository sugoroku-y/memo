function encrypt(key: CryptoKey, value: ArrayBuffer | ArrayBufferView) {
  return crypto.subtle.encrypt(algorithmWithIv, key, value);
}
