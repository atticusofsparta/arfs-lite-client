import { Utf8ArrayToStr, encryptedDataSize, extToMime } from "src/utils/common";
import { ArweaveAddress, EntityMetaDataTransactionData } from "../arweave";
import { ByteCount, GatewayAPI } from "../common";
import {
  CustomMetaDataGqlTags,
  CustomMetaDataJsonFields,
  GQLNodeInterface,
  GQLTagInterface,
} from "../gql";
import {
  ArFSDataToUpload,
  ArFSFileOrFolderBuilder,
  ArFSFileOrFolderEntity,
  ArFSWithPath,
  ContentType,
  CustomMetaData,
  EID,
  EntityID,
  EntityKey,
  UnixTime,
} from "./common";
import { FolderHierarchy } from "./folder";
import { deriveFileKey, fileDecrypt } from "src/utils/crypto";
import { PRIVATE_CONTENT_TYPE } from "src/constants";

export class ArFSPublicFile extends ArFSFileOrFolderEntity<"file"> {
  constructor(
    appName: string,
    appVersion: string,
    arFS: string,
    contentType: ContentType,
    driveId: EntityID,
    name: string,
    txId: ArweaveAddress,
    unixTime: UnixTime,
    parentFolderId: EntityID,
    readonly fileId: EntityID,
    size: ByteCount,
    lastModifiedDate: UnixTime,
    dataTxId: ArweaveAddress,
    dataContentType: string,
    customMetaDataGqlTags?: CustomMetaDataGqlTags,
    customMetaDataJson?: CustomMetaDataJsonFields,
  ) {
    super(
      appName,
      appVersion,
      arFS,
      contentType,
      driveId,
      "file",
      name,
      size,
      txId,
      unixTime,
      lastModifiedDate,
      dataTxId,
      dataContentType,
      parentFolderId,
      fileId,
      customMetaDataGqlTags,
      customMetaDataJson,
    );
  }
}

export class ArFSPublicFileWithPaths
  extends ArFSPublicFile
  implements ArFSWithPath
{
  readonly path: string;
  readonly txIdPath: string;
  readonly entityIdPath: string;

  constructor(entity: ArFSPublicFile, hierarchy: FolderHierarchy) {
    super(
      entity.appName,
      entity.appVersion,
      entity.arFS,
      entity.contentType,
      entity.driveId,
      entity.name,
      entity.txId,
      entity.unixTime,
      entity.parentFolderId,
      entity.fileId,
      entity.size,
      entity.lastModifiedDate,
      entity.dataTxId,
      entity.dataContentType,
      entity.customMetaDataGqlTags,
      entity.customMetaDataJson,
    );

    this.path = `${hierarchy.pathToFolderId(entity.parentFolderId)}${
      entity.name
    }`;
    this.txIdPath = `${hierarchy.txPathToFolderId(entity.parentFolderId)}${
      entity.txId
    }`;
    this.entityIdPath = `${hierarchy.entityPathToFolderId(
      entity.parentFolderId,
    )}${entity.fileId}`;
  }
}

export class ArFSPrivateFile extends ArFSFileOrFolderEntity<"file"> {
  constructor(
    appName: string,
    appVersion: string,
    arFS: string,
    contentType: ContentType,
    driveId: EntityID,
    name: string,
    txId: ArweaveAddress,
    unixTime: UnixTime,
    parentFolderId: EntityID,
    readonly fileId: EntityID,
    size: ByteCount,
    lastModifiedDate: UnixTime,
    dataTxId: ArweaveAddress,
    dataContentType: string,
    readonly cipher: string,
    readonly cipherIV: string,
    readonly fileKey: EntityKey,
    readonly driveKey: EntityKey,
    customMetaDataGqlTags?: CustomMetaDataGqlTags,
    customMetaDataJson?: CustomMetaDataJsonFields,
  ) {
    super(
      appName,
      appVersion,
      arFS,
      contentType,
      driveId,
      "file",
      name,
      size,
      txId,
      unixTime,
      lastModifiedDate,
      dataTxId,
      dataContentType,
      parentFolderId,
      fileId,
      customMetaDataGqlTags,
      customMetaDataJson,
    );
  }

  get encryptedDataSize(): ByteCount {
    return encryptedDataSize(this.size);
  }
}

