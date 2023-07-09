import { ArweaveAddress } from "../arweave";
import { ByteCount, GatewayAPI } from "../common";
import { CustomMetaDataGqlTags, CustomMetaDataJsonFields, GQLNodeInterface, GQLTagInterface } from "../gql";
import { ArFSBaseEntityToUpload, ArFSFileOrFolderBuilder, ArFSFileOrFolderEntity, ArFSWithPath, ContentType, CustomMetaData, EntityID, EntityKey, FolderConflictResolution, UnixTime } from "./common";
import { ArFSFileToUpload, ArFSPrivateFile, ArFSPrivateFileWithPaths } from "./file";
export declare class ArFSPublicFolder extends ArFSFileOrFolderEntity<"folder"> {
    readonly folderId: EntityID;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: EntityID, name: string, txId: ArweaveAddress, unixTime: UnixTime, parentFolderId: EntityID, folderId: EntityID, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class ArFSPublicFolderWithPaths extends ArFSPublicFolder implements ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
    constructor(entity: ArFSPublicFolder, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFolder extends ArFSFileOrFolderEntity<"folder"> {
    readonly folderId: EntityID;
    readonly cipher: string;
    readonly cipherIV: string;
    readonly driveKey: EntityKey;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: EntityID, name: string, txId: ArweaveAddress, unixTime: UnixTime, parentFolderId: EntityID, folderId: EntityID, cipher: string, cipherIV: string, driveKey: EntityKey, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class ArFSPrivateFolderWithPaths extends ArFSPrivateFolder implements ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
    constructor(entity: ArFSPrivateFolder, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFolderWithPathsKeyless extends ArFSPrivateFolderWithPaths {
    driveKey: EntityKey;
    constructor(entity: ArFSPrivateFolder, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFolderKeyless extends ArFSPrivateFolder {
    driveKey: EntityKey;
    constructor(entity: ArFSPrivateFolder);
}
export declare class FolderTreeNode {
    readonly folderId: EntityID;
    readonly parent?: FolderTreeNode | undefined;
    children: FolderTreeNode[];
    constructor(folderId: EntityID, parent?: FolderTreeNode | undefined, children?: FolderTreeNode[]);
    static fromEntity(folderEntity: ArFSFileOrFolderEntity<"folder">): FolderTreeNode;
}
export declare class FolderHierarchy {
    private readonly folderIdToEntityMap;
    private readonly folderIdToNodeMap;
    private _rootNode?;
    constructor(folderIdToEntityMap: {
        [k: string]: ArFSFileOrFolderEntity<"folder">;
    }, folderIdToNodeMap: {
        [k: string]: FolderTreeNode;
    });
    static newFromEntities(entities: ArFSFileOrFolderEntity<"folder">[]): FolderHierarchy;
    private static setupNodesWithEntity;
    get rootNode(): FolderTreeNode;
    subTreeOf(folderId: EntityID, maxDepth?: number): FolderHierarchy;
    allFolderIDs(): EntityID[];
    nodeAndChildrenOf(node: FolderTreeNode, maxDepth: number): FolderTreeNode[];
    folderIdSubtreeFromFolderId(folderId: EntityID, maxDepth: number): EntityID[];
    pathToFolderId(folderId: EntityID): string;
    entityPathToFolderId(folderId: EntityID): string;
    txPathToFolderId(folderId: EntityID): string;
}
export declare abstract class ArFSFolderBuilder<T extends ArFSPublicFolder | ArFSPrivateFolder> extends ArFSFileOrFolderBuilder<"folder", T> {
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    getGqlQueryParameters(): GQLTagInterface[];
    protected readonly protectedDataJsonKeys: string[];
}
export declare class RootFolderID extends EntityID {
    constructor();
}
export declare class ArFSPublicFolderBuilder extends ArFSFolderBuilder<ArFSPublicFolder> {
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI): ArFSPublicFolderBuilder;
    protected buildEntity(): Promise<ArFSPublicFolder>;
}
export interface ArFSListPublicFolderParams {
    folderId: EntityID;
    maxDepth: number;
    includeRoot: boolean;
    owner: ArweaveAddress;
    withKeys?: boolean;
    withPathsFactory?: (entity: ArFSPrivateFile | ArFSPrivateFolder, hierarchy: FolderHierarchy, driveKey: EntityKey) => ArFSPrivateFolderWithPaths | ArFSPrivateFileWithPaths;
}
export declare class ArFSFolderToUpload extends ArFSBaseEntityToUpload {
    readonly filePath: FileSystemEntry;
    readonly fileStats: FileSystemEntry;
    readonly customMetaData?: CustomMetaData | undefined;
    files: ArFSFileToUpload[];
    folders: ArFSFolderToUpload[];
    conflictResolution: FolderConflictResolution;
    readonly entityType = "folder";
    readonly sourceUri = "";
    constructor(filePath: FileSystemEntry, fileStats: FileSystemEntry, customMetaData?: CustomMetaData | undefined);
    getBaseName(): string;
    getTotalByteCount(encrypted?: boolean): ByteCount;
}
