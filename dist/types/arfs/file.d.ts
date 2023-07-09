/// <reference types="node" />
import { ArweaveAddress, EntityMetaDataTransactionData } from "../arweave";
import { ByteCount, GatewayAPI } from "../common";
import { CustomMetaDataGqlTags, CustomMetaDataJsonFields, GQLNodeInterface, GQLTagInterface } from "../gql";
import { ArFSDataToUpload, ArFSFileOrFolderBuilder, ArFSFileOrFolderEntity, ArFSWithPath, ContentType, CustomMetaData, EntityID, EntityKey, UnixTime } from "./common";
import { FolderHierarchy } from "./folder";
export declare class ArFSPublicFile extends ArFSFileOrFolderEntity<"file"> {
    readonly fileId: EntityID;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: EntityID, name: string, txId: ArweaveAddress, unixTime: UnixTime, parentFolderId: EntityID, fileId: EntityID, size: ByteCount, lastModifiedDate: UnixTime, dataTxId: ArweaveAddress, dataContentType: string, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class ArFSPublicFileWithPaths extends ArFSPublicFile implements ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
    constructor(entity: ArFSPublicFile, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFile extends ArFSFileOrFolderEntity<"file"> {
    readonly fileId: EntityID;
    readonly cipher: string;
    readonly cipherIV: string;
    readonly fileKey: EntityKey;
    readonly driveKey: EntityKey;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: EntityID, name: string, txId: ArweaveAddress, unixTime: UnixTime, parentFolderId: EntityID, fileId: EntityID, size: ByteCount, lastModifiedDate: UnixTime, dataTxId: ArweaveAddress, dataContentType: string, cipher: string, cipherIV: string, fileKey: EntityKey, driveKey: EntityKey, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
    get encryptedDataSize(): ByteCount;
}
export declare class ArFSPrivateFileWithPaths extends ArFSPrivateFile implements ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
    constructor(entity: ArFSPrivateFile, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFileWithPathsKeyless extends ArFSPrivateFileWithPaths {
    driveKey: EntityKey;
    fileKey: EntityKey;
    constructor(entity: ArFSPrivateFile, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFileKeyless extends ArFSPrivateFile {
    driveKey: EntityKey;
    fileKey: EntityKey;
    constructor(entity: ArFSPrivateFile);
}
export interface FileMetaDataTransactionData extends EntityMetaDataTransactionData {
    name: string;
    size: number;
    lastModifiedDate: number;
    dataTxId: string;
    dataContentType: string;
}
export declare abstract class ArFSFileBuilder<T extends ArFSPublicFile | ArFSPrivateFile> extends ArFSFileOrFolderBuilder<"file", T> {
    size?: ByteCount;
    lastModifiedDate?: UnixTime;
    dataTxId?: ArweaveAddress;
    dataContentType?: string;
    getGqlQueryParameters(): GQLTagInterface[];
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected readonly protectedDataJsonKeys: string[];
}
export declare class ArFSPublicFileBuilder extends ArFSFileBuilder<ArFSPublicFile> {
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI): ArFSPublicFileBuilder;
    protected buildEntity(): Promise<ArFSPublicFile>;
}
export declare class ArFSPrivateFileBuilder extends ArFSFileBuilder<ArFSPrivateFile> {
    readonly fileId: EntityID;
    private readonly driveKey;
    readonly owner?: ArweaveAddress | undefined;
    readonly fileKey?: EntityKey | undefined;
    cipher?: string;
    cipherIV?: string;
    constructor(fileId: EntityID, gatewayApi: GatewayAPI, driveKey: EntityKey, owner?: ArweaveAddress | undefined, fileKey?: EntityKey | undefined);
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI, driveKey: EntityKey): ArFSPrivateFileBuilder;
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected buildEntity(): Promise<ArFSPrivateFile>;
}
type BaseName = string;
export interface FileInfo {
    dataContentType: string;
    lastModifiedDateMS: UnixTime;
    fileSize: ByteCount;
}
export declare class ArFSFileToUpload extends ArFSDataToUpload {
    readonly filePath: FileSystemEntry;
    readonly fileStats: File;
    readonly customContentType?: string | undefined;
    readonly customMetaData?: CustomMetaData | undefined;
    constructor(filePath: FileSystemEntry, fileStats: File, customContentType?: string | undefined, customMetaData?: CustomMetaData | undefined);
    readonly sourceUri = "";
    gatherFileInfo(): FileInfo;
    get size(): ByteCount;
    get lastModifiedDate(): UnixTime;
    getFileDataBuffer(): Promise<Buffer>;
    get contentType(): string;
    getBaseName(): BaseName;
    /** Computes the size of a private file encrypted with AES256-GCM */
    encryptedDataSize(): ByteCount;
}
export {};
