// A Drive is a logical grouping of folders and files. All folders and files must be part of a drive, and reference the Drive ID.
// When creating a Drive, a corresponding folder must be created as well. This folder will act as the Drive Root Folder.
import { v4 as uuidv4, v4 } from "uuid";
import { JWKInterface } from "arweave/node/lib/wallet";
import {
  ENCRYPTED_DATA_PLACEHOLDER,
  ENCRYPTED_DATA_PLACEHOLDER_TYPE,
  fakeEntityId,
} from "src/constants";
import {
  ArweaveAddress,
  EntityMetaDataTransactionData,
  PrivateKeyData,
} from "../arweave";
import {
  CustomMetaDataGqlTags,
  CustomMetaDataJsonFields,
  GQLNodeInterface,
  GQLTagInterface,
} from "../gql";
import {
  ArFSEntity,
  ArFSMetadataEntityBuilder,
  ArFSMetadataEntityBuilderParams,
  ArFSPrivateMetadataEntityBuilderParams,
  ContentType,
  DriveAuthMode,
  DrivePrivacy,
  EID,
  EntityID,
  EntityKey,
  EntityType,
  UnixTime,
} from "./common";
import { GatewayAPI } from "../common";
import { Utf8ArrayToStr } from "src/utils/common";
import { deriveDriveKey, driveDecrypt } from "src/utils/crypto";

// This separation of drive and folder entity enables features such as folder view queries.
export interface ArFSDriveEntity extends ArFSEntity {
  drivePrivacy: string; // identifies if this drive is public or private (and encrypted)  can only be "public" or "private"
  rootFolderId: EntityID | ENCRYPTED_DATA_PLACEHOLDER_TYPE; // the uuid of the related drive root folder, stored in the JSON data that is uploaded with each Drive Entity metadata transaction
}

export class ArFSPublicDrive extends ArFSEntity implements ArFSDriveEntity {
  constructor(
    readonly appName: string,
    readonly appVersion: string,
    readonly arFS: string,
    readonly contentType: ContentType,
    readonly driveId: EntityID,
    readonly entityType: EntityType,
    readonly name: string,
    readonly txId: ArweaveAddress,
    readonly unixTime: UnixTime,
    readonly drivePrivacy: DrivePrivacy,
    readonly rootFolderId: EntityID,
    customMetaDataGqlTags?: CustomMetaDataGqlTags,
    customMetaDataJson?: CustomMetaDataJsonFields,
  ) {
    super(
      appName,
      appVersion,
      arFS,
      contentType,
      driveId,
      entityType,
      name,
      txId,
      unixTime,
      customMetaDataGqlTags,
      customMetaDataJson,
    );
  }
}

//private

export class ArFSPrivateDrive extends ArFSEntity implements ArFSDriveEntity {
  constructor(
    readonly appName: string,
    readonly appVersion: string,
    readonly arFS: string,
    readonly contentType: ContentType,
    readonly driveId: EntityID,
    readonly entityType: EntityType,
    readonly name: string,
    readonly txId: ArweaveAddress,
    readonly unixTime: UnixTime,
    readonly drivePrivacy: DrivePrivacy,
    readonly rootFolderId: EntityID,
    readonly driveAuthMode: DriveAuthMode,
    readonly cipher: string,
    readonly cipherIV: string,
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
      entityType,
      name,
      txId,
      unixTime,
      customMetaDataGqlTags,
      customMetaDataJson,
    );
  }
}

export interface DriveMetaDataTransactionData
  extends EntityMetaDataTransactionData {
  name: string;
  rootFolderId: string;
}

abstract class ArFSDriveBuilder<
  T extends ArFSDriveEntity,
> extends ArFSMetadataEntityBuilder<T> {
  protected readonly protectedDataJsonKeys = ["name", "rootFolderId"];
}

export class ArFSPublicDriveBuilder extends ArFSDriveBuilder<ArFSPublicDrive> {
  drivePrivacy?: DrivePrivacy;
  rootFolderId?: EntityID;

  static fromArweaveNode(
    node: GQLNodeInterface,
    gatewayApi: GatewayAPI,
  ): ArFSPublicDriveBuilder {
    const { tags } = node;
    const driveId = tags.find((tag) => tag.name === "Drive-Id")?.value;
    if (!driveId) {
      throw new Error("Drive-ID tag missing!");
    }
    const driveBuilder = new ArFSPublicDriveBuilder({
      entityId: EID(driveId),
      gatewayApi,
    });
    return driveBuilder;
  }