export class ArFSPrivateFileWithPaths
  extends ArFSPrivateFile
  implements ArFSWithPath
{
  readonly path: string;
  readonly txIdPath: string;
  readonly entityIdPath: string;

  constructor(entity: ArFSPrivateFile, hierarchy: FolderHierarchy) {
    super(
      entity.appName,
      entity.appVersion,
      entity.arFS,
      entity.contentType,
      entity.driveId,
      entity.name,
      entity.txId,
      entity.unixTime,
      entity.parentFolderId,
      entity.fileId,
      entity.size,
      entity.lastModifiedDate,
      entity.dataTxId,
      entity.dataContentType,
      entity.cipher,
      entity.cipherIV,
      entity.fileKey,
      entity.driveKey,
      entity.customMetaDataGqlTags,
      entity.customMetaDataJson,
    );

    this.path = `${hierarchy.pathToFolderId(entity.parentFolderId)}${
      entity.name
    }`;
    this.txIdPath = `${hierarchy.txPathToFolderId(entity.parentFolderId)}${
      entity.txId
    }`;
    this.entityIdPath = `${hierarchy.entityPathToFolderId(
      entity.parentFolderId,
    )}${entity.fileId}`;
  }
}

export class ArFSPrivateFileWithPathsKeyless extends ArFSPrivateFileWithPaths {
  driveKey: EntityKey;
  fileKey: EntityKey;

  constructor(entity: ArFSPrivateFile, hierarchy: FolderHierarchy) {
    super(entity, hierarchy);
    this.driveKey = new EntityKey(new Uint8Array([]));
    delete (this as { driveKey?: unknown }).driveKey;
    this.fileKey = new EntityKey(new Uint8Array([]));
    delete (this as { fileKey?: unknown }).fileKey;
  }
}

// Remove me after PE-1027 is applied
export class ArFSPrivateFileKeyless extends ArFSPrivateFile {
  driveKey: EntityKey;
  fileKey: EntityKey;

  constructor(entity: ArFSPrivateFile) {
    super(
      entity.appName,
      entity.appVersion,
      entity.arFS,
      entity.contentType,
      entity.driveId,
      entity.name,
      entity.txId,
      entity.unixTime,
      entity.parentFolderId,
      entity.fileId,
      entity.size,
      entity.lastModifiedDate,
      entity.dataTxId,
      entity.dataContentType,
      entity.cipher,
      entity.cipherIV,
      entity.fileKey,
      entity.driveKey,
      entity.customMetaDataGqlTags,
      entity.customMetaDataJson,
    );
    this.driveKey = new EntityKey(new Uint8Array([]));
    delete (this as { driveKey?: unknown }).driveKey;
    this.fileKey = new EntityKey(new Uint8Array([]));
    delete (this as { fileKey?: unknown }).fileKey;
  }
}

export interface FileMetaDataTransactionData
  extends EntityMetaDataTransactionData {
  // FIXME: do we need our safe types here? This interface refers to a JSON with primitive types
  name: string;
  size: number;
  lastModifiedDate: number;
  dataTxId: string;
  dataContentType: string;
}
export abstract class ArFSFileBuilder<
  T extends ArFSPublicFile | ArFSPrivateFile,
> extends ArFSFileOrFolderBuilder<"file", T> {
  size?: ByteCount;
  lastModifiedDate?: UnixTime;
  dataTxId?: ArweaveAddress;
  dataContentType?: string;

  getGqlQueryParameters(): GQLTagInterface[] {
    return [
      { name: "File-Id", value: `${this.entityId}` },
      { name: "Entity-Type", value: "file" },
    ];
  }

  protected async parseFromArweaveNode(
    node?: GQLNodeInterface,
  ): Promise<GQLTagInterface[]> {
    const tags = await super.parseFromArweaveNode(node);
    if (!tags) {
      throw new Error("Tags missing!");
    }
    return tags.filter((tag) => tag.name !== "File-Id");
  }

  protected readonly protectedDataJsonKeys = [
    "name",
    "size",
    "lastModifiedDate",
    "dataTxId",
    "dataContentType",
  ];
}

