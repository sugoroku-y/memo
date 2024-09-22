/**
 * @param {} iterable
 */
async function blobFromStream(iterable: ReadableStream<BlobPart>): Promise<Blob> {
  const chunks: BlobPart[] = [];
  for await (const chunk of iterable) {
    chunks.push(chunk);
  }
  return new Blob(chunks);
}
