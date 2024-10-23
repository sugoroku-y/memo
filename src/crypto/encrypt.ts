async function encrypt(
  key: CryptoKeyPair | CryptoKey,
  value: ArrayBuffer | ArrayBufferView
) {
  if ('publicKey' in key) {
    // キーペアが指定された場合は公開鍵で暗号化
    return crypto.subtle.encrypt(algorithmRsaOaep, key.publicKey, value);
  }
  // ivとして乱数で生成した16バイトを使う
  const iv = crypto.getRandomValues(new Uint8Array(16));
  // ivと共通鍵でvalueを暗号化
  const encrypted = await crypto.subtle.encrypt(
    {name: algorithmAesGcm, iv},
    key,
    value
  );
  // ivとencryptedを結合したものを返す
  return new Uint8Array(
    (function* () {
      yield* iv;
      yield* new Uint8Array(encrypted);
    })()
  ).buffer;
}
