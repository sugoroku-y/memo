/**
 * バイナリデータをbase64エンコードする
 * @param binary バイナリデータ
 */
function encodeBase64(binary: ArrayBufferView | ArrayBuffer): string {
  const array =
    binary instanceof Uint8Array
      ? // Uint8Arrayの場合はそのまま使用
        binary
      : 'buffer' in binary
      ? // ArrayBufferViewであればbufferからUint8Arrayを生成
        new Uint8Array(binary.buffer)
      : // それ以外はArrayBufferなのでbinaryからUint8Arrayを生成
        new Uint8Array(binary);
  // btoa(String.fromCodePoint(...))だと配列長が12万を超えるあたりでスタックオーバーフローになることがあるので10万ぐらいで分割
  const blockSize = 100002; // 10万を超えたあたりにある3の倍数
  return ''.concat(
    ...(function* () {
      for (let i = 0; i < array.length; i += blockSize) {
        yield btoa(String.fromCodePoint(...array.slice(i, i + blockSize)));
      }
    })()
  );
}
