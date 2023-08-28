import {
  ROOT_FOLDER_ID_PLACEHOLDER,
  authTagLength,
  defaultGatewayHost,
  defaultGatewayProtocol,
} from "src/constants";
import { ByteCount } from "src/types/common";
import {
  BuildGQLQueryParams,
  CustomMetaDataGqlTags,
  CustomMetaDataJsonFields,
  DESCENDING_ORDER,
  GQLQuery,
  GqlTagName,
  edgesFragment,
  latestResult,
  pageInfoFragment,
  pageLimit,
} from "src/types/gql";
import Arweave from "arweave";
import { ArweaveAddress, JsonSerializable } from "src/types/arweave";
import {
  ArFSFileOrFolderEntity,
  ArFSTagSettings,
  CustomMetaData,
  EntityID,
  UnixTime,
} from "src/types/arfs/common";
import * as B64js from "base64-js";
import * as mime from "mime-types";
import { ArFSDriveEntity, ArFSPublicDrive } from "src/types/arfs/drive";
import {
  ArFSPrivateFile,
  ArFSPrivateFolder,
  ArFSPublicFile,
  ArFSPublicFileWithPaths,
  ArFSPublicFolder,
  ArFSPublicFolderWithPaths,
  FolderHierarchy,
  RootFolderID,
} from "src/types/arfs";

export function urlEncodeHashKey(keyBuffer: Uint8Array): string {
  const base64 = encodeArrayBufferToBase64(keyBuffer);
  return base64.replace(/=/g, "");
}

export function encodeArrayBufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const length = bytes.byteLength;
  for (let i = 0; i < length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function buildQuery({ tags = [], cursor, owner, sort = DESCENDING_ORDER, ids }: BuildGQLQueryParams): GQLQuery {
	let queryTags = ``;

	tags.forEach((t) => {
		queryTags = `${queryTags}
				{ name: "${t.name}", values: ${Array.isArray(t.value) ? `[${t.value.map((v)=>`"${ v.toString()}"`)}]` : `["${t.value.toString()}"]`} }`;
	});

	const singleResult = cursor === undefined;

	return {
		query: `query {
			transactions(
				${ids?.length ? `ids: [${ids.map((id) => `"${id}"`)}]` : ''}
				first: ${singleResult ? latestResult : pageLimit}
				sort: ${sort}
				${singleResult ? '' : `after: "${cursor}"`}
				${owner === undefined ? '' : `owners: ["${owner.toString()}"]`}
				tags: [
					${queryTags}
				]
			) {
				${singleResult ? '' : pageInfoFragment}
				${edgesFragment(singleResult)}
			}
		}`
	};
}

/** Computes the size of a private file encrypted with AES256-GCM */
export function encryptedDataSize(dataSize: ByteCount): ByteCount {
  if (+dataSize > Number.MAX_SAFE_INTEGER - authTagLength) {
    throw new Error(
      `Max un-encrypted dataSize allowed is ${
        Number.MAX_SAFE_INTEGER - authTagLength
      }!`,
    );
  }
  return new ByteCount((+dataSize / authTagLength + 1) * authTagLength);
}

/** Derives gateway URL from provided Arweave instance */
export function gatewayUrlForArweave(arweave: Arweave): URL {
  const protocol = arweave.api.config.protocol ?? defaultGatewayProtocol;
  const host = arweave.api.config.host ?? defaultGatewayHost;
  const portStr = arweave.api.config.port ? `:${arweave.api.config.port}` : "";

  return new URL(`${protocol}://${host}${portStr}/`);
}

// FIXME: set the correct type for this argument
export async function Utf8ArrayToStr(array: any): Promise<string> {
  let out, i, c;
  let char2, char3;

  out = "";
  const len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0),
        );
        break;
    }
  }
  return out;
}

export function isCustomMetaDataJsonFields(
  customDataJson: unknown,
): customDataJson is CustomMetaDataJsonFields {
  return isJsonSerializable(customDataJson);
}

