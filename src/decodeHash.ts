/**
 * Base64文字列をgzip展開
 * @param {string} encoded gzip展開する文字列
 */
async function decodeHash(encoded: string) {
  const stream = new Blob([decodeBase64(encoded)])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  const blob = await blobFromStream(stream);
  return await blob.text();
}
