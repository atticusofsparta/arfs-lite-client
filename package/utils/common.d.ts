import { ByteCount } from "src/types/common";
import { BuildGQLQueryParams, CustomMetaDataGqlTags, CustomMetaDataJsonFields, GQLQuery } from "src/types/gql";
import Arweave from "arweave";
import { JsonSerializable } from "src/types/arweave";
import { ArFSFileOrFolderEntity, CustomMetaData, EntityID, UnixTime } from "src/types/arfs/common";
import { ArFSDriveEntity } from "src/types/arfs/drive";
import { ArFSPrivateFile, ArFSPrivateFolder, ArFSPublicFile, ArFSPublicFileWithPaths, ArFSPublicFolder, ArFSPublicFolderWithPaths, FolderHierarchy } from "src/types/arfs";
export declare function urlEncodeHashKey(keyBuffer: Uint8Array): string;
export declare function encodeArrayBufferToBase64(buffer: Uint8Array): string;
export declare function buildQuery({ tags, cursor, owner, sort, ids }: BuildGQLQueryParams): GQLQuery;
/** Computes the size of a private file encrypted with AES256-GCM */
export declare function encryptedDataSize(dataSize: ByteCount): ByteCount;
/** Derives gateway URL from provided Arweave instance */
export declare function gatewayUrlForArweave(arweave: Arweave): URL;
export declare function Utf8ArrayToStr(array: any): Promise<string>;
export declare function isCustomMetaDataJsonFields(customDataJson: unknown): customDataJson is CustomMetaDataJsonFields;
/** Type guard that checks if the provided JSON will parse */
export declare function isJsonSerializable(json: unknown): json is JsonSerializable;
export declare function isCustomMetaDataGqlTags(customGqlTags: unknown): customGqlTags is CustomMetaDataGqlTags;
export declare function bufferTob64Url(buffer: Uint8Array): string;
export declare function b64UrlEncode(b64UrlString: string): string;
export declare function bufferTob64(buffer: Uint8Array): string;
export declare function b64UrlToBuffer(b64UrlString: string): Uint8Array;
export declare function b64UrlDecode(b64UrlString: string): string;
export declare function sleep(ms: number): Promise<number>;
export declare function formatBytes(bytes: number): string;
export declare function extToMime(fullPath: string): string;
/**
 * @name lastRevisionFilter is a standard JS find/filter function intended to
 * filter only the last revision of entities within an array
 *
 * @param {ArFSFileOrFolderEntity} entity the iterated entity
 * @param {number} _index the iterated index
 * @param {ArFSFileOrFolderEntity[]} allEntities the array of all entities
 * @returns {boolean}
 */
export declare function latestRevisionFilter(entity: ArFSFileOrFolderEntity<"file" | "folder">, _index: number, allEntities: ArFSFileOrFolderEntity<"file" | "folder">[]): boolean;
/**
 * @name latestRevisionFilterForDrives is a standard JS find/filter function intended to
 * filter only the last revision of entities within an array
 *
 * @param {ArFSDriveEntity} entity the iterated entity
 * @param {number} _index the iterated index
 * @param {ArFSDriveEntity[]} allEntities the array of all entities
 * @returns {boolean}
 */
export declare function latestRevisionFilterForDrives(entity: ArFSDriveEntity, _index: number, allEntities: ArFSDriveEntity[]): boolean;
export declare function fileFilter<T extends ArFSPrivateFile | ArFSPublicFile>(entity: ArFSFileOrFolderEntity<"file" | "folder">): entity is T;
export declare function folderFilter<T extends ArFSPublicFolder | ArFSPrivateFolder>(entity: ArFSFileOrFolderEntity<"file" | "folder">): entity is T;
export declare function publicEntityWithPathsFactory(entity: ArFSPublicFolder | ArFSPublicFile, hierarchy: FolderHierarchy): ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths;
export declare function alphabeticalOrder(a: string, b: string): number;
export declare const invalidCustomMetaDataGqlTagErrorMessage: string;
export declare const invalidCustomDataGqlTagErrorMessage: string;
export declare const invalidCustomMetaDataJsonErrorMessage: string;
export declare const invalidCustomMetaDataErrorMessage: string;
export declare function assertCustomMetaData(tags: unknown): tags is CustomMetaData;
export interface NameConflictInfo {
    files: FileConflictInfo[];
    folders: FolderNameAndId[];
}
export interface FolderNameAndId {
    folderName: string;
    folderId: EntityID;
}
export interface FileConflictInfo {
    fileName: string;
    fileId: EntityID;
    lastModifiedDate: UnixTime;
}
export declare function entityToNameMap(entity: ArFSFileOrFolderEntity<"file" | "folder">): string;
export declare function folderToNameAndIdMap(entity: ArFSFileOrFolderEntity<"folder">): FolderNameAndId;
export declare function fileConflictInfoMap(entity: ArFSFileOrFolderEntity<"file">): FileConflictInfo;
export declare function encodeStringToArrayBuffer(str: string): ArrayBuffer;
