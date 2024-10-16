class DB {
  private dbPromise: Promise<IDBDatabase>;

  constructor(
    dbName: string,
    stores: Record<
      string,
      IDBObjectStoreParameters & {
        indices?: Record<
          string,
          IDBIndexParameters & {keyPath?: string | string[]}
        >;
      }
    >,
    version?: number
  ) {
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName, version);
      req.onsuccess = () => {
        resolve(req.result);
      };
      req.onerror = ev => {
        reject(ev);
      };
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const [storeName, {indices, ...storeOptions}] of Object.entries(
          stores
        )) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, storeOptions);
            if (indices) {
              for (const indexName of store.indexNames) {
                if (indexName in indices) {
                  continue;
                }
                store.deleteIndex(indexName);
              }
              for (const [
                indexName,
                {keyPath = indexName, ...indexOptions},
              ] of Object.entries(indices)) {
                if (store.indexNames.contains(indexName)) {
                  const index = store.index(indexName);
                  if (
                    !index.unique === !indexOptions.unique &&
                    !index.multiEntry === !indexOptions.multiEntry &&
                    (typeof keyPath === 'string'
                      ? index.keyPath === keyPath
                      : Array.isArray(index.keyPath) &&
                        keyPath.length === index.keyPath.length &&
                        keyPath.every((k, i) => index.keyPath[i] === k))
                  ) {
                    continue;
                  }
                  store.deleteIndex(indexName);
                }
                store.createIndex(indexName, keyPath, indexOptions);
              }
            }
          }
        }
      };
    });
  }

  private static transaction(
    db: IDBDatabase,
    _storeNames: string | string[],
    mode?: IDBTransactionMode
  ): <T>(proc: (stores: Record<string, IDBObjectStore>) => T) => T {
    const storeNames = Array.isArray(_storeNames) ? _storeNames : [_storeNames];
    return proc => {
      const transacion = db.transaction(storeNames, mode);
      try {
        const stores = Object.fromEntries(
          storeNames.map(storeName => [
            storeName,
            transacion.objectStore(storeName),
          ])
        );
        return proc(stores);
      } catch (ex) {
        transacion.abort();
        throw ex;
      }
    };
  }
  private static request<T>(req: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  private static commit(t: IDBTransaction | null) {
    return new Promise<void>((resolve, reject) => {
      if (!t) {
        reject(new Error('IllegalStateError'));
        return;
      }
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.commit();
    });
  }

  async get(storeName: string, key: IDBValidKey): Promise<unknown> {
    return DB.transaction(
      await this.dbPromise,
      storeName,
      'readonly'
    )(({[storeName]: store}) => DB.request(store.get(key)));
  }

  private async putOrAdd(
    method: 'put' | 'add',
    storeName: string,
    key: IDBValidKey,
    data: unknown
  ): Promise<IDBValidKey> {
    return DB.transaction(
      await this.dbPromise,
      storeName,
      'readwrite'
    )(async ({[storeName]: store}) => {
      const req = store[method](data, key);
      const value = await DB.request(req);
      await DB.commit(req.transaction);
      return value;
    });
  }

  add(
    storeName: string,
    key: IDBValidKey,
    data: unknown
  ): Promise<IDBValidKey> {
    return this.putOrAdd('add', storeName, key, data);
  }
  put(
    storeName: string,
    key: IDBValidKey,
    data: unknown
  ): Promise<IDBValidKey> {
    return this.putOrAdd('put', storeName, key, data);
  }

  async *records(
    storeName: string,
    {
      indexName,
      query,
      direction,
      mode,
    }: {
      indexName?: string;
      query?: IDBValidKey | IDBKeyRange | null;
      direction?: IDBCursorDirection;
      mode?: IDBTransactionMode;
    } = {}
  ) {
    yield* DB.transaction(
      await this.dbPromise,
      storeName,
      mode
    )(async function* ({[storeName]: store}) {
      const index = indexName ? store.index(indexName) : store;
      const req = index.openCursor(query, direction);
      for (;;) {
        const result = await DB.request(req);
        if (!result) {
          break;
        }
        const update = yield [result.primaryKey, result.value];
        if (mode === 'readwrite' && update) {
          await DB.request(result.update(update));
        }
        result.continue();
      }
    });
  }

  async delete(storeName: string, query: IDBValidKey | IDBKeyRange) {
    await DB.transaction(
      await this.dbPromise,
      storeName,
      'readwrite'
    )(({[storeName]: store}) => DB.request(store.delete(query)));
  }

  async count(storeName: string, query: IDBValidKey | IDBKeyRange) {
    return await DB.transaction(
      await this.dbPromise,
      storeName,
      'readonly'
    )(({[storeName]: store}) => DB.request(store.count(query)));
  }

  store<K extends IDBValidKey = IDBValidKey, T = unknown>(storeName: string) {
    const db = this;
    return {
      async get(key: K) {
        const value = await db.get(storeName, key);
        return value as T;
      },
      async add(key: K, data: T) {
        const newKey = await db.add(storeName, key, data);
        return newKey as K;
      },
      async put(key: K, data: T) {
        const newKey = await db.put(storeName, key, data);
        return newKey as K;
      },
      records(options?: {
        indexName?: string;
        query?: IDBValidKey | IDBKeyRange | null;
        direction?: IDBCursorDirection;
        mode?: IDBTransactionMode;
      }) {
        return db.records(storeName, options) as AsyncGenerator<
          [K, T],
          void,
          unknown
        >;
      },
      delete(key: K) {
        return db.delete(storeName, key);
      },
      count(query: IDBValidKey | IDBKeyRange) {
        return db.count(storeName, query);
      },
    };
  }
}

interface Memo {
  title: string;
  hash: string;
  lastModified: Date;
}

const memoDB = new DB('memo', {
  memo: {indices: {lastModified: {}}},
});
const memoTable = memoDB.store<string, Memo>('memo');

async function saveDocument(documentId: string, hash: string) {
  const data = await memoTable.get(documentId).catch(() => undefined);
  if (data?.hash === hash) {
    return;
  }
  await memoTable.put(documentId, {
    title: document.title,
    hash,
    lastModified: new Date(),
  });
}

async function loadDocument(documentId: string): Promise<string> {
  const {hash} = await memoTable.get(documentId);
  await decodeHash(await keyPromise, hash);
  return hash;
}

async function* listDocuments() {
  yield* memoTable.records({indexName: 'lastModified', direction: 'prev'});
}

async function deleteDocument(documentId: string) {
  await memoTable.delete(documentId);
}
