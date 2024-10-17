async function decrypt(
  key: CryptoKeyPair | CryptoKey,
  value: ArrayBuffer | ArrayBufferView
) {
  if ('privateKey' in key) {
    return crypto.subtle.decrypt(algorithmRsaOaep, key.privateKey, value);
  }
  return await crypto.subtle.decrypt(algorithmWithIv, key, value);
}