/** Type guard that checks if the provided JSON will parse */
export function isJsonSerializable(json: unknown): json is JsonSerializable {
  try {
    JSON.parse(JSON.stringify(json));
  } catch {
    return false;
  }
  return true;
}
export function isCustomMetaDataGqlTags(
  customGqlTags: unknown,
): customGqlTags is CustomMetaDataGqlTags {
  if (typeof customGqlTags !== "object" || customGqlTags === null) {
    return false;
  }

  for (const [name, value] of Object.entries(customGqlTags)) {
    // prettier-ignore
    if (ArFSTagSettings.protectedArFSGqlTagNames.includes(name as unknown as GqlTagName)) {
			console.error(
				`Provided custom metadata GQL tag name collides with a protected ArFS protected tag: ${name}`
			);
			return false;
		}

    if (typeof value === "string") {
      assertCharacterLength(value);
      continue;
    }

    if (!Array.isArray(value)) {
      return false;
    }

    for (const item of value) {
      if (typeof item !== "string") {
        return false;
      }
      assertCharacterLength(item);
    }
  }

  return true;
}

function assertCharacterLength(value: string): void {
  if (value.length === 0) {
    throw Error("Metadata string must be at least one character!");
  }
}

export function bufferTob64Url(buffer: Uint8Array): string {
  return b64UrlEncode(bufferTob64(buffer));
}

export function b64UrlEncode(b64UrlString: string): string {
  return b64UrlString.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function bufferTob64(buffer: Uint8Array): string {
  return B64js.fromByteArray(new Uint8Array(buffer));
}

export function b64UrlToBuffer(b64UrlString: string): Uint8Array {
  return new Uint8Array(B64js.toByteArray(b64UrlDecode(b64UrlString)));
}

export function b64UrlDecode(b64UrlString: string): string {
  b64UrlString = b64UrlString.replace(/-/g, "+").replace(/_/g, "/");
  let padding;
  b64UrlString.length % 4 == 0
    ? (padding = 0)
    : (padding = 4 - (b64UrlString.length % 4));
  return b64UrlString.concat("=".repeat(padding));
}

export async function sleep(ms: number): Promise<number> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    setTimeout(resolve, ms);
  });
}

// Format byte size to something nicer.  This is minified...
export function formatBytes(bytes: number): string {
  const marker = 1024; // Change to 1000 if required
  const decimal = 3; // Change as required
  const kiloBytes = marker; // One Kilobyte is 1024 bytes
  const megaBytes = marker * marker; // One MB is 1024 KB
  const gigaBytes = marker * marker * marker; // One GB is 1024 MB
  // const teraBytes = marker * marker * marker * marker; // One TB is 1024 GB

  // return bytes if less than a KB
  if (bytes < kiloBytes) return `${bytes} Bytes`;
  // return KB if less than a MB
  if (bytes < megaBytes) return `${(bytes / kiloBytes).toFixed(decimal)} KB`;
  // return MB if less than a GB
  if (bytes < gigaBytes) return `${(bytes / megaBytes).toFixed(decimal)} MB`;
  // return GB if less than a TB
  return `${(bytes / gigaBytes).toFixed(decimal)} GB`;
}

export function extToMime(fullPath: string): string {
  let extension = fullPath.substring(fullPath.lastIndexOf(".") + 1);
  extension = extension.toLowerCase();
  const m = mime.lookup(extension);

  return m === false ? "unknown" : m;
}

/**
 * @name lastRevisionFilter is a standard JS find/filter function intended to
 * filter only the last revision of entities within an array
 *
 * @param {ArFSFileOrFolderEntity} entity the iterated entity
 * @param {number} _index the iterated index
 * @param {ArFSFileOrFolderEntity[]} allEntities the array of all entities
 * @returns {boolean}
 */
export function latestRevisionFilter(
  entity: ArFSFileOrFolderEntity<"file" | "folder">,
  _index: number,
  allEntities: ArFSFileOrFolderEntity<"file" | "folder">[],
): boolean {
  const allRevisions = allEntities.filter((e) =>
    e.entityId.equals(entity.entityId),
  );
  const latestRevision = allRevisions[0];
  return entity.txId.equals(latestRevision.txId);
}

