/// <reference types="node" />
import { FileConflictInfo, NameConflictInfo } from "src/utils/common";
import { ArweaveAddress, PrivateKeyData, Winston } from "../arweave";
import { UnionOfObjectPropertiesType, Equatable, ByteCount, GatewayAPI, MakeOptional } from "../common";
import { CustomMetaDataGqlTags, CustomMetaDataJsonFields, CustomMetaDataTagInterface, GQLNodeInterface, GQLTagInterface } from "../gql";
import { ArFSFolderToUpload, ArFSListPublicFolderParams, ArFSPublicFolderWithPaths, FolderHierarchy } from "./folder";
import { ArFSFileToUpload, ArFSPublicFileWithPaths, FileInfo } from "./file";
import { PrivateDriveKeyData } from "./drive";
export declare const cipherTypeValues: {
    readonly AES_GCM_256: "aes-gcm-256";
    readonly AES_256_GCM: "AES256-GCM";
};
export declare const entityTypeValues: {
    readonly DRIVE: "drive";
    readonly FILE: "file";
    readonly FOLDER: "folder";
};
export declare const contentTypeValues: {
    readonly APPLICATION_JSON: "application/json";
    readonly APPLICATION_OCTET_STREAM: "application/octet-stream";
};
export declare const drivePrivacyValues: {
    readonly PRIVATE: "private";
    readonly PUBLIC: "public";
};
export declare const driveAuthModeValues: {
    readonly PASSWORD: "password";
};
export declare const driveSharingValues: {
    readonly SHARED: "shared";
    readonly PERSONAL: "personal";
};
export declare const syncStatusValues: {
    readonly READY_TO_DOWNLOAD: 0;
    readonly READY_TO_UPLOAD: 1;
    readonly GETTING_MINED: 2;
    readonly SUCCESSFULLY_UPLOADED: 3;
};
export declare const yesNoIntegerValues: {
    readonly NO: 0;
    readonly YES: 1;
};
export type CipherType = UnionOfObjectPropertiesType<typeof cipherTypeValues>;
export type EntityType = UnionOfObjectPropertiesType<typeof entityTypeValues>;
export type ContentType = UnionOfObjectPropertiesType<typeof contentTypeValues>;
export type DrivePrivacy = UnionOfObjectPropertiesType<typeof drivePrivacyValues>;
export type DriveAuthMode = UnionOfObjectPropertiesType<typeof driveAuthModeValues>;
export type DriveSharing = UnionOfObjectPropertiesType<typeof driveSharingValues>;
export type SyncStatus = UnionOfObjectPropertiesType<typeof syncStatusValues>;
export type YesNoInteger = UnionOfObjectPropertiesType<typeof yesNoIntegerValues>;
export declare class EntityID implements Equatable<EntityID> {
    protected entityId: string;
    constructor(entityId: string);
    [Symbol.toPrimitive](hint?: string): string;
    toString(): string;
    valueOf(): string;
    equals(entityId: EntityID): boolean;
    toJSON(): string;
}
export declare function EID(entityId: string): EntityID;
export declare class UnixTime implements Equatable<UnixTime> {
    private readonly unixTime;
    constructor(unixTime: number);
    equals(unixTime: UnixTime): boolean;
    [Symbol.toPrimitive](hint?: string): number | string;
    toString(): string;
    valueOf(): number;
    toJSON(): number;
}
export declare class EntityKey {
    readonly keyData: Buffer;
    constructor(keyData: Buffer);
    toString(): string;
    toJSON(): string;
}
export declare class ArFSEntity {
    readonly appName: string;
    readonly appVersion: string;
    readonly arFS: string;
    readonly contentType: ContentType;
    readonly driveId: EntityID;
    readonly entityType: EntityType;
    readonly name: string;
    readonly txId: ArweaveAddress;
    readonly unixTime: UnixTime;
    readonly customMetaDataGqlTags?: CustomMetaDataGqlTags;
    readonly customMetaDataJson?: CustomMetaDataJsonFields;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: EntityID, entityType: EntityType, name: string, txId: ArweaveAddress, unixTime: UnixTime, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export interface ArFSFileFolderEntity extends ArFSEntity {
    parentFolderId: EntityID;
    entityId: EntityID;
    lastModifiedDate: UnixTime;
}
export declare abstract class ArFSFileOrFolderEntity<T extends 'file' | 'folder'> extends ArFSEntity implements ArFSFileFolderEntity {
    readonly entityType: T;
    size: ByteCount;
    lastModifiedDate: UnixTime;
    dataTxId: ArweaveAddress;
    dataContentType: string;
    readonly parentFolderId: EntityID;
    readonly entityId: EntityID;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: EntityID, entityType: T, name: string, size: ByteCount, txId: ArweaveAddress, unixTime: UnixTime, lastModifiedDate: UnixTime, dataTxId: ArweaveAddress, dataContentType: string, parentFolderId: EntityID, entityId: EntityID, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export interface ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
}
export interface ArFSMetadataEntityBuilderParams {
    entityId: EntityID;
    gatewayApi: GatewayAPI;
    owner?: ArweaveAddress;
}
export type ArFSPublicMetadataEntityBuilderParams = ArFSMetadataEntityBuilderParams;
export interface ArFSPrivateMetadataEntityBuilderParams extends ArFSMetadataEntityBuilderParams {
    key: EntityKey;
}
export type ArFSMetadataEntityBuilderFactoryFunction<T extends ArFSEntity, B extends ArFSMetadataEntityBuilder<T>, P extends ArFSMetadataEntityBuilderParams> = (params: P) => B;
export interface CustomMetaData {
    /** Include custom metadata on MetaData Tx Data JSON */
    metaDataJson?: CustomMetaDataJsonFields;
    /** Include custom metadata on MetaData Tx GQL Tags */
    metaDataGqlTags?: CustomMetaDataGqlTags;
    /** Include custom metadata on File Data Tx GQL Tags */
    dataGqlTags?: CustomMetaDataTagInterface;
}
export declare abstract class ArFSMetadataEntityBuilder<T extends ArFSEntity> {
    appName?: string;
    appVersion?: string;
    arFS?: string;
    contentType?: ContentType;
    driveId?: EntityID;
    entityType?: EntityType;
    name?: string;
    txId?: ArweaveAddress;
    unixTime?: UnixTime;
    protected readonly entityId: EntityID;
    protected readonly gatewayApi: GatewayAPI;
    protected readonly owner?: ArweaveAddress;
    customMetaData: CustomMetaData;
    constructor({ entityId, gatewayApi, owner, }: ArFSMetadataEntityBuilderParams);
    abstract getGqlQueryParameters(): GQLTagInterface[];
    protected abstract buildEntity(): Promise<T>;
    getDataForTxID(txId: ArweaveAddress): Promise<Buffer>;
    /**
     * Parses data for builder fields from either the provided GQL tags, or from a fresh request to Arweave for tag data
     *
     * @param node (optional) a pre-fetched GQL node containing the txID and tags that will be parsed out of the on-chain data
     *
     * @param owner (optional) filter all transactions out by owner's public arweave address
     *
     * @returns an array of unparsed tags
     */
    protected parseFromArweaveNode(node?: GQLNodeInterface, owner?: ArweaveAddress): Promise<GQLTagInterface[]>;
    build(node?: GQLNodeInterface): Promise<T>;
    private parseCustomMetaDataFromGqlTags;
    protected abstract protectedDataJsonKeys: string[];
    protected parseCustomMetaDataFromDataJson(dataJson: CustomMetaDataJsonFields): void;
}
export declare abstract class ArFSFileOrFolderBuilder<U extends "file" | "folder", T extends ArFSFileOrFolderEntity<U>> extends ArFSMetadataEntityBuilder<T> {
    parentFolderId?: EntityID;
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
}
interface ArFSTagSettingsParams {
    appName?: string;
    appVersion?: string;
    arFSVersion?: string;
}
export declare class ArFSTagSettings {
    private readonly appName;
    private readonly appVersion;
    private readonly arFSVersion;
    static protectedArFSGqlTagNames: ("ArFS" | "File-Id" | "Folder-Id" | "Drive-Id" | "Entity-Type" | "Parent-Folder-Id" | "Content-Type" | "Cipher" | "Cipher-IV" | "Tip-Type" | "Boost" | "Bundle-Format" | "Bundle-Version" | "Unix-Time" | "Drive-Privacy" | "Drive-Auth-Mode")[];
    constructor({ appName, appVersion, arFSVersion, }: ArFSTagSettingsParams);
    get baseAppTags(): GQLTagInterface[];
    get baseArFSTags(): GQLTagInterface[];
    get baseBundleTags(): GQLTagInterface[];
    /**
     * Used for estimating byte count of data items to bypass storing the Buffer from ArFSFileDataPrototype
     *
     * TODO: Don't use the file data Buffer in ArFSFileDataPrototype so it can be used in estimation without memory concerns
     */
    getFileDataItemTags(isPrivate: boolean, dataContentType: string): GQLTagInterface[];
}
export interface ArFSEncryptedData {
    cipher: string;
    cipherIV: string;
    data: Buffer;
}
export type ArFSEntityDataType = "drive" | "folder" | "file" | "bundle";
export interface ArFSEntityData {
    type: ArFSEntityDataType;
    sourceUri?: string;
    entityName?: string;
    bundleTxId?: ArweaveAddress;
    metadataTxId?: ArweaveAddress;
    bundledIn?: ArweaveAddress;
    dataTxId?: ArweaveAddress;
    entityId?: ArweaveAddress;
    key?: EntityKey;
}
export type ListPublicFolderParams = MakeOptional<ArFSListPublicFolderParams, "maxDepth" | "includeRoot" | "owner">;
export type ListPrivateFolderParams = ListPublicFolderParams & WithDriveKey;
export interface TipData {
    txId: ArweaveAddress;
    recipient: ArweaveAddress;
    winston: Winston;
}
export interface TipResult {
    tipData: TipData;
    reward: Winston;
}
export type ArFSFees = {
    [key: string]: Winston;
};
export interface ArFSResult {
    created: ArFSEntityData[];
    tips: TipData[];
    fees: ArFSFees;
}
export interface ArFSManifestResult extends ArFSResult {
    manifest: Manifest | Record<string, never>;
    links: string[];
}
export declare const emptyArFSResult: ArFSResult;
export declare const emptyManifestResult: ArFSManifestResult;
export interface MetaDataBaseCosts {
    metaDataBaseReward: Winston;
}
export interface RecursivePublicBulkUploadParams {
    parentFolderId: EntityID;
    wrappedFolder: ArFSFolderToUpload;
    driveId: EntityID;
    owner: ArweaveAddress;
}
export type RecursivePrivateBulkUploadParams = RecursivePublicBulkUploadParams & WithDriveKey;
export interface UploadPublicManifestParams {
    folderId: EntityID;
    maxDepth?: number;
    destManifestName?: string;
    conflictResolution?: FileNameConflictResolution;
    prompts?: FileConflictPrompts;
}
export interface CreatePublicManifestParams extends Required<UploadPublicManifestParams> {
    driveId: EntityID;
    owner: ArweaveAddress;
}
export interface CreatePublicFolderParams {
    folderName: string;
    parentFolderId: EntityID;
    /** @deprecated ArFS cache makes passing driveId here redundant. This parameter makes the api confusing and will no longer used */
    driveId?: EntityID;
}
export type CreatePrivateFolderParams = CreatePublicFolderParams & WithDriveKey;
export interface UploadParams {
    parentFolderId: EntityID;
    conflictResolution?: FileNameConflictResolution;
}
/** Upload stats required for uploading entities with the ArDrive class */
export interface ArDriveUploadStats<T = ArFSDataToUpload | ArFSFolderToUpload> {
    wrappedEntity: T;
    destFolderId: EntityID;
    destName?: string;
    driveKey?: EntityID;
}
/** Upload stats as determined by the ArDrive class */
export interface UploadStats<T = ArFSDataToUpload | ArFSFolderToUpload> extends ArDriveUploadStats<T> {
    destDriveId: EntityID;
    owner: ArweaveAddress;
}
export type FileUploadStats = UploadStats<ArFSDataToUpload>;
export type FolderUploadStats = UploadStats<ArFSFolderToUpload>;
export interface UploadAllEntitiesParams {
    entitiesToUpload: ArDriveUploadStats[];
    conflictResolution?: FileNameConflictResolution;
    prompts?: FolderConflictPrompts;
}
export interface ResolveBulkConflictsParams extends UploadAllEntitiesParams {
    entitiesToUpload: UploadStats[];
    conflictResolution: FileNameConflictResolution;
}
export interface BulkPublicUploadParams extends UploadParams {
    wrappedFolder: ArFSFolderToUpload;
    parentFolderId: EntityID;
    prompts?: FolderConflictPrompts;
    destParentFolderName?: string;
}
export type BulkPrivateUploadParams = BulkPublicUploadParams & WithDriveKey;
export interface UploadPublicFileParams extends UploadParams {
    wrappedFile: ArFSFileToUpload;
    prompts?: FileConflictPrompts;
    destinationFileName?: string;
}
export type UploadPrivateFileParams = UploadPublicFileParams & WithDriveKey;
export interface CommunityTipParams {
    communityWinstonTip: Winston;
    assertBalance?: boolean;
}
interface MoveParams {
    newParentFolderId: EntityID;
}
export interface MovePublicFileParams extends MoveParams {
    fileId: EntityID;
}
export type MovePrivateFileParams = MovePublicFileParams & WithDriveKey;
export interface MovePublicFolderParams extends MoveParams {
    folderId: EntityID;
}
export type MovePrivateFolderParams = MovePublicFolderParams & WithDriveKey;
export interface CreatePublicDriveParams {
    driveName: string;
}
export interface CreatePrivateDriveParams extends CreatePublicDriveParams {
    newPrivateDriveData: PrivateDriveKeyData;
}
interface GetEntityParams {
    owner?: ArweaveAddress;
}
export interface GetPublicDriveParams extends GetEntityParams {
    driveId: EntityID;
}
export type GetPrivateDriveParams = GetPublicDriveParams & {
    withKeys?: boolean;
} & WithDriveKey;
export interface GetPublicFolderParams extends GetEntityParams {
    folderId: EntityID;
}
export type GetPrivateFolderParams = GetPublicFolderParams & {
    withKeys?: boolean;
} & WithDriveKey;
export interface GetPublicFileParams extends GetEntityParams {
    fileId: EntityID;
}
export type GetPrivateFileParams = GetPublicFileParams & {
    withKeys?: boolean;
} & WithDriveKey;
export interface GetAllDrivesForAddressParams {
    address: ArweaveAddress;
    privateKeyData: PrivateKeyData;
}
export interface ManifestPathMap {
    [index: string]: {
        id: string;
    };
}
export interface Manifest {
    /** manifest must be 'arweave/paths' */
    manifest: "arweave/paths";
    /** version must be 0.1.0 */
    version: "0.1.0";
    /** index contains the default path that will redirected when the user access the manifest transaction itself */
    index: {
        path: string;
    };
    /** paths is an object of path objects */
    paths: ManifestPathMap;
}
export interface DownloadPublicFileParameters {
    fileId: EntityID;
    destFolderPath: string;
    defaultFileName?: string;
}
export type DownloadPrivateFileParameters = DownloadPublicFileParameters & WithDriveKey;
export interface DownloadPublicFolderParameters {
    folderId: EntityID;
    destFolderPath: string;
    customFolderName?: string;
    maxDepth: number;
    owner?: ArweaveAddress;
}
export type DownloadPrivateFolderParameters = DownloadPublicFolderParameters & WithDriveKey;
export interface DownloadPublicDriveParameters {
    driveId: EntityID;
    destFolderPath: string;
    customFolderName?: string;
    maxDepth: number;
    owner?: ArweaveAddress;
}
export type DownloadPrivateDriveParameters = DownloadPublicDriveParameters & WithDriveKey;
export interface RenamePublicFileParams {
    fileId: EntityID;
    newName: string;
}
export type RenamePrivateFileParams = RenamePublicFileParams & WithDriveKey;
export interface RenamePublicFolderParams {
    folderId: EntityID;
    newName: string;
}
export type RenamePrivateFolderParams = RenamePublicFolderParams & WithDriveKey;
export interface RenamePublicDriveParams {
    driveId: EntityID;
    newName: string;
}
export type RenamePrivateDriveParams = RenamePublicDriveParams & WithDriveKey;
export interface BasePublicFileRetryParams {
    wrappedFile: ArFSFileToUpload;
    dataTxId: ArweaveAddress;
}
export interface RetryPublicArFSFileByFileIdParams extends BasePublicFileRetryParams {
    fileId: EntityID;
}
export interface RetryPublicArFSFileByDestFolderIdParams extends BasePublicFileRetryParams {
    conflictResolution?: FileNameConflictResolution;
    destinationFolderId: EntityID;
}
export interface RetryPublicArFSFileParams extends BasePublicFileRetryParams {
    createMetaDataPlan?: ArFSCreateFileMetaDataV2Plan;
    metaDataTxId?: ArweaveAddress;
    fileId?: EntityID;
}
export interface ArFSAllPublicFoldersOfDriveParams {
    driveId: EntityID;
    owner: ArweaveAddress;
    latestRevisionsOnly: boolean;
}
export type ArFSAllPrivateFoldersOfDriveParams = ArFSAllPublicFoldersOfDriveParams & WithDriveKey;
export type WithDriveKey = {
    driveKey: EntityKey;
};
export interface ArFSDownloadPublicFolderParams {
    folderId: EntityID;
    destFolderPath: string;
    customFolderName?: string;
    maxDepth: number;
    owner: ArweaveAddress;
}
export interface ArFSDownloadPrivateFolderParams {
    folderId: EntityID;
    destFolderPath: string;
    customFolderName?: string;
    maxDepth: number;
    owner: ArweaveAddress;
    driveKey: EntityKey;
}
export interface SeparatedFolderHierarchy<FileType, FolderType> {
    hierarchy: FolderHierarchy;
    childFiles: FileType[];
    childFolders: FolderType[];
}
export interface ArFSRetryPublicFileUploadParams {
    wrappedFile: ArFSFileToUpload;
    arFSDataTxId: ArweaveAddress;
    createMetaDataPlan?: ArFSCreateFileMetaDataV2Plan;
}
export interface ArFSCreateFileMetaDataV2Plan {
    rewardSettings: RewardSettings;
    destinationFolderId: EntityID;
    fileId?: EntityID;
}
export declare const skipOnConflicts = "skip";
export declare const replaceOnConflicts = "replace";
export declare const upsertOnConflicts = "upsert";
export declare const askOnConflicts = "ask";
export declare const renameOnConflicts = "rename";
export declare const useExistingFolder = "useFolder";
export declare const errorOnConflict = "error";
/** Conflict settings used by ArDrive class */
export type FileNameConflictResolution = typeof skipOnConflicts | typeof replaceOnConflicts | typeof upsertOnConflicts | typeof askOnConflicts;
export interface ConflictPromptParams {
    namesWithinDestFolder: string[];
}
export interface FileConflictPromptParams extends ConflictPromptParams {
    fileName: string;
    fileId: EntityID;
}
export interface FileToFileConflictPromptParams extends FileConflictPromptParams {
    hasSameLastModifiedDate: boolean;
}
export interface FolderConflictPromptParams extends ConflictPromptParams {
    folderName: string;
    folderId: EntityID;
}
export type FileToFileNameConflictPrompt = (params: FileToFileConflictPromptParams) => Promise<{
    resolution: typeof skipOnConflicts | typeof replaceOnConflicts;
} | {
    resolution: typeof renameOnConflicts;
    newFileName: string;
}>;
export type FileToFolderConflictAskPrompt = (params: FolderConflictPromptParams) => Promise<{
    resolution: typeof skipOnConflicts;
} | {
    resolution: typeof renameOnConflicts;
    newFileName: string;
}>;
export type FolderToFileConflictAskPrompt = (params: FileConflictPromptParams) => Promise<{
    resolution: typeof skipOnConflicts;
} | {
    resolution: typeof renameOnConflicts;
    newFolderName: string;
}>;
export type FolderToFolderConflictAskPrompt = (params: FolderConflictPromptParams) => Promise<{
    resolution: typeof skipOnConflicts | typeof useExistingFolder;
} | {
    resolution: typeof renameOnConflicts;
    newFolderName: string;
}>;
export type FileConflictResolutionFnResult = {
    existingFileId?: EntityID;
    newFileName?: string;
} | typeof skipOnConflicts;
export interface FileConflictPrompts {
    fileToFileNameConflict: FileToFileNameConflictPrompt;
    fileToFolderNameConflict: FileToFolderConflictAskPrompt;
}
export interface FolderConflictPrompts extends FileConflictPrompts {
    folderToFileNameConflict: FolderToFileConflictAskPrompt;
    folderToFolderNameConflict: FolderToFolderConflictAskPrompt;
}
export type FileConflictResolutionFn = (params: {
    conflictResolution: FileNameConflictResolution;
    conflictingFileInfo: FileConflictInfo;
    hasSameLastModifiedDate: boolean;
    prompts?: FileConflictPrompts;
    namesWithinDestFolder: string[];
}) => Promise<FileConflictResolutionFnResult>;
export interface ResolveNameConflictsParams {
    conflictResolution: FileNameConflictResolution;
    getConflictInfoFn: (parentFolderId: EntityID) => Promise<NameConflictInfo>;
    destFolderId: EntityID;
}
export interface ResolveFileNameConflictsParams extends ResolveNameConflictsParams {
    destinationFileName: string;
    wrappedFile: ArFSDataToUpload;
    prompts?: FileConflictPrompts;
}
export interface ResolveFolderNameConflictsParams extends ResolveNameConflictsParams {
    destinationFolderName: string;
    wrappedFolder: ArFSFolderToUpload;
    prompts?: FolderConflictPrompts;
}
export declare abstract class ArFSBaseEntityToUpload {
    abstract getBaseName(): string;
    abstract readonly entityType: EntityType;
    readonly sourceUri?: string;
    readonly customMetaData?: CustomMetaData;
    destName?: string;
    existingId?: EntityID;
    get destinationBaseName(): string;
    constructor();
}
export declare abstract class ArFSDataToUpload extends ArFSBaseEntityToUpload {
    abstract gatherFileInfo(): FileInfo;
    abstract getFileDataBuffer(): Promise<Buffer>;
    abstract readonly contentType: string;
    abstract readonly lastModifiedDate: UnixTime;
    abstract readonly size: ByteCount;
    conflictResolution?: FileConflictResolution;
    readonly customContentType?: string;
    readonly entityType = "file";
}
export declare class ArFSManifestToUpload extends ArFSDataToUpload {
    readonly folderToGenManifest: (ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths)[];
    readonly destManifestName: string;
    readonly customMetaData?: CustomMetaData | undefined;
    manifest: Manifest;
    lastModifiedDateMS: UnixTime;
    constructor(folderToGenManifest: (ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths)[], destManifestName: string, customMetaData?: CustomMetaData | undefined);
    getLinksOutput(dataTxId: ArweaveAddress, gateway?: URL): string[];
    gatherFileInfo(): FileInfo;
    get contentType(): string;
    getBaseName(): string;
    getFileDataBuffer(): Promise<Buffer>;
    get size(): ByteCount;
    get lastModifiedDate(): UnixTime;
}
export type FolderConflictResolution = typeof skipOnConflicts | typeof errorOnConflict | undefined;
export type FileConflictResolution = FolderConflictResolution | typeof upsertOnConflicts;
export type RewardSettings = {
    reward?: Winston;
};
export {};
