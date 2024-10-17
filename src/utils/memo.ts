interface Memo {
  title: string;
  hash: string;
  size: number;
  lastModified: Date;
}

const memoDB = new DB(
  'memo',
  {
    memo: {indices: {lastModified: {}, title: {}, size: {}}},
  },
  2
);
const memoTable = memoDB.store<string, Memo>('memo');

async function saveDocument(documentId: string, hash: string) {
  const data = await memoTable.get(documentId).catch(() => undefined);
  if (data?.hash === hash) {
    return;
  }
  await memoTable.put(documentId, {
    title: document.title,
    hash,
    size: hash.length,
    lastModified: new Date(),
  });
}

async function loadDocument(documentId: string): Promise<string> {
  const {hash} = await memoTable.get(documentId);
  return hash;
}

async function* listDocuments(
  indexName: 'lastModified' | 'title' | 'size',
  direction: 'prev' | 'next'
) {
  yield* memoTable.records({indexName, direction});
}

async function deleteDocument(documentId: string) {
  await memoTable.delete(documentId);
}

/**
 * 各メモごとに暗号化のかけ直し
 * @param oldKey 以前暗号化に使用されていた暗号化共通鍵/公開鍵
 * @param newKey 新しい暗号化共通鍵/公開鍵
 */
async function migration(
  oldKey: CryptoKey | CryptoKeyPair,
  newKey: CryptoKey | CryptoKeyPair
) {
  // memoDB.recordsでやるとなぜかdecodeHash内でtransactionが終了して失敗してしまうのでidを先に取得
  const indices: string[] = [];
  for await (const id of memoTable.keys()) {
    indices.push(id);
  }
  for (const id of indices) {
    const data = await memoTable.get(id);
    const source = await decodeHash(oldKey, data.hash);
    const hash = await encodeHash(newKey, source);
    await memoTable.put(id, {...data, hash});
  }
}