export class ArFSPublicFileBuilder extends ArFSFileBuilder<ArFSPublicFile> {
  static fromArweaveNode(
    node: GQLNodeInterface,
    gatewayApi: GatewayAPI,
  ): ArFSPublicFileBuilder {
    const { tags } = node;
    if (!tags) {
      throw new Error("Tags missing!");
    }
    const fileId = tags.find((tag) => tag.name === "File-Id")?.value;
    if (!fileId) {
      throw new Error("File-ID tag missing!");
    }
    const fileBuilder = new ArFSPublicFileBuilder({
      entityId: EID(fileId),
      gatewayApi,
    });
    return fileBuilder;
  }

  protected async buildEntity(): Promise<ArFSPublicFile> {
    if (
      this.appName?.length &&
      this.appVersion?.length &&
      this.arFS?.length &&
      this.contentType?.length &&
      this.driveId &&
      this.entityType?.length &&
      this.txId &&
      this.unixTime &&
      this.parentFolderId &&
      this.entityId
    ) {
      const txData = await this.getDataForTxID(this.txId);
      const dataString = await Utf8ArrayToStr(new Uint8Array(txData));
      const dataJSON: FileMetaDataTransactionData = await JSON.parse(
        dataString,
      );

      // Get fields from data JSON
      this.name = dataJSON.name;
      this.size = new ByteCount(dataJSON.size);
      this.lastModifiedDate = new UnixTime(dataJSON.lastModifiedDate);
      this.dataTxId = new ArweaveAddress(dataJSON.dataTxId);
      this.dataContentType = dataJSON.dataContentType ?? extToMime(this.name);

      if (
        !this.name ||
        this.size === undefined ||
        !this.lastModifiedDate ||
        !this.dataTxId ||
        !this.dataContentType ||
        !(this.entityType === "file")
      ) {
        throw new Error("Invalid file state");
      }
      this.parseCustomMetaDataFromDataJson(dataJSON);

      return Promise.resolve(
        new ArFSPublicFile(
          this.appName,
          this.appVersion,
          this.arFS,
          this.contentType,
          this.driveId,
          this.name,
          this.txId,
          this.unixTime,
          this.parentFolderId,
          this.entityId,
          this.size,
          this.lastModifiedDate,
          this.dataTxId,
          this.dataContentType,
          this.customMetaData.metaDataGqlTags,
          this.customMetaData.metaDataJson,
        ),
      );
    }
    throw new Error("Invalid file state");
  }
}

export class ArFSPrivateFileBuilder extends ArFSFileBuilder<ArFSPrivateFile> {
  cipher?: string;
  cipherIV?: string;

  constructor(
    readonly fileId: EntityID,
    gatewayApi: GatewayAPI,
    private readonly driveKey: EntityKey,
    readonly owner?: ArweaveAddress,
    readonly fileKey?: EntityKey,
  ) {
    super({ entityId: fileId, owner, gatewayApi });
  }