  getGqlQueryParameters(): GQLTagInterface[] {
    return [
      { name: "Drive-Id", value: `${this.entityId}` },
      { name: "Entity-Type", value: "drive" },
      { name: "Drive-Privacy", value: "public" },
    ];
  }

  protected async parseFromArweaveNode(
    node?: GQLNodeInterface,
  ): Promise<GQLTagInterface[]> {
    const unparsedTags: GQLTagInterface[] = [];
    const tags = await super.parseFromArweaveNode(node);
    tags.forEach((tag: GQLTagInterface) => {
      const key = tag.name;
      const { value } = tag;
      switch (key) {
        case "Drive-Privacy":
          this.drivePrivacy = value as DrivePrivacy;
          break;
        default:
          unparsedTags.push(tag);
          break;
      }
    });
    return unparsedTags;
  }

  protected async buildEntity(): Promise<ArFSPublicDrive> {
    if (
      this.appName?.length &&
      this.appVersion?.length &&
      this.arFS?.length &&
      this.contentType?.length &&
      this.driveId &&
      this.entityType?.length &&
      this.txId &&
      this.unixTime &&
      this.driveId.equals(this.entityId) &&
      this.drivePrivacy?.length
    ) {
      const txData = await this.getDataForTxID(this.txId);
      const dataString = await Utf8ArrayToStr(txData);
      const dataJSON = await JSON.parse(dataString);

      // Get the drive name and root folder id
      this.name = dataJSON.name;
      this.rootFolderId = dataJSON.rootFolderId;
      if (!this.name || !this.rootFolderId) {
        throw new Error("Invalid drive state");
      }

      this.parseCustomMetaDataFromDataJson(dataJSON);

      return new ArFSPublicDrive(
        this.appName,
        this.appVersion,
        this.arFS,
        this.contentType,
        this.driveId,
        this.entityType,
        this.name,
        this.txId,
        this.unixTime,
        this.drivePrivacy,
        this.rootFolderId,
        this.customMetaData.metaDataGqlTags,
        this.customMetaData.metaDataJson,
      );
    }

    throw new Error("Invalid drive state");
  }
}

export class ArFSPrivateDriveBuilder extends ArFSDriveBuilder<ArFSPrivateDrive> {
  drivePrivacy?: DrivePrivacy;
  rootFolderId?: EntityID;
  driveAuthMode?: DriveAuthMode;
  cipher?: string;
  cipherIV?: string;
  private readonly driveKey: EntityKey;

  constructor({
    entityId: driveId,
    key: driveKey,
    owner,
    gatewayApi,
  }: ArFSPrivateMetadataEntityBuilderParams) {
    super({ entityId: driveId, owner, gatewayApi });
    this.driveKey = driveKey;
  }

  getGqlQueryParameters(): GQLTagInterface[] {
    return [
      { name: "Drive-Id", value: `${this.entityId}` },
      { name: "Entity-Type", value: "drive" },
      { name: "Drive-Privacy", value: "private" },
    ];
  }

  static fromArweaveNode(
    node: GQLNodeInterface,
    gatewayApi: GatewayAPI,
    driveKey: EntityKey,
  ): ArFSPrivateDriveBuilder {
    const { tags } = node;
    const driveId = tags.find((tag) => tag.name === "Drive-Id")?.value;
    if (!driveId) {
      throw new Error("Drive-ID tag missing!");
    }
    const fileBuilder = new ArFSPrivateDriveBuilder({
      entityId: EID(driveId),
      key: driveKey,
      gatewayApi,
    });
    return fileBuilder;
  }

  protected async parseFromArweaveNode(
    node?: GQLNodeInterface,
  ): Promise<GQLTagInterface[]> {
    const unparsedTags: GQLTagInterface[] = [];
    const tags = await super.parseFromArweaveNode(node);
    tags.forEach((tag: GQLTagInterface) => {
      const key = tag.name;
      const { value } = tag;
      switch (key) {
        case "Cipher":
          this.cipher = value;
          break;
        case "Cipher-IV":
          this.cipherIV = value;
          break;
        case "Drive-Auth-Mode":
          this.driveAuthMode = value as DriveAuthMode;
          break;
        case "Drive-Privacy":
          this.drivePrivacy = value as DrivePrivacy;
          break;
        default:
          unparsedTags.push(tag);
          break;
      }
    });
    return unparsedTags;
  }

