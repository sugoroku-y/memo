/**
 * 文字列をgzip圧縮してBase64化
 * @param {string} source encodeする文字列
 */
async function encodeHash(source: string): Promise<string> {
  const stream = new Blob([source])
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  const blob = await blobFromStream(stream);
  return encodeBase64(await blob.arrayBuffer());
}