/**
 * @name latestRevisionFilterForDrives is a standard JS find/filter function intended to
 * filter only the last revision of entities within an array
 *
 * @param {ArFSDriveEntity} entity the iterated entity
 * @param {number} _index the iterated index
 * @param {ArFSDriveEntity[]} allEntities the array of all entities
 * @returns {boolean}
 */
export function latestRevisionFilterForDrives(
  entity: ArFSDriveEntity,
  _index: number,
  allEntities: ArFSDriveEntity[],
): boolean {
  const allRevisions = allEntities.filter((e) =>
    e.driveId.equals(entity.driveId),
  );
  const latestRevision = allRevisions[0];
  return entity.txId.equals(latestRevision.txId);
}

export function fileFilter<T extends ArFSPrivateFile | ArFSPublicFile>(
  entity: ArFSFileOrFolderEntity<"file" | "folder">,
): entity is T {
  return entity.entityType === "file";
}

export function folderFilter<T extends ArFSPublicFolder | ArFSPrivateFolder>(
  entity: ArFSFileOrFolderEntity<"file" | "folder">,
): entity is T {
  return entity.entityType === "folder";
}

export function publicEntityWithPathsFactory(
  entity: ArFSPublicFolder | ArFSPublicFile,
  hierarchy: FolderHierarchy,
): ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths {
  if (entity.entityType === "folder") {
    return new ArFSPublicFolderWithPaths(entity, hierarchy);
  }
  return new ArFSPublicFileWithPaths(entity, hierarchy);
}

export function alphabeticalOrder(a: string, b: string): number {
  return a.localeCompare(b);
}

const invalidSchemaErrorMessage = `Invalid custom metadata schema. Please submit a valid JSON object with an example shape of `;

const customMetaDataGqlTagShapeOne = '{ "TAG_NAME": "TAG_VALUE" }';
const customMetaDataGqlTagShapeTwo = '{ "TAG_NAME": ["VAL 1", "VAL 2" ] }';
const customMetaDataJsonShape =
  '{ "TAG_NAME": { "Any": [ "Valid", "JSON" ] } }';
const customMetaDataShape = `{ metaDataJson?: ${customMetaDataGqlTagShapeOne}, metaDataGql?: ${customMetaDataGqlTagShapeTwo}, dataGqlTags?: ${customMetaDataGqlTagShapeTwo} }`;

export const invalidCustomMetaDataGqlTagErrorMessage = `${invalidSchemaErrorMessage}${customMetaDataGqlTagShapeOne} or ${customMetaDataGqlTagShapeTwo}`;
export const invalidCustomDataGqlTagErrorMessage = `${invalidSchemaErrorMessage}${customMetaDataGqlTagShapeOne} or ${customMetaDataGqlTagShapeTwo}`;
export const invalidCustomMetaDataJsonErrorMessage = `${invalidSchemaErrorMessage}${customMetaDataJsonShape}`;
export const invalidCustomMetaDataErrorMessage = `${invalidSchemaErrorMessage}${customMetaDataShape}`;

export function assertCustomMetaData(tags: unknown): tags is CustomMetaData {
  if (!isCustomMetaDataGqlTags(tags)) {
    // TODO: throw the error for data ones as well.
    throw Error(invalidCustomMetaDataErrorMessage);
  }
  return true;
}

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

export function entityToNameMap(
  entity: ArFSFileOrFolderEntity<"file" | "folder">,
): string {
  return entity.name;
}

export function folderToNameAndIdMap(
  entity: ArFSFileOrFolderEntity<"folder">,
): FolderNameAndId {
  return { folderId: entity.entityId, folderName: entity.name };
}

export function fileConflictInfoMap(
  entity: ArFSFileOrFolderEntity<"file">,
): FileConflictInfo {
  return {
    fileId: entity.entityId,
    fileName: entity.name,
    lastModifiedDate: entity.lastModifiedDate,
  };
}

export function encodeStringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

