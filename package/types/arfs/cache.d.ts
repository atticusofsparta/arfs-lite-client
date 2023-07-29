import { ArweaveAddress } from "../arweave";
import Arweave from "arweave";
import { EntityID } from "./common";
import { ArFSPublicDrive } from "./drive";
import { ArFSPublicFolder } from "./folder";
import { ArFSPublicFile } from "./file";
export interface ArFSPublicDriveCacheKey {
    driveId: EntityID | string;
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
    publicDriveCache: ArFSEntityIDBCache<ArFSPublicDriveCacheKey, ArFSPublicDrive>;
    publicFolderCache: ArFSEntityIDBCache<ArFSPublicFolderCacheKey, ArFSPublicFolder>;
    publicFileCache: ArFSEntityIDBCache<ArFSPublicFileCacheKey, ArFSPublicFile>;
}
export declare class ArFSEntityIDBCache<K, V> {
    private dbPromise;
    private cache;
    private _gatewayApi;
    constructor(capacity: number, arweave?: Arweave);
    cacheKeyString(key: any): string;
    initDatabase(capacity: number): Promise<IDBDatabase>;
    put(key: K, value: V): Promise<V>;
    get(key: K): Promise<V | undefined>;
    remove(key: K): Promise<void>;
    clear(): Promise<void>;
    size(): Promise<number>;
}
export declare class ArFSMetadataIDBCache {
    private static cacheFolderPromise?;
    private static shouldCacheLog;
    private static metadataCacheFolder;
    private static logTag;
    private static dbPromise;
    private static platformCacheFolder;
    private static initDatabase;
    static getCacheFolder(): Promise<string>;
    static put(txId: ArweaveAddress, buffer: Uint8Array): Promise<void>;
    static get(txId: ArweaveAddress): Promise<Uint8Array | undefined>;
    private static getDatabase;
}
export declare const defaultArFSClientCache: ArFSClientCache;
