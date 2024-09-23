/**
 * 文字列をgzip圧縮してBase64化
 *
 * 1. 文字列 -> バイナリ(utf8)
 * 2. gzip圧縮
 * 3. 暗号化
 * 4. バイナリ -> Base64
 * @param {string} source encodeする文字列
 */
async function encodeHash(source: string): Promise<string> {
  return encodeBase64(
    await encrypt(
      await new Response(
        new Blob([source]).stream().pipeThrough(new CompressionStream('gzip'))
      ).arrayBuffer()
    )
  );
}
