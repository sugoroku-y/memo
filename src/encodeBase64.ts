/**
 * バイナリデータをbase64エンコードする
 * @param binary バイナリデータ
 */
function encodeBase64(binary: ArrayBufferView | ArrayBuffer): string {
  const array =
    binary instanceof Uint8Array
      ? binary
      : binary instanceof ArrayBuffer
      ? new Uint8Array(binary)
      : new Uint8Array(binary.buffer);
  // btoa(String.fromCodePoint(...))だと配列長が12万を超えるあたりでスタックオーバーフローになることがあるので10万ぐらいで分割
  const blockSize = 100002; // 10万を超えたあたりにある3の倍数
  return Array.from({length: Math.ceil(array.length / blockSize)}, (_, i) =>
    btoa(
      String.fromCodePoint(...array.slice(i * blockSize, (i + 1) * blockSize))
    )
  ).join('');
}
