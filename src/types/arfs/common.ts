import {
  FileConflictInfo,
  NameConflictInfo,
  alphabeticalOrder,
  assertCustomMetaData,
  buildQuery,
  encodeStringToArrayBuffer,
  isCustomMetaDataGqlTags,
  isCustomMetaDataJsonFields,
  urlEncodeHashKey,
} from "src/utils/common";
import { ADDR, ArweaveAddress, PrivateKeyData, Winston } from "../arweave";
import {
  UnionOfObjectPropertiesType,
  Equatable,
  ByteCount,
  GatewayAPI,
  MakeOptional,
} from "../common";
import {
  CustomMetaDataGqlTags,
  CustomMetaDataJsonFields,
  CustomMetaDataTagInterface,
  GQLNodeInterface,
  GQLTagInterface,
  gqlTagNameArray,
} from "../gql";
import {
  MANIFEST_CONTENT_TYPE,
  defaultArweaveGatewayPath,
  fakePrivateCipherIVTag,
  privateCipherTag,
  privateOctetContentTypeTag,
} from "src/constants";
import {
  ArFSFolderToUpload,
  ArFSListPublicFolderParams,
  ArFSPublicFolderWithPaths,
  FolderHierarchy,
} from "./folder";
import { ArFSFileToUpload, ArFSPublicFileWithPaths, FileInfo } from "./file";
import { PrivateDriveKeyData } from "./drive";

export const cipherTypeValues = {
  AES_GCM_256: "aes-gcm-256",
  AES_256_GCM: "AES256-GCM",
} as const;
export const entityTypeValues = {
  DRIVE: "drive",
  FILE: "file",
  FOLDER: "folder",
} as const;
export const contentTypeValues = {
  APPLICATION_JSON: "application/json",
  APPLICATION_OCTET_STREAM: "application/octet-stream",
} as const;
export const drivePrivacyValues = {
  PRIVATE: "private",
  PUBLIC: "public",
} as const;
export const driveAuthModeValues = {
  PASSWORD: "password",
} as const;
export const driveSharingValues = {
  SHARED: "shared",
  PERSONAL: "personal",
} as const;
export const syncStatusValues = {
  READY_TO_DOWNLOAD: 0,
  READY_TO_UPLOAD: 1,
  GETTING_MINED: 2,
  SUCCESSFULLY_UPLOADED: 3,
} as const;
export const yesNoIntegerValues = {
  NO: 0,
  YES: 1,
} as const;

export type CipherType = UnionOfObjectPropertiesType<typeof cipherTypeValues>;
export type EntityType = UnionOfObjectPropertiesType<typeof entityTypeValues>;
export type ContentType = UnionOfObjectPropertiesType<typeof contentTypeValues>;
export type DrivePrivacy = UnionOfObjectPropertiesType<
  typeof drivePrivacyValues
>;
export type DriveAuthMode = UnionOfObjectPropertiesType<
  typeof driveAuthModeValues
>;
export type DriveSharing = UnionOfObjectPropertiesType<
  typeof driveSharingValues
>;
export type SyncStatus = UnionOfObjectPropertiesType<typeof syncStatusValues>;
export type YesNoInteger = UnionOfObjectPropertiesType<
  typeof yesNoIntegerValues
>;

// RFC 4122 Section 3 requires that the characters be generated in lower case, while being case-insensitive on input.
const entityIdRegex = /^[a-f\d]{8}-([a-f\d]{4}-){3}[a-f\d]{12}$/i;

export class EntityID implements Equatable<EntityID> {
  constructor(protected entityId: string) {
    if (
      entityId &&
      entityId.length &&
      !entityIdRegex.test(entityId.toString()) &&
      entityId !== "ENCRYPTED"
    ) {
      throw new Error(`Invalid entity ID '${entityId}'!'`);
    }
  }

  [Symbol.toPrimitive](hint?: string): string {
    if (hint === "number") {
      throw new Error("Entity IDs cannot be interpreted as a number!");
    }

    return this.toString();
  }

  toString(): string {
    return this.entityId;
  }

  valueOf(): string {
    return this.entityId;
  }

