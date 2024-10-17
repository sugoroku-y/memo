interface KeysOptions {
  indexName?: string;
  query?: IDBValidKey | IDBKeyRange | null;
  direction?: IDBCursorDirection;
}

interface RecordsOptions extends KeysOptions {
  mode?: IDBTransactionMode;
}

type AsyncGeneratorForReadonly<
  K extends IDBValidKey = IDBValidKey,
  T = unknown
> = AsyncGenerator<readonly [K, T], void, unknown>;
interface AsyncGeneratorForUpdate<
  K extends IDBValidKey = IDBValidKey,
  T = unknown
> extends AsyncGeneratorForReadonly<K, T> {
  update(value: T): void;
  delete(): void;
  revert(): void;
}

interface Store<K extends IDBValidKey = IDBValidKey, T = unknown> {
  get(key: K): Promise<T>;
  add(key: K, data: T): Promise<K>;
  put(key: K, data: T): Promise<K>;
  keys(options?: KeysOptions): AsyncGenerator<K, void, unknown>;
  records(
    options?: RecordsOptions & {mode: 'readwrite'}
  ): AsyncGeneratorForUpdate<K, T>;
  records(options?: RecordsOptions): AsyncGeneratorForReadonly<K, T>;
  delete(key: K): Promise<void>;
  count(query: IDBValidKey | IDBKeyRange): Promise<number>;
}

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

      DB.addEventListener(req, 'success', () => {
        resolve(req.result);
      });
      DB.addEventListener(req, 'error', ev => {
        reject(ev);
      });
      DB.addEventListener(req, 'upgradeneeded', () => {
        const db = req.result;
        for (const [storeName, {indices, ...storeOptions}] of Object.entries(
          stores
        )) {
          const store = db.objectStoreNames.contains(storeName)
            ? req.transaction!.objectStore(storeName)
            : db.createObjectStore(storeName, storeOptions);
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
      });
    });
  }

  private static addEventListener<E extends keyof IDBTransactionEventMap>(
    request: IDBTransaction,
    type: E,
    listener: (e: IDBTransactionEventMap[E]) => void
  ): void;
  private static addEventListener<E extends keyof IDBOpenDBRequestEventMap>(
    request: IDBOpenDBRequest,
    type: E,
    listener: (e: IDBOpenDBRequestEventMap[E]) => void
  ): void;
  private static addEventListener<E extends keyof IDBRequestEventMap>(
    request: IDBRequest,
    type: E,
    listener: (e: IDBRequestEventMap[E]) => void
  ): void;
  private static addEventListener(
    request: EventTarget,
    type: string,
    listener: EventListener
  ) {
    request.addEventListener(type, listener, {once: true});
  }

  private static transaction(
    db: IDBDatabase,
    _storeNames: string | string[],
    mode?: IDBTransactionMode
  ): {
    <T>(
      proc: (stores: Record<string, IDBObjectStore>) => Promise<T>
    ): Promise<T>;
    <T>(
      proc: (
        stores: Record<string, IDBObjectStore>
      ) => AsyncGenerator<T, void, unknown>
    ): AsyncGenerator<T, void, unknown>;
  } {
    const storeNames = Array.isArray(_storeNames) ? _storeNames : [_storeNames];
    return (proc => {
      let state = '';
      const transacion = db.transaction(storeNames, mode);
      DB.addEventListener(transacion, 'complete', () => {
        state = 'completed';
      });
      DB.addEventListener(transacion, 'abort', () => {
        state = 'aborted';
      });
      const teardown = async () => {
        switch (state) {
          case 'needCommit':
            await new Promise<void>((resolve, reject) => {
              DB.addEventListener(transacion, 'complete', () => resolve());
              DB.addEventListener(transacion, 'error', () =>
                reject(transacion.error)
              );
              transacion.commit();
            });
            break;
          case 'needAbort':
            await new Promise<void>((resolve, reject) => {
              DB.addEventListener(transacion, 'abort', () => resolve());
              DB.addEventListener(transacion, 'error', () =>
                reject(transacion.error)
              );
              transacion.abort();
            });
            break;
        }
      };
      const requestCommit = () => {
        if (!state) {
          state = 'needCommit';
        }
      };
      const requestAbort = (ex: unknown) => {
        if (!state) {
          state = 'needAbort';
        }
        throw ex;
      };
      const stores = Object.fromEntries(
        storeNames.map(storeName => [
          storeName,
          transacion.objectStore(storeName),
        ])
      );
      const r = proc(stores);
      if ('then' in r) {
        return (async () => {
          try {
            const rr = await r;
            requestCommit();
            return rr;
          } catch (ex) {
            requestAbort(ex);
          } finally {
            await teardown();
          }
        })();
      }
      return (async function* () {
        try {
          yield* r;
          requestCommit();
        } catch (ex) {
          requestAbort(ex);
        } finally {
          await teardown();
        }
      })();
    }) as ReturnType<typeof this.transaction>;
  }
  private static request<T>(req: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
      DB.addEventListener(req, 'success', () => resolve(req.result));
      DB.addEventListener(req, 'error', () => reject(req.error));
    });
  }
  private static commit(t: IDBTransaction | null) {
    return new Promise<void>((resolve, reject) => {
      if (!t) {
        reject(new Error('IllegalStateError'));
        return;
      }
      DB.addEventListener(t, 'complete', () => resolve());
      DB.addEventListener(t, 'error', () => reject(t.error));
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

  async *keys(
    storeName: string,
    {indexName, query, direction}: KeysOptions = {}
  ) {
    yield* DB.transaction(
      await this.dbPromise,
      storeName
    )(async function* ({[storeName]: store}) {
      const index = indexName ? store.index(indexName) : store;
      const req = index.openKeyCursor(query, direction);
      for (;;) {
        const result = await DB.request(req);
        if (!result) {
          break;
        }
        yield result.primaryKey;
        result.continue();
      }
    });
  }
  records(
    storeName: string,
    options: RecordsOptions & {mode: 'readwrite'}
  ): AsyncGeneratorForUpdate;
  records(
    storeName: string,
    options?: RecordsOptions
  ): AsyncGeneratorForReadonly;
  records(
    storeName: string,
    {indexName, query, direction, mode}: RecordsOptions = {}
  ): AsyncGeneratorForUpdate {
    const noChange = {};
    const requestDelete = {};
    let newValue: unknown;
    const dbPromise = this.dbPromise;
    return Object.assign(
      (async function* () {
        yield* DB.transaction(
          await dbPromise,
          storeName,
          mode
        )(async function* ({[storeName]: store}): AsyncGeneratorForReadonly {
          const index = indexName ? store.index(indexName) : store;
          const req = index.openCursor(query, direction);
          for (;;) {
            const result = await DB.request(req);
            if (!result) {
              break;
            }
            newValue = noChange;
            yield [result.primaryKey, result.value];
            if (mode === 'readwrite') {
              switch (newValue) {
                case noChange:
                  break;
                case requestDelete:
                  await DB.request(result.delete());
                  break;
                default:
                  await DB.request(result.update(newValue));
                  break;
              }
            }
            result.continue();
          }
        });
      })(),
      {
        update(value: unknown) {
          newValue = value;
        },
        delete() {
          newValue = requestDelete;
        },
        revert() {
          newValue = noChange;
        },
      }
    );
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

  store<K extends IDBValidKey = IDBValidKey, T = unknown>(
    storeName: string
  ): Store<K, T> {
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
      keys(options?: KeysOptions) {
        return db.keys(storeName, options) as AsyncGenerator<K, void, unknown>;
      },
      records(options?: RecordsOptions) {
        return db.records(storeName, options) as AsyncGeneratorForUpdate<K, T>;
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
