/**
 * Base64文字列をgzip展開
 * 
 * 1. Base64 -> バイナリ
 * 2. 復号
 * 3. gzip展開
 * 4. バイナリ -> 文字列(utf8)
 * @param {string} encoded gzip展開する文字列
 */
async function decodeHash(key: CryptoKey, encoded: string) {
  return await new Response(
    new Blob([await decrypt(key, decodeBase64(encoded))])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'))
  ).text();
}
