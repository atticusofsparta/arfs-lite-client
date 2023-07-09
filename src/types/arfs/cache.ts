import { gatewayUrlForArweave } from "src/utils/common";
import { ArweaveAddress } from "../arweave";
import { GatewayAPI } from "../common";
import Arweave from "arweave";
import { EntityID } from "./common";
import { ArFSPublicDrive } from "./drive";
import { ArFSPublicFolder } from "./folder";
import { ArFSPublicFile } from "./file";

export interface ArFSPublicDriveCacheKey {
  driveId: EntityID;
  owner: ArweaveAddress;
}

export interface ArFSPublicFolderCacheKey {
  folderId: EntityID;
  owner: ArweaveAddress;
}

export interface ArFSPublicFileCacheKey {
  fileId: EntityID;
  owner: ArweaveAddress;
}

export interface ArFSClientCache {
  ownerCache: ArFSEntityIDBCache<EntityID, ArweaveAddress>;
  driveIdCache: ArFSEntityIDBCache<EntityID, EntityID>;
  publicDriveCache: ArFSEntityIDBCache<
    ArFSPublicDriveCacheKey,
    ArFSPublicDrive
  >;
  publicFolderCache: ArFSEntityIDBCache<
    ArFSPublicFolderCacheKey,
    ArFSPublicFolder
  >;
  publicFileCache: ArFSEntityIDBCache<ArFSPublicFileCacheKey, ArFSPublicFile>;
}

export class ArFSEntityIDBCache<K, V> {
  private dbPromise: Promise<IDBDatabase>;
  private cache = new IDBDatabase();
  private _gatewayApi: GatewayAPI;

  constructor(capacity: number, arweave?: Arweave) {
    this.dbPromise = this.initDatabase(capacity);
    this.initDatabase(capacity).then((db) => {
      this.cache = db;
    });
    this._gatewayApi = new GatewayAPI({
      gatewayUrl: gatewayUrlForArweave(arweave ?? Arweave.init({})),
    });
  }

  cacheKeyString(key: K): string {
    // Note: This implementation may not sufficiently differentiate keys
    // for certain object types depending on their toJSON implementation
    return typeof key === "string" ? key : JSON.stringify(key);
  }

  async initDatabase(capacity: number): Promise<IDBDatabase> {
    const dbName = "arfs-entity-cache-db";
    const version = 1;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = (event) => {
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const objectStore = db.createObjectStore("cache", { keyPath: "key" });
        objectStore.createIndex("key", "key", { unique: true });
        objectStore.createIndex("value", "value");
      };

      request.onsuccess = (event) => {
        resolve(request.result);
      };
    });
  }

  async put(key: K, value: Promise<V>): Promise<V> {
    const cacheKey = this.cacheKeyString(key);
    const db = await this.dbPromise;

    return new Promise<V>((resolve, reject) => {
      const transaction = db.transaction("cache", "readwrite");
      const objectStore = transaction.objectStore("cache");

      const request = objectStore.put({ key: cacheKey, value: value });

      request.onsuccess = (event) => {
        resolve(value);
      };

      request.onerror = (event) => {
        reject(request.error);
      };
    });
  }

  async get(key: K): Promise<V | undefined> {
    const cacheKey = this.cacheKeyString(key);
    const db = await this.dbPromise;

    return new Promise<V | undefined>((resolve, reject) => {
      const transaction = db.transaction("cache", "readonly");
      const objectStore = transaction.objectStore("cache");
      const index = objectStore.index("key");

      const request = index.get(cacheKey);

      request.onsuccess = (event) => {
        const result = request.result;
        if (result) {
          resolve(result.value);
        } else {
          resolve(undefined);
        }
      };

      request.onerror = (event) => {
        reject(request.error);
      };
    });
  }

  async remove(key: K): Promise<void> {
    const cacheKey = this.cacheKeyString(key);
    const db = await this.dbPromise;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("cache", "readwrite");
      const objectStore = transaction.objectStore("cache");
      const index = objectStore.index("key");

      const request = index.getKey(cacheKey);

      request.onsuccess = (event) => {
        const result = request.result;
        if (result !== undefined) {
          const deleteRequest = objectStore.delete(result);
          deleteRequest.onsuccess = () => {
            resolve();
          };
          deleteRequest.onerror = () => {
            reject(deleteRequest.error);
          };
        } else {
          resolve();
        }
      };

      request.onerror = (event) => {
        reject(request.error);
      };
    });
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("cache", "readwrite");
      const objectStore = transaction.objectStore("cache");

      const request = objectStore.clear();

      request.onsuccess = (event) => {
        resolve();
      };

      request.onerror = (event) => {
        reject(request.error);
      };
    });
  }

  async size(): Promise<number> {
    const db = await this.dbPromise;

    return new Promise<number>((resolve, reject) => {
      const transaction = db.transaction("cache", "readonly");
      const objectStore = transaction.objectStore("cache");

      const request = objectStore.count();

      request.onsuccess = (event) => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(request.error);
      };
    });
  }
}

