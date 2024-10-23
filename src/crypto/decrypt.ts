async function decrypt(
  key: CryptoKeyPair | CryptoKey,
  value: ArrayBuffer | ArrayBufferView
) {
  if ('privateKey' in key) {
    // キーペアが指定された場合は秘密鍵で復号
    return crypto.subtle.decrypt(algorithmRsaOaep, key.privateKey, value);
  }
  // 使用されるArrayBufferの実体とオフセット
  const {buffer, byteOffset} =
    'buffer' in value ? value : {buffer: value, byteOffset: 0};
  // 先頭16バイトをivとして扱う
  const iv = buffer.slice(byteOffset, 16);
  // 残りを暗号化データとする
  const encrypted = buffer.slice(byteOffset + 16);
  try {
    return await crypto.subtle.decrypt(
      {name: algorithmAesGcm, iv},
      key,
      encrypted
    );
  } catch (ex) {
    // TODO 移行のためだけなのであとで削除する
    try {
      // 新しい方式で復号して例外が出たら、古い方式でもチャレンジしてみる
      return await crypto.subtle.decrypt(
        {name: algorithmAesGcm, iv: oldIv},
        key,
        value
      );
    } catch {
      // 古い方式でも復号できなかったら新しい方式で出た例外を投げる
      throw ex;
    }
  }
}
