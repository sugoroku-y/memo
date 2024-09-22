/**
 * base64エンコードされた文字列をバイナリデータに変換する
 * @param {string} encoded base64エンコードされた文字列
 * @return {Uint8Array}バイナリデータ
 */
function decodeBase64(encoded: string): Uint8Array {
  const bin = atob(encoded);
  return Uint8Array.from(bin, (_, i) => bin.codePointAt(i)!);
}