  static fromArweaveNode(
    node: GQLNodeInterface,
    gatewayApi: GatewayAPI,
    driveKey: EntityKey,
  ): ArFSPrivateFileBuilder {
    const { tags } = node;
    if (!tags) {
      throw new Error("Tags missing!");
    }
    const fileId = tags.find((tag) => tag.name === "File-Id")?.value;
    if (!fileId) {
      throw new Error("File-ID tag missing!");
    }
    const fileBuilder = new ArFSPrivateFileBuilder(
      EID(fileId),
      gatewayApi,
      driveKey,
    );
    return fileBuilder;
  }

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
        case "Cipher-IV":
          this.cipherIV = value;
          break;
        case "Cipher":
          this.cipher = value;
          break;
        default:
          unparsedTags.push(tag);
          break;
      }
    });
    return unparsedTags;
  }

  protected async buildEntity(): Promise<ArFSPrivateFile> {
    if (
      this.appName?.length &&
      this.appVersion?.length &&
      this.arFS?.length &&
      this.contentType?.length &&
      this.driveId &&
      this.entityType?.length &&
      this.txId &&
      this.unixTime &&
      this.parentFolderId &&
      this.entityId &&
      this.cipher?.length &&
      this.cipherIV?.length
    ) {
      const txData = await this.getDataForTxID(this.txId);
      const dataBuffer = new Uint8Array(txData);
      const fileKey =
        this.fileKey ?? (await deriveFileKey(`${this.fileId}`, this.driveKey));

      const decryptedFileBuffer: Uint8Array = await fileDecrypt(
        this.cipherIV,
        fileKey,
        dataBuffer,
      );
      const decryptedFileString: string = await Utf8ArrayToStr(
        new Uint8Array(decryptedFileBuffer),
      );
      const decryptedFileJSON: FileMetaDataTransactionData = await JSON.parse(
        decryptedFileString,
      );

      // Get fields from data JSON
      this.name = decryptedFileJSON.name;
      this.size = new ByteCount(decryptedFileJSON.size);
      this.lastModifiedDate = new UnixTime(decryptedFileJSON.lastModifiedDate);
      this.dataTxId = new ArweaveAddress(decryptedFileJSON.dataTxId);
      this.dataContentType =
        decryptedFileJSON.dataContentType ?? extToMime(this.name);

      if (
        !this.name ||
        this.size === undefined ||
        !this.lastModifiedDate ||
        !this.dataTxId ||
        !this.dataContentType ||
        !fileKey ||
        !(this.entityType === "file")
      ) {
        throw new Error("Invalid file state");
      }

      this.parseCustomMetaDataFromDataJson(decryptedFileJSON);

      return new ArFSPrivateFile(
        this.appName,
        this.appVersion,
        this.arFS,
        this.contentType,
        this.driveId,
        this.name,
        this.txId,
        this.unixTime,
        this.parentFolderId,
        this.entityId,
        this.size,
        this.lastModifiedDate,
        this.dataTxId,
        this.dataContentType,
        this.cipher,
        this.cipherIV,
        fileKey,
        this.driveKey,
        this.customMetaData.metaDataGqlTags,
        this.customMetaData.metaDataJson,
      );
    }
    throw new Error("Invalid file state");
  }
}

type BaseName = string;
type LocalEntityPath = string;

/**
 *  Fs + Node implementation file size limitations -- tested on MacOS Sep 27, 2021
 *
 *  Public : 2147483647 bytes
 *  Private: 2147483646 bytes
 */
const maxFileSize = new ByteCount(2_147_483_646);

export interface FileInfo {
  dataContentType: string;
  lastModifiedDateMS: UnixTime;
  fileSize: ByteCount;
}

export class ArFSFileToUpload extends ArFSDataToUpload {
  constructor(
    public readonly filePath: FileSystemEntry,
    public readonly fileStats: File,
    public readonly customContentType?: string,
    public readonly customMetaData?: CustomMetaData,
  ) {
    super();
    this.filePath = filePath;
    this.fileStats = fileStats;
    if (+this.fileStats.size > +maxFileSize) {
      throw new Error(
        `Files greater than "${maxFileSize}" bytes are not yet supported!`,
      );
    }
  }

  public readonly sourceUri = "";

  public gatherFileInfo(): FileInfo {
    const dataContentType = this.contentType;
    const lastModifiedDateMS = this.lastModifiedDate;
    const fileSize = this.size;

    return { dataContentType, lastModifiedDateMS, fileSize };
  }

  public get size(): ByteCount {
    return new ByteCount(this.fileStats.size);
  }

  public get lastModifiedDate(): UnixTime {
    return new UnixTime(Math.floor(this.fileStats.lastModified / 1000));
  }

  public async getFileDataBuffer(): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        const arrayBuffer = reader.result as ArrayBuffer;
        const buffer = new Uint8Array(arrayBuffer);
        resolve(buffer);
      };
      reader.onerror = function () {
        reject(new Error("Error reading file"));
      };
      reader.readAsArrayBuffer(this.fileStats);
    });
  }

  public get contentType(): string {
    if (this.customContentType) {
      return this.customContentType;
    }

    const mimeType = extToMime(this.fileStats.type);

    if (mimeType === "unknown") {
      // If mime type cannot be derived from the file extension, use octet stream content type
      return PRIVATE_CONTENT_TYPE;
    }
    return mimeType;
  }

  public getBaseName(): BaseName {
    return this.filePath.fullPath ?? this.filePath.name;
  }

  /** Computes the size of a private file encrypted with AES256-GCM */
  public encryptedDataSize(): ByteCount {
    return encryptedDataSize(this.size);
  }
}