  equals(entityId: EntityID): boolean {
    return this.entityId === entityId.entityId;
  }

  toJSON(): string {
    return this.toString();
  }
}

export function EID(entityId: string): EntityID {
  return new EntityID(entityId);
}

export class UnixTime implements Equatable<UnixTime> {
  constructor(private readonly unixTime: number) {
    if (
      this.unixTime < 0 ||
      !Number.isInteger(this.unixTime) ||
      !Number.isFinite(this.unixTime)
    ) {
      throw new Error("Unix time must be a positive integer!");
    }
  }

  equals(unixTime: UnixTime): boolean {
    return +this.unixTime === +unixTime.unixTime;
  }

  [Symbol.toPrimitive](hint?: string): number | string {
    if (hint === "string") {
      this.toString();
    }

    return this.unixTime;
  }

  toString(): string {
    return `${this.unixTime}`;
  }

  valueOf(): number {
    return this.unixTime;
  }

  toJSON(): number {
    return this.unixTime;
  }
}

export class EntityKey {
  constructor(readonly keyData: Uint8Array) {
    if (!(keyData instanceof Uint8Array)) {
      throw new Error(
        `The argument must be of type Uint8Array, got ${typeof keyData}`,
      );
    }
  }

  toString(): string {
    return urlEncodeHashKey(this.keyData);
  }

  toJSON(): string {
    return this.toString();
  }
}

export class ArFSEntity {
  readonly appName: string; // The app that has submitted this entity.  Should not be longer than 64 characters.  eg. ArDrive-Web
  readonly appVersion: string; // The app version that has submitted this entity.  Must not be longer than 8 digits, numbers only. eg. 0.1.14
  readonly arFS: string; // The version of Arweave File System that is used for this entity.  Must not be longer than 4 digits. eg 0.11
  readonly contentType: ContentType; // the mime type of the file uploaded.  in the case of drives and folders, it is always a JSON file.  Public drive/folders must use "application/json" and private drives use "application/octet-stream" since this data is encrypted.
  readonly driveId: EntityID; // the unique drive identifier, created with uuidv4 https://www.npmjs.com/package/uuidv4 eg. 41800747-a852-4dc9-9078-6c20f85c0f3a
  readonly entityType: EntityType; // the type of ArFS entity this is.  this can only be set to "drive", "folder", "file"
  readonly name: string; // user defined entity name, cannot be longer than 64 characters.  This is stored in the JSON file that is uploaded along with the drive/folder/file metadata transaction
  readonly txId: ArweaveAddress; // the arweave transaction id for this entity. 43 numbers/letters eg. 1xRhN90Mu5mEgyyrmnzKgZP0y3aK8AwSucwlCOAwsaI
  readonly unixTime: UnixTime; // seconds since unix epoch, taken at the time of upload, 10 numbers eg. 1620068042

  readonly customMetaDataGqlTags?: CustomMetaDataGqlTags;
  readonly customMetaDataJson?: CustomMetaDataJsonFields;

  constructor(
    appName: string,
    appVersion: string,
    arFS: string,
    contentType: ContentType,
    driveId: EntityID,
    entityType: EntityType,
    name: string,
    txId: ArweaveAddress,
    unixTime: UnixTime,
    customMetaDataGqlTags?: CustomMetaDataGqlTags,
    customMetaDataJson?: CustomMetaDataJsonFields,
  ) {
    this.appName = appName;
    this.appVersion = appVersion;
    this.arFS = arFS;
    this.contentType = contentType;
    this.driveId = driveId;
    this.entityType = entityType;
    this.name = name;
    this.txId = txId;
    this.unixTime = unixTime;
    this.customMetaDataGqlTags = customMetaDataGqlTags;
    this.customMetaDataJson = customMetaDataJson;
  }
}

export interface ArFSFileFolderEntity extends ArFSEntity {
  parentFolderId: EntityID; // the uuid of the parent folder that this entity sits within.  Folder Entities used for the drive root must not have a parent folder ID, eg. 41800747-a852-4dc9-9078-6c20f85c0f3a
  entityId: EntityID; // the unique file or folder identifier, created with uuidv4 https://www.npmjs.com/package/uuidv4 eg. 41800747-a852-4dc9-9078-6c20f85c0f3a
  lastModifiedDate: UnixTime; // the last modified date of the file or folder as seconds since unix epoch
}

