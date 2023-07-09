import Arweave from "arweave";
import { ArFSDriveEntity, ArFSPublicDrive } from "./types/arfs/drive";
import { ArweaveAddress, PrivateKeyData } from "./types/arweave";
import { ArFSAllPublicFoldersOfDriveParams, EntityID, GetPublicDriveParams, GetPublicFileParams, GetPublicFolderParams, ListPublicFolderParams } from "./types/arfs/common";
import { GatewayAPI } from "./types/common";
import { ArFSListPublicFolderParams, ArFSPublicFolder, ArFSPublicFolderWithPaths } from "./types/arfs/folder";
import { ArFSPublicFile, ArFSPublicFileWithPaths } from "./types/arfs/file";
import { defaultArFSClientCache } from "./types/arfs/cache";
interface ArFSClientType {
    readonly _arweave: Arweave;
    readonly appName: string;
    readonly appVersion: string;
    getOwnerForDriveId(driveId: EntityID): Promise<ArweaveAddress>;
    getPublicDrive({ driveId, owner, }: GetPublicDriveParams): Promise<ArFSPublicDrive>;
    getPublicFolder({ folderId, owner, }: GetPublicFolderParams): Promise<ArFSPublicFolder>;
    getPublicFile({ fileId, owner, }: GetPublicFileParams): Promise<ArFSPublicFile>;
    getAllDrivesForAddress({ address, privateKeyData, latestRevisionsOnly, }: {
        address: string;
        privateKeyData: PrivateKeyData;
        latestRevisionsOnly?: boolean;
    }): Promise<ArFSDriveEntity[]>;
    listPublicFolder({ folderId, maxDepth, includeRoot, owner, }: ListPublicFolderParams): Promise<(ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths)[]>;
}
declare class ArFSClient implements ArFSClientType {
    protected caches: import("./types/arfs/cache").ArFSClientCache;
    protected gatewayApi: GatewayAPI;
    _arweave: Arweave;
    _gatewayApi: GatewayAPI;
    _caches: typeof defaultArFSClientCache;
    appName: string;
    appVersion: string;
    constructor(arweave: Arweave, caches?: import("./types/arfs/cache").ArFSClientCache, gatewayApi?: GatewayAPI);
    getOwnerForDriveId(driveId: EntityID): Promise<ArweaveAddress>;
    getDriveIDForEntityId(entityId: EntityID, gqlTypeTag: "File-Id" | "Folder-Id"): Promise<EntityID>;
    getDriveOwnerForFolderId(folderId: EntityID): Promise<ArweaveAddress>;
    getDriveIdForFolderId(folderId: EntityID): Promise<EntityID>;
    getDriveOwnerForFileId(fileId: EntityID): Promise<ArweaveAddress>;
    getDriveIdForFileId(fileId: EntityID): Promise<EntityID>;
    getDriveIdForEntityID(folderId: EntityID): Promise<EntityID>;
    getPublicDrive({ driveId, owner, }: {
        driveId: EntityID;
        owner: ArweaveAddress;
    }): Promise<ArFSPublicDrive>;
    getPublicFolder({ folderId, owner, }: {
        folderId: EntityID;
        owner: ArweaveAddress;
    }): Promise<ArFSPublicFolder>;
    getPublicFile({ fileId, owner, }: {
        fileId: EntityID;
        owner: ArweaveAddress;
    }): Promise<ArFSPublicFile>;
    getAllDrivesForAddress({ address, privateKeyData, latestRevisionsOnly, }: {
        address: string;
        privateKeyData: PrivateKeyData;
        latestRevisionsOnly?: boolean;
    }): Promise<ArFSDriveEntity[]>;
    getPublicFilesWithParentFolderIds(folderIDs: EntityID[], owner: ArweaveAddress, latestRevisionsOnly?: boolean): Promise<ArFSPublicFile[]>;
    getAllFoldersOfPublicDrive({ driveId, owner, latestRevisionsOnly, }: ArFSAllPublicFoldersOfDriveParams): Promise<ArFSPublicFolder[]>;
    /**
     * Lists the children of certain public folder
     * @param {FolderID} folderId the folder ID to list children of
     * @param {number} maxDepth a non-negative integer value indicating the depth of the folder tree to list where 0 = this folder's contents only
     * @param {boolean} includeRoot whether or not folderId's folder data should be included in the listing
     * @returns {ArFSPublicFileOrFolderWithPaths[]} an array representation of the children and parent folder
     */
    listPublicFolder({ folderId, maxDepth, includeRoot, owner, }: ArFSListPublicFolderParams): Promise<(ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths)[]>;
}
export { ArFSClient, ArFSClientType, ArweaveAddress, PrivateKeyData };
