declare class mt {
    constructor(t: any, e?: {
        ownerCache: R;
        driveIdCache: R;
        publicDriveCache: R;
        publicFolderCache: R;
        publicFileCache: R;
    }, i?: h);
    caches: {
        ownerCache: R;
        driveIdCache: R;
        publicDriveCache: R;
        publicFolderCache: R;
        publicFileCache: R;
    };
    gatewayApi: h;
    _arweave: any;
    _gatewayApi: h;
    _caches: {
        ownerCache: R;
        driveIdCache: R;
        publicDriveCache: R;
        publicFolderCache: R;
        publicFileCache: R;
    };
    appName: string;
    appVersion: string;
    getOwnerForDriveId(t: any): Promise<any>;
    getDriveIDForEntityId(t: any, e: any): Promise<any>;
    getDriveOwnerForFolderId(t: any): Promise<any>;
    getDriveIdForFolderId(t: any): Promise<any>;
    getDriveOwnerForFileId(t: any): Promise<any>;
    getDriveIdForFileId(t: any): Promise<any>;
    getDriveIdForEntityID(t: any): Promise<any>;
    getPublicDrive({ driveId: t, owner: e }: {
        driveId: any;
        owner: any;
    }): Promise<any>;
    getPublicFolder({ folderId: t, owner: e }: {
        folderId: any;
        owner: any;
    }): Promise<any>;
    getPublicFile({ fileId: t, owner: e }: {
        fileId: any;
        owner: any;
    }): Promise<any>;
    getAllDrivesForAddress({ address: t, privateKeyData: e, latestRevisionsOnly: i }: {
        address: any;
        privateKeyData: any;
        latestRevisionsOnly?: boolean | undefined;
    }): Promise<any[]>;
    getPublicFilesWithParentFolderIds(t: any, e: any, i?: boolean): Promise<any[]>;
    getAllFoldersOfPublicDrive({ driveId: t, owner: e, latestRevisionsOnly: i }: {
        driveId: any;
        owner: any;
        latestRevisionsOnly?: boolean | undefined;
    }): Promise<any[]>;
    listPublicFolder({ folderId: t, maxDepth: e, includeRoot: i, owner: r }: {
        folderId: any;
        maxDepth: any;
        includeRoot: any;
        owner: any;
    }): Promise<(_ | B)[]>;
}
declare class f {
    constructor(t: any);
    address: any;
    equals(t: any): boolean;
    toString(): any;
    valueOf(): any;
    toJSON(): any;
}
declare class w {
    constructor({ password: t, driveKeys: e, wallet: i }: {
        password: any;
        driveKeys: any;
        wallet: any;
    });
    driveKeyCache: {};
    unverifiedDriveKeys: any;
    password: any;
    wallet: any;
    safelyDecryptToJson(e: any, o: any, n: any, d: any): Promise<any>;
    decryptToJson(t: any, e: any, r: any): Promise<any>;
    driveKeyForDriveId(t: any): any;
}
declare class R {
    constructor(t: any, e: any);
    dbPromise: Promise<any>;
    cache: any;
    _gatewayApi: h;
    cacheKeyString(t: any): string;
    initDatabase(t: any): Promise<any>;
    put(t: any, e: any): Promise<any>;
    get(t: any): Promise<any>;
    remove(t: any): Promise<any>;
    clear(): Promise<any>;
    size(): Promise<any>;
}
declare class h {
    constructor({ gatewayUrl: t, maxRetriesPerRequest: i, initialErrorDelayMS: r, fatalErrors: s, validStatusCodes: a, axiosInstance: o }: {
        gatewayUrl: any;
        maxRetriesPerRequest?: number | undefined;
        initialErrorDelayMS?: number | undefined;
        fatalErrors?: string[] | undefined;
        validStatusCodes?: number[] | undefined;
        axiosInstance?: import("axios").AxiosInstance | undefined;
    });
    lastError: string;
    lastRespStatus: number;
    gatewayUrl: any;
    maxRetriesPerRequest: number;
    initialErrorDelayMS: number;
    fatalErrors: string[];
    validStatusCodes: number[];
    axiosInstance: import("axios").AxiosInstance;
    postChunk(t: any): Promise<void>;
    postTxHeader(t: any): Promise<void>;
    gqlRequest(t: any): Promise<any>;
    postToEndpoint(t: any, e: any): Promise<any>;
    getTransaction(t: any): Promise<any>;
    getTxData(t: any): Promise<any>;
    retryRequestUntilMaxRetries(t: any): Promise<any>;
    tryRequest(t: any): Promise<any>;
    isRequestSuccessful(): boolean;
    throwIfFatalError(): void;
    exponentialBackOffAfterFailedRequest(t: any): Promise<void>;
    rateLimitThrottle(): Promise<void>;
}
declare class _ extends J {
    constructor(t: any, e: any);
    path: string;
    txIdPath: string;
    entityIdPath: string;
}
declare class B extends G {
    constructor(t: any, e: any);
    path: string;
    txIdPath: string;
    entityIdPath: string;
}
declare class J extends S {
    constructor(t: any, e: any, i: any, r: any, s: any, a: any, o: any, n: any, d: any, h: any, c: any, l: any, u: any, p: any, y: any, v: any);
    fileId: any;
}
declare class G extends S {
    constructor(t: any, e: any, i: any, r: any, s: any, a: any, o: any, n: any, d: any, h: any, l: any, u: any);
    folderId: any;
}
declare class S extends x {
    constructor(t: any, e: any, i: any, r: any, s: any, a: any, o: any, n: any, d: any, h: any, c: any, l: any, u: any, p: any, y: any, v: any, m: any);
    size: any;
    lastModifiedDate: any;
    dataTxId: any;
    dataContentType: any;
    parentFolderId: any;
    entityId: any;
}
declare class x {
    constructor(t: any, e: any, i: any, r: any, s: any, a: any, o: any, n: any, d: any, h: any, c: any);
    appName: any;
    appVersion: any;
    arFS: any;
    contentType: any;
    driveId: any;
    entityType: any;
    name: any;
    txId: any;
    unixTime: any;
    customMetaDataGqlTags: any;
    customMetaDataJson: any;
}
export { mt as ArFSClient, f as ArweaveAddress, w as PrivateKeyData };