// prettier-ignore
export abstract class ArFSFileOrFolderEntity<T extends 'file' | 'folder'>
	extends ArFSEntity implements ArFSFileFolderEntity
{
	constructor(
		appName: string,
		appVersion: string,
		arFS: string,
		contentType: ContentType,
		driveId: EntityID,
		readonly entityType: T,
		name: string,
		public size: ByteCount,
		txId: ArweaveAddress,
		unixTime: UnixTime,
		public lastModifiedDate: UnixTime,
		public dataTxId: ArweaveAddress,
		public dataContentType: string,
		readonly parentFolderId: EntityID,
		readonly entityId: EntityID,
		customMetaDataGqlTags?: CustomMetaDataGqlTags,
		customMetaDataJson?: CustomMetaDataJsonFields
	) {
		super(appName, appVersion, arFS, contentType, driveId, entityType, name, txId, unixTime, customMetaDataGqlTags, customMetaDataJson);
	}
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
export type ArFSPublicMetadataEntityBuilderParams =
  ArFSMetadataEntityBuilderParams;
export interface ArFSPrivateMetadataEntityBuilderParams
  extends ArFSMetadataEntityBuilderParams {
  key: EntityKey;
}

export type ArFSMetadataEntityBuilderFactoryFunction<
  T extends ArFSEntity,
  B extends ArFSMetadataEntityBuilder<T>,
  P extends ArFSMetadataEntityBuilderParams,
> = (params: P) => B;

export interface CustomMetaData {
  /** Include custom metadata on MetaData Tx Data JSON */
  metaDataJson?: CustomMetaDataJsonFields;

  /** Include custom metadata on MetaData Tx GQL Tags */
  metaDataGqlTags?: CustomMetaDataGqlTags;

  /** Include custom metadata on File Data Tx GQL Tags */
  dataGqlTags?: CustomMetaDataTagInterface;
}

export abstract class ArFSMetadataEntityBuilder<T extends ArFSEntity> {
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

  customMetaData: CustomMetaData = {};

  constructor({
    entityId,
    gatewayApi,
    owner,
  }: ArFSMetadataEntityBuilderParams) {
    this.entityId = entityId;
    this.gatewayApi = gatewayApi;
    this.owner = owner;
  }

  abstract getGqlQueryParameters(): GQLTagInterface[];
  protected abstract buildEntity(): Promise<T>;

  public async getDataForTxID(txId: ArweaveAddress): Promise<Uint8Array> {
    return await this.gatewayApi.getTxData(txId);
  }

  /**
   * Parses data for builder fields from either the provided GQL tags, or from a fresh request to Arweave for tag data
   *
   * @param node (optional) a pre-fetched GQL node containing the txID and tags that will be parsed out of the on-chain data
   *
   * @param owner (optional) filter all transactions out by owner's public arweave address
   *
   * @returns an array of unparsed tags
   */
  protected async parseFromArweaveNode(
    node?: GQLNodeInterface,
    owner?: ArweaveAddress,
  ): Promise<GQLTagInterface[]> {
    const unparsedTags: GQLTagInterface[] = [];
    if (!node) {
      const gqlQuery = buildQuery({
        tags: this.getGqlQueryParameters(),
        owner,
      });

      const transactions = await this.gatewayApi.gqlRequest(gqlQuery);

      const { edges } = transactions;

      if (!edges.length) {
        throw new Error(`Entity with ID ${this.entityId} not found!`);
      }

      node = edges[0].node;
    }
    this.txId = ADDR(node.id);
    const { tags } = node;
    if (!tags) {
      throw new Error("Tags missing!");
    }
    tags.forEach((tag: GQLTagInterface) => {
      const key = tag.name;
      const { value } = tag;
      switch (key) {
        case "App-Name":
          this.appName = value;
          break;
        case "App-Version":
          this.appVersion = value;
          break;
        case "ArFS":
          this.arFS = value;
          break;
        case "Content-Type":
          this.contentType = value as ContentType;
          break;
        case "Drive-Id":
          this.driveId = EID(value);
          break;
        case "Entity-Type":
          this.entityType = value as EntityType;
          break;
        case "Unix-Time":
          this.unixTime = new UnixTime(+value);
          break;
        default:
          unparsedTags.push(tag);
          break;
      }
    });

    return unparsedTags;
  }

  public async build(node?: GQLNodeInterface): Promise<T> {
    const extraTags = await this.parseFromArweaveNode(node, this.owner);
    if (!extraTags) {
      throw new Error("Tags missing!");
    }
    this.parseCustomMetaDataFromGqlTags(extraTags);

    return this.buildEntity();
  }

  private parseCustomMetaDataFromGqlTags(gqlTags: GQLTagInterface[]): void {
    const customMetaDataGqlTags: CustomMetaDataGqlTags = {};

    for (const { name, value: newValue } of gqlTags) {
      const prevValue = customMetaDataGqlTags[name];

      // Accumulate any duplicated GQL tags into string[]
      const nextValue = prevValue
        ? Array.isArray(prevValue)
          ? [...prevValue, newValue]
          : [prevValue, newValue]
        : newValue;

      Object.assign(customMetaDataGqlTags, { [name]: nextValue });
    }

    if (!isCustomMetaDataGqlTags(customMetaDataGqlTags)) {
      console.error(
        `Parsed an invalid custom metadata shape from MetaData Tx GQL Tags: ${customMetaDataGqlTags}`,
      );
      return;
    }

    if (Object.keys(customMetaDataGqlTags).length > 0) {
      this.customMetaData.metaDataGqlTags = customMetaDataGqlTags;
    }
  }

  protected abstract protectedDataJsonKeys: string[];

  protected parseCustomMetaDataFromDataJson(
    dataJson: CustomMetaDataJsonFields,
  ): void {
    if (!isCustomMetaDataJsonFields(dataJson)) {
      console.error(
        `Parsed an invalid custom metadata shape from MetaData Tx Data JSON: ${dataJson}`,
      );
      return;
    }
    const dataJsonEntries = Object.entries(dataJson).filter(
      ([key]) => !this.protectedDataJsonKeys.includes(key),
    );
    const customMetaDataJson: CustomMetaDataJsonFields = {};

    for (const [key, val] of dataJsonEntries) {
      Object.assign(customMetaDataJson, { [key]: val });
    }

    if (Object.keys(customMetaDataJson).length > 0) {
      this.customMetaData.metaDataJson = customMetaDataJson;
    }
  }
}

export abstract class ArFSFileOrFolderBuilder<
  U extends "file" | "folder",
  T extends ArFSFileOrFolderEntity<U>,
> extends ArFSMetadataEntityBuilder<T> {
  parentFolderId?: EntityID;

  protected async parseFromArweaveNode(
    node?: GQLNodeInterface,
  ): Promise<GQLTagInterface[]> {
    const unparsedTags: GQLTagInterface[] = [];
    const tags = await super.parseFromArweaveNode(node);
    if (!tags) {
      throw new Error("Tags missing!");
    }
    tags.forEach((tag: GQLTagInterface) => {
      const key = tag.name;
      const { value } = tag;
      switch (key) {
        case "Parent-Folder-Id":
          this.parentFolderId = EID(value);
          break;
        default:
          unparsedTags.push(tag);
          break;
      }
    });

    return unparsedTags;
  }
}

interface ArFSTagSettingsParams {
  appName?: string;
  appVersion?: string;
  arFSVersion?: string;
}

export class ArFSTagSettings {
  private readonly appName: string;
  private readonly appVersion: string;
  private readonly arFSVersion: string;

  public static protectedArFSGqlTagNames = gqlTagNameArray;

  constructor({
    appName = "default",
    appVersion = "default",
    arFSVersion = "default",
  }: ArFSTagSettingsParams) {
    this.appName = appName;
    this.appVersion = appVersion;
    this.arFSVersion = arFSVersion;
  }

  public get baseAppTags(): GQLTagInterface[] {
    return [
      { name: "App-Name", value: this.appName },
      { name: "App-Version", value: this.appVersion },
    ];
  }

  public get baseArFSTags(): GQLTagInterface[] {
    return [...this.baseAppTags, { name: "ArFS", value: this.arFSVersion }];
  }

  public get baseBundleTags(): GQLTagInterface[] {
    return [
      ...this.baseAppTags,
      { name: "Bundle-Format", value: "binary" },
      { name: "Bundle-Version", value: "2.0.0" },
    ];
  }

  /**
   * Used for estimating byte count of data items to bypass storing the Buffer from ArFSFileDataPrototype
   *
   * TODO: Don't use the file data Buffer in ArFSFileDataPrototype so it can be used in estimation without memory concerns
   */
  public getFileDataItemTags(
    isPrivate: boolean,
    dataContentType: string,
  ): GQLTagInterface[] {
    const tags = this.baseAppTags;

    tags.push(
      ...(isPrivate
        ? [privateOctetContentTypeTag, privateCipherTag, fakePrivateCipherIVTag]
        : [{ name: "Content-Type", value: dataContentType }]),
    );

    return tags;
  }
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

export type ListPublicFolderParams = MakeOptional<
  ArFSListPublicFolderParams,
  "maxDepth" | "includeRoot" | "owner"
>;
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

export type ArFSFees = { [key: string]: Winston };

export interface ArFSResult {
  created: ArFSEntityData[];
  tips: TipData[];
  fees: ArFSFees;
}

export interface ArFSManifestResult extends ArFSResult {
  manifest: Manifest | Record<string, never>;
  links: string[];
}

export const emptyArFSResult: ArFSResult = {
  created: [],
  tips: [],
  fees: {},
};

export const emptyManifestResult: ArFSManifestResult = {
  ...emptyArFSResult,
  manifest: {},
  links: [],
};
export interface MetaDataBaseCosts {
  metaDataBaseReward: Winston;
}

export interface RecursivePublicBulkUploadParams {
  parentFolderId: EntityID;
  wrappedFolder: ArFSFolderToUpload;
  driveId: EntityID;
  owner: ArweaveAddress;
}
export type RecursivePrivateBulkUploadParams = RecursivePublicBulkUploadParams &
  WithDriveKey;

export interface UploadPublicManifestParams {
  folderId: EntityID;
  maxDepth?: number;
  destManifestName?: string;
  conflictResolution?: FileNameConflictResolution;
  prompts?: FileConflictPrompts;
}

export interface CreatePublicManifestParams
  extends Required<UploadPublicManifestParams> {
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
export interface UploadStats<T = ArFSDataToUpload | ArFSFolderToUpload>
  extends ArDriveUploadStats<T> {
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

// The manifest interfaces below are taken from arweave-deploy

// A path object is labeled by its path, file name
// and extension, and then an arweave transaction id
export interface ManifestPathMap {
  [index: string]: { id: string };
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
  // progressCB?: (pctTotal: number, pctFile: number, curFileName: string, curFilePath: string) => void
}

export type DownloadPrivateFileParameters = DownloadPublicFileParameters &
  WithDriveKey;

export interface DownloadPublicFolderParameters {
  folderId: EntityID;
  destFolderPath: string;
  customFolderName?: string;
  maxDepth: number;
  owner?: ArweaveAddress;
}

export type DownloadPrivateFolderParameters = DownloadPublicFolderParameters &
  WithDriveKey;

export interface DownloadPublicDriveParameters {
  driveId: EntityID;
  destFolderPath: string;
  customFolderName?: string;
  maxDepth: number;
  owner?: ArweaveAddress;
}

export type DownloadPrivateDriveParameters = DownloadPublicDriveParameters &
  WithDriveKey;

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
export interface RetryPublicArFSFileByFileIdParams
  extends BasePublicFileRetryParams {
  fileId: EntityID;
}

export interface RetryPublicArFSFileByDestFolderIdParams
  extends BasePublicFileRetryParams {
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
export type ArFSAllPrivateFoldersOfDriveParams =
  ArFSAllPublicFoldersOfDriveParams & WithDriveKey;

export type WithDriveKey = { driveKey: EntityKey };

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
  // File ID will be defined here for revision retries
  fileId?: EntityID;
}

export const skipOnConflicts = "skip";
export const replaceOnConflicts = "replace";
export const upsertOnConflicts = "upsert";
export const askOnConflicts = "ask";

export const renameOnConflicts = "rename";
export const useExistingFolder = "useFolder";

export const errorOnConflict = "error";

/** Conflict settings used by ArDrive class */
export type FileNameConflictResolution =
  | typeof skipOnConflicts
  | typeof replaceOnConflicts
  | typeof upsertOnConflicts
  | typeof askOnConflicts;

export interface ConflictPromptParams {
  namesWithinDestFolder: string[];
}
export interface FileConflictPromptParams extends ConflictPromptParams {
  fileName: string;
  fileId: EntityID;
}

export interface FileToFileConflictPromptParams
  extends FileConflictPromptParams {
  hasSameLastModifiedDate: boolean;
}

export interface FolderConflictPromptParams extends ConflictPromptParams {
  folderName: string;
  folderId: EntityID;
}

export type FileToFileNameConflictPrompt = (
  params: FileToFileConflictPromptParams,
) => Promise<
  | { resolution: typeof skipOnConflicts | typeof replaceOnConflicts }
  | { resolution: typeof renameOnConflicts; newFileName: string }
>;

export type FileToFolderConflictAskPrompt = (
  params: FolderConflictPromptParams,
) => Promise<
  | { resolution: typeof skipOnConflicts }
  | { resolution: typeof renameOnConflicts; newFileName: string }
>;

export type FolderToFileConflictAskPrompt = (
  params: FileConflictPromptParams,
) => Promise<
  | { resolution: typeof skipOnConflicts }
  | { resolution: typeof renameOnConflicts; newFolderName: string }
>;

export type FolderToFolderConflictAskPrompt = (
  params: FolderConflictPromptParams,
) => Promise<
  | { resolution: typeof skipOnConflicts | typeof useExistingFolder }
  | { resolution: typeof renameOnConflicts; newFolderName: string }
>;

export type FileConflictResolutionFnResult =
  | { existingFileId?: EntityID; newFileName?: string }
  | typeof skipOnConflicts;

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

export interface ResolveFileNameConflictsParams
  extends ResolveNameConflictsParams {
  destinationFileName: string;
  wrappedFile: ArFSDataToUpload;
  prompts?: FileConflictPrompts;
}

export interface ResolveFolderNameConflictsParams
  extends ResolveNameConflictsParams {
  destinationFolderName: string;
  wrappedFolder: ArFSFolderToUpload;
  prompts?: FolderConflictPrompts;
}

export abstract class ArFSBaseEntityToUpload {
  abstract getBaseName(): string;
  abstract readonly entityType: EntityType;

  // Source URI is optional when an upload has no local or remote source (manifest use case). It remains
  // non-abstract so classes can choose not have to implement it, which will default the value to undefined
  readonly sourceUri?: string;

  readonly customMetaData?: CustomMetaData;

  destName?: string;
  existingId?: EntityID;

  public get destinationBaseName(): string {
    return this.destName ?? this.getBaseName();
  }

  constructor() {
    if (this.customMetaData !== undefined) {
      assertCustomMetaData(this.customMetaData);
    }
  }
}

export abstract class ArFSDataToUpload extends ArFSBaseEntityToUpload {
  abstract gatherFileInfo(): FileInfo;
  abstract getFileDataBuffer(): Promise<ArrayBuffer>;

  abstract readonly contentType: string;
  abstract readonly lastModifiedDate: UnixTime;
  abstract readonly size: ByteCount;

  conflictResolution?: FileConflictResolution;
  readonly customContentType?: string;

  readonly entityType = "file";
}

export class ArFSManifestToUpload extends ArFSDataToUpload {
  manifest: Manifest;
  lastModifiedDateMS: UnixTime;

  constructor(
    public readonly folderToGenManifest: (
      | ArFSPublicFolderWithPaths
      | ArFSPublicFileWithPaths
    )[],
    public readonly destManifestName: string,
    public readonly customMetaData?: CustomMetaData,
  ) {
    super();

    const sortedChildren = folderToGenManifest.sort((a, b) =>
      alphabeticalOrder(a.path, b.path),
    );
    const baseFolderPath = sortedChildren[0].path;

    // TODO: Fix base types so deleting un-used values is not necessary; Tickets: PE-525 + PE-556
    const castedChildren = sortedChildren as Partial<
      ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths
    >[];
    castedChildren.map((fileOrFolderMetaData) => {
      if (fileOrFolderMetaData.entityType === "folder") {
        delete fileOrFolderMetaData.lastModifiedDate;
        delete fileOrFolderMetaData.size;
        delete fileOrFolderMetaData.dataTxId;
        delete fileOrFolderMetaData.dataContentType;
      }
    });

    // TURN SORTED CHILDREN INTO MANIFEST
    const pathMap: ManifestPathMap = {};
    castedChildren.forEach((child) => {
      if (
        child.dataTxId &&
        child.path &&
        child.dataContentType !== MANIFEST_CONTENT_TYPE
      ) {
        const path = child.path
          // Slice off base folder path and the leading "/" so manifest URLs path correctly
          .slice(baseFolderPath.length + 1)
          // Replace spaces with underscores for sharing links
          .replace(/ /g, "_");

        pathMap[path] = { id: `${child.dataTxId}` };
      }
    });

    if (Object.keys(pathMap).length === 0) {
      throw new Error(
        "Cannot construct a manifest of a folder that has no file entities!",
      );
    }

    // Use index.html in the specified folder if it exists, otherwise show first file found
    const indexPath = Object.keys(pathMap).includes(`index.html`)
      ? `index.html`
      : Object.keys(pathMap)[0];

    this.manifest = {
      manifest: "arweave/paths",
      version: "0.1.0",
      index: {
        path: indexPath,
      },
      paths: pathMap,
    };

    // Create new current unix, as we just created this manifest
    this.lastModifiedDateMS = new UnixTime(Math.round(Date.now() / 1000));
  }

  public getLinksOutput(
    dataTxId: ArweaveAddress,
    gateway = new URL(defaultArweaveGatewayPath),
  ): string[] {
    const allPaths = Object.keys(this.manifest.paths);

    const encodedPaths = allPaths.map((path) =>
      path
        // Split each path by `/` to avoid encoding the separation between folders and files
        .split("/")
        // Encode file/folder names for URL safe links
        .map((path) => encodeURIComponent(path))
        // Rejoin the paths
        .join("/"),
    );

    const pathsToFiles = encodedPaths.map(
      (encodedPath) => `${gateway.href}${dataTxId}/${encodedPath}`,
    );
    const pathToManifestTx = `${gateway.href}${dataTxId}`;

    return [pathToManifestTx, ...pathsToFiles];
  }

  public gatherFileInfo(): FileInfo {
    return {
      dataContentType: this.contentType,
      lastModifiedDateMS: this.lastModifiedDateMS,
      fileSize: this.size,
    };
  }

  public get contentType(): string {
    return this.customContentType ?? MANIFEST_CONTENT_TYPE;
  }

  public getBaseName(): string {
    return this.destName ?? this.destManifestName;
  }

  public async getFileDataBuffer(): Promise<Uint8Array> {
    const data = JSON.stringify(this.manifest);
    return new Uint8Array(encodeStringToArrayBuffer(data));
  }

  public get size(): ByteCount {
    const data = JSON.stringify(this.manifest);
    return new ByteCount(encodeStringToArrayBuffer(data).byteLength);
  }

  public get lastModifiedDate(): UnixTime {
    return this.lastModifiedDateMS;
  }
}

export type FolderConflictResolution =
  | typeof skipOnConflicts
  | typeof errorOnConflict
  | undefined;
export type FileConflictResolution =
  | FolderConflictResolution
  | typeof upsertOnConflicts;
export type RewardSettings = {
  reward?: Winston;
};