  protected async buildEntity(): Promise<ArFSPrivateDrive> {
    if (
      this.appName?.length &&
      this.appVersion?.length &&
      this.arFS?.length &&
      this.contentType?.length &&
      this.driveId &&
      this.entityType?.length &&
      this.txId &&
      this.unixTime &&
      this.drivePrivacy?.length &&
      this.driveAuthMode?.length &&
      this.cipher?.length &&
      this.cipherIV?.length
    ) {
      const txData = await this.getDataForTxID(this.txId);
      const dataBuffer = Buffer.from(txData);
      const decryptedDriveBuffer: Buffer = await driveDecrypt(
        this.cipherIV,
        this.driveKey,
        dataBuffer,
      );
      const decryptedDriveString: string = await Utf8ArrayToStr(
        decryptedDriveBuffer,
      );
      const decryptedDriveJSON: DriveMetaDataTransactionData = await JSON.parse(
        decryptedDriveString,
      );

      this.name = decryptedDriveJSON.name;
      this.rootFolderId = EID(decryptedDriveJSON.rootFolderId);

      this.parseCustomMetaDataFromDataJson(decryptedDriveJSON);

      return new ArFSPrivateDrive(
        this.appName,
        this.appVersion,
        this.arFS,
        this.contentType,
        this.driveId,
        this.entityType,
        this.name,
        this.txId,
        this.unixTime,
        this.drivePrivacy,
        this.rootFolderId,
        this.driveAuthMode,
        this.cipher,
        this.cipherIV,
        this.driveKey,
        this.customMetaData.metaDataGqlTags,
        this.customMetaData.metaDataJson,
      );
    }

    throw new Error("Invalid drive state");
  }
}

// A utility type to assist with fail-safe decryption of private entities
export class EncryptedEntityID extends EntityID {
  constructor() {
    super(`${fakeEntityId}`); // Unused after next line
    this.entityId = ENCRYPTED_DATA_PLACEHOLDER;
  }
}

export interface SafeArFSPrivateMetadataEntityBuilderParams
  extends ArFSMetadataEntityBuilderParams {
  privateKeyData: PrivateKeyData;
}

export class SafeArFSDriveBuilder extends ArFSDriveBuilder<ArFSDriveEntity> {
  drivePrivacy?: DrivePrivacy;
  rootFolderId?: EntityID;
  driveAuthMode?: DriveAuthMode;
  cipher?: string;
  cipherIV?: string;

  private readonly privateKeyData: PrivateKeyData;

  constructor({
    entityId: driveId,
    privateKeyData,
    gatewayApi,
  }: SafeArFSPrivateMetadataEntityBuilderParams) {
    super({ entityId: driveId, gatewayApi });
    this.privateKeyData = privateKeyData;
  }

  getGqlQueryParameters(): GQLTagInterface[] {
    return [
      { name: "Drive-Id", value: `${this.entityId}` },
      { name: "Entity-Type", value: "drive" },
    ];
  }

  static fromArweaveNode(
    node: GQLNodeInterface,
    gatewayApi: GatewayAPI,
    privateKeyData: PrivateKeyData,
  ): SafeArFSDriveBuilder {
    const { tags } = node;
    const driveId = tags.find((tag) => tag.name === "Drive-Id")?.value;
    if (!driveId) {
      throw new Error("Drive-ID tag missing!");
    }
    const driveBuilder = new SafeArFSDriveBuilder({
      entityId: EID(driveId),
      // TODO: Make all private builders optionally take driveKey and fail gracefully, populating fields with 'ENCRYPTED'
      privateKeyData,
      gatewayApi,
    });
    return driveBuilder;
  }

  protected async parseFromArweaveNode(
    node?: GQLNodeInterface,
  ): Promise<GQLTagInterface[]> {
    const unparsedTags: GQLTagInterface[] = [];
    const tags = await super.parseFromArweaveNode(node);
    tags.forEach((tag: GQLTagInterface) => {
      const key = tag.name;
      const { value } = tag;
      switch (key) {
        case "Cipher":
          this.cipher = value;
          break;
        case "Cipher-IV":
          this.cipherIV = value;
          break;
        case "Drive-Auth-Mode":
          this.driveAuthMode = value as DriveAuthMode;
          break;
        case "Drive-Privacy":
          this.drivePrivacy = value as DrivePrivacy;
          break;
        default:
          unparsedTags.push(tag);
          break;
      }
    });
    return unparsedTags;
  }