export function parseCachedDrive (cachedDrive:any): ArFSPublicDrive {
  let cacheClone = {...cachedDrive};
  cacheClone.driveId = new EntityID(cacheClone.driveId.entityId);
  cacheClone.owner =  cacheClone.owner?.address?.length ? new ArweaveAddress(cacheClone.owner.address) : undefined;
  cacheClone.rootFolderId = new EntityID( typeof cacheClone.rootFolderId === 'string' ? cacheClone.rootFolderId : cacheClone.rootFolderId.entityId);
  cacheClone.unixTime = new UnixTime(typeof cacheClone.unixTime === "number" ? cacheClone.unixTime : cacheClone.unixTime.unixTime);

  return new ArFSPublicDrive(
    cacheClone.appName,
    cacheClone.appVersion,
    cacheClone.arFS,
    cacheClone.contentType,
    cacheClone.driveId,
    cacheClone.entityType,
    cacheClone.name,
    cacheClone.txId,
    cacheClone.unixTime,
    cacheClone.drivePrivacy,
    cacheClone.rootFolderId,
    cacheClone?.customMetaData?.metaDataGqlTags,
    cacheClone?.customMetaData?.metaDataJson,
  );
}

export function parseCachedFolder (cachedFolder:any): ArFSPublicFolder {
  let cacheClone = {...cachedFolder};
  cacheClone.driveId = new EntityID(cacheClone.driveId.entityId);
  cacheClone.entityId = new EntityID(cacheClone.entityId.entityId);
  cacheClone.owner = cacheClone.owner?.address?.length ? new ArweaveAddress(cacheClone.owner.address) : undefined;
  cacheClone.parentFolderId = cacheClone.parentFolderId.entityId === ROOT_FOLDER_ID_PLACEHOLDER ? new RootFolderID() : new EntityID(cacheClone.parentFolderId.entityId);
  cacheClone.unixTime = new UnixTime(typeof cacheClone.unixTime === "number" ? cacheClone.unixTime : cacheClone.unixTime.unixTime);

  return new ArFSPublicFolder(
    cacheClone.appName,
    cacheClone.appVersion,
    cacheClone.arFS,
    cacheClone.contentType,
    cacheClone.driveId,
    cacheClone.name,
    cacheClone.txId,
    cacheClone.unixTime,
    cacheClone.parentFolderId,
    cacheClone.entityId,
    cacheClone?.customMetaData?.metaDataGqlTags,
    cacheClone?.customMetaData?.metaDataJson,
  )
}

export function parseCachedFile (cachedFile:any): ArFSPublicFile {
  let cacheClone = {...cachedFile};
  cacheClone.driveId = new EntityID(cacheClone.driveId.entityId);
  cacheClone.entityId = new EntityID(cacheClone.entityId.entityId);
  cacheClone.owner = cacheClone.owner?.address?.length ? new ArweaveAddress(cacheClone.owner.address) : undefined;
  cacheClone.parentFolderId = cacheClone.parentFolderId.entityId === ROOT_FOLDER_ID_PLACEHOLDER ? new RootFolderID() : new EntityID(cacheClone.parentFolderId.entityId);
  cacheClone.txId = new ArweaveAddress(cacheClone.txId.address);
  cacheClone.dataTxId = new ArweaveAddress(cacheClone.dataTxId.address);
  cacheClone.unixTime = new UnixTime(typeof cacheClone.unixTime === "number" ? cacheClone.unixTime : cacheClone.unixTime.unixTime);
  cacheClone.size = new ByteCount(typeof cacheClone.size === "number" ? cacheClone.size : cacheClone.size.byteCount);

  return new ArFSPublicFile(
    cacheClone.appName,
    cacheClone.appVersion,
    cacheClone.arFS,
    cacheClone.contentType,
    cacheClone.driveId,
    cacheClone.name,
    cacheClone.txId,
    cacheClone.unixTime,
    cacheClone.parentFolderId,
    cacheClone.entityId,
    cacheClone.size,
    cacheClone.lastModifiedDate,
    cacheClone.dataTxId,
    cacheClone.dataContentType,
    cacheClone?.customMetaData?.metaDataGqlTags,
    cacheClone?.customMetaData?.metaDataJson,
  )
}


