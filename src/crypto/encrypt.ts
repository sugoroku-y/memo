function encrypt(
  key: CryptoKeyPair | CryptoKey,
  value: ArrayBuffer | ArrayBufferView
) {
  if ('publicKey' in key) {
    return crypto.subtle.encrypt(algorithmRsaOaep, key.publicKey, value);
  }
  return crypto.subtle.encrypt(algorithmWithIv, key, value);
}