export class ArFSMetadataIDBCache {
  private static cacheFolderPromise?: Promise<string>;
  private static shouldCacheLog = process.env["ARDRIVE_CACHE_LOG"] === "1";
  private static metadataCacheFolder =
    ArFSMetadataIDBCache.platformCacheFolder();
  private static logTag = "[Metadata Cache] ";
  private static dbPromise: Promise<IDBDatabase>;

  private static platformCacheFolder(): string {
    return "metadata"; // Replace with the desired cache folder path
  }

  private static async initDatabase(): Promise<IDBDatabase> {
    const dbName = "arfs-metadata-cache-db";
    const version = 1;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = (event) => {
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const objectStore = db.createObjectStore("cache", { keyPath: "txId" });
        objectStore.createIndex("txId", "txId", { unique: true });
        objectStore.createIndex("buffer", "buffer");
      };

      request.onsuccess = (event) => {
        resolve(request.result);
      };
    });
  }

  static async getCacheFolder(): Promise<string> {
    if (this.cacheFolderPromise) {
      return this.cacheFolderPromise;
    }

    this.cacheFolderPromise = new Promise<string>((resolve) => {
      resolve(this.metadataCacheFolder);
    });

    return this.cacheFolderPromise;
  }

  static async put(txId: ArweaveAddress, buffer: Buffer): Promise<void> {
    const db = await this.getDatabase();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("cache", "readwrite");
      const objectStore = transaction.objectStore("cache");

      const request = objectStore.put({ txId: txId, buffer: buffer });

      request.onsuccess = (event) => {
        resolve();
      };

      request.onerror = (event) => {
        reject(request.error);
      };
    });
  }

  static async get(txId: ArweaveAddress): Promise<Buffer | undefined> {
    const db = await this.getDatabase();

    return new Promise<Buffer | undefined>((resolve, reject) => {
      const transaction = db.transaction("cache", "readonly");
      const objectStore = transaction.objectStore("cache");
      const index = objectStore.index("txId");

      const request = index.get(txId.toString());

      request.onsuccess = (event) => {
        const result = request.result;
        if (result) {
          resolve(result.buffer);
        } else {
          resolve(undefined);
        }
      };

      request.onerror = (event) => {
        reject(request.error);
      };
    });
  }

  private static async getDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = this.initDatabase();

    return this.dbPromise;
  }
}

export const defaultArFSClientCache: ArFSClientCache = {
  ownerCache: new ArFSEntityIDBCache<EntityID, ArweaveAddress>(10),
  driveIdCache: new ArFSEntityIDBCache<EntityID, EntityID>(10),
  publicDriveCache: new ArFSEntityIDBCache<
    ArFSPublicDriveCacheKey,
    ArFSPublicDrive
  >(10),
  publicFolderCache: new ArFSEntityIDBCache<
    ArFSPublicFolderCacheKey,
    ArFSPublicFolder
  >(10),
  publicFileCache: new ArFSEntityIDBCache<
    ArFSPublicFileCacheKey,
    ArFSPublicFile
  >(10),
};