  protected async buildEntity(): Promise<ArFSDriveEntity> {
    if (
      this.appName?.length &&
      this.appVersion?.length &&
      this.arFS?.length &&
      this.contentType?.length &&
      this.driveId &&
      this.entityType?.length &&
      this.txId &&
      this.unixTime &&
      this.drivePrivacy?.length
    ) {
      const isPrivate = this.drivePrivacy === "private";

      const txData = await this.getDataForTxID(this.txId);
      const dataBuffer = Buffer.from(txData);

      // Data JSON will be false when a private drive cannot be decrypted
      const dataJSON: DriveMetaDataTransactionData = await (async () => {
        if (isPrivate) {
          // Type-check private properties
          if (
            this.cipher?.length &&
            this.driveAuthMode?.length &&
            this.cipherIV?.length
          ) {
            const placeholderDriveData = {
              name: ENCRYPTED_DATA_PLACEHOLDER,
              rootFolderId: ENCRYPTED_DATA_PLACEHOLDER,
            };
            return this.privateKeyData.safelyDecryptToJson<DriveMetaDataTransactionData>(
              this.cipherIV,
              this.entityId,
              dataBuffer,
              placeholderDriveData,
            );
          }
          throw new Error("Invalid private drive state");
        }
        // Drive is public, no decryption needed
        const dataString = await Utf8ArrayToStr(txData);
        return JSON.parse(dataString) as DriveMetaDataTransactionData;
      })();

      this.name = dataJSON.name;
      this.rootFolderId = EID(dataJSON.rootFolderId);

      this.parseCustomMetaDataFromDataJson(dataJSON);

      if (isPrivate) {
        if (!this.driveAuthMode || !this.cipher || !this.cipherIV) {
          throw new Error(
            `Unexpectedly null privacy data for private drive with ID ${this.driveId}!`,
          );
        }

        // // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        // const driveKey = this.privateKeyData.driveKeyForDriveId(this.driveId);
        // if (driveKey) {
        // 	return new ArFSPrivateDrive(
        // 		this.appName,
        // 		this.appVersion,
        // 		this.arFS,
        // 		this.contentType,
        // 		this.driveId,
        // 		this.entityType,
        // 		this.name,
        // 		this.txId,
        // 		this.unixTime,
        // 		this.drivePrivacy,
        // 		this.rootFolderId,
        // 		this.driveAuthMode,
        // 		this.cipher,
        // 		this.cipherIV,
        // 		driveKey
        // 	);
        // }

        return new ArFSPrivateDriveKeyless(
          this.appName,
          this.appVersion,
          this.arFS,
          this.contentType,
          this.driveId,
          this.entityType,
          this.name,
          this.txId,
          this.unixTime,
          this.drivePrivacy,
          this.rootFolderId,
          this.driveAuthMode,
          this.cipher,
          this.cipherIV,
          this.customMetaData.metaDataGqlTags,
          this.customMetaData.metaDataJson,
        );
      }
      return new ArFSPublicDrive(
        this.appName,
        this.appVersion,
        this.arFS,
        this.contentType,
        this.driveId,
        this.entityType,
        this.name,
        this.txId,
        this.unixTime,
        this.drivePrivacy,
        this.rootFolderId,
        this.customMetaData.metaDataGqlTags,
        this.customMetaData.metaDataJson,
      );
    }
    throw new Error("Invalid drive state");
  }
}

export class ArFSPrivateDriveKeyless extends ArFSPrivateDrive {
  driveKey: EntityKey;

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
    drivePrivacy: DrivePrivacy,
    rootFolderId: EntityID,
    driveAuthMode: DriveAuthMode,
    cipher: string,
    cipherIV: string,
    customMetaDataGqlTags?: CustomMetaDataGqlTags,
    customMetaDataJson?: CustomMetaDataJsonFields,
  ) {
    super(
      appName,
      appVersion,
      arFS,
      contentType,
      driveId,
      entityType,
      name,
      txId,
      unixTime,
      drivePrivacy,
      rootFolderId,
      driveAuthMode,
      cipher,
      cipherIV,
      new EntityKey(Buffer.from([])),
      customMetaDataGqlTags,
      customMetaDataJson,
    );
    this.driveKey = new EntityKey(Buffer.from([]));
    delete (this as { driveKey?: unknown }).driveKey;
  }
}

export class PrivateDriveKeyData {
  private constructor(
    readonly driveId: EntityID,
    readonly driveKey: EntityKey,
  ) {}

  static async from(
    drivePassword: string,
    privateKey: JWKInterface,
  ): Promise<PrivateDriveKeyData> {
    const driveId = uuidv4();
    const driveKey = await deriveDriveKey(
      drivePassword,
      driveId,
      JSON.stringify(privateKey),
    );
    return new PrivateDriveKeyData(EID(driveId), driveKey);
  }
}
