import { JWKInterface } from "arweave/node/lib/wallet";
import { ENCRYPTED_DATA_PLACEHOLDER_TYPE } from "src/constants";
import { ArweaveAddress, EntityMetaDataTransactionData, PrivateKeyData } from "../arweave";
import { CustomMetaDataGqlTags, CustomMetaDataJsonFields, GQLNodeInterface, GQLTagInterface } from "../gql";
import { ArFSEntity, ArFSMetadataEntityBuilder, ArFSMetadataEntityBuilderParams, ArFSPrivateMetadataEntityBuilderParams, ContentType, DriveAuthMode, DrivePrivacy, EntityID, EntityKey, EntityType, UnixTime } from "./common";
import { GatewayAPI } from "../common";
export interface ArFSDriveEntity extends ArFSEntity {
    drivePrivacy: string;
    rootFolderId: EntityID | ENCRYPTED_DATA_PLACEHOLDER_TYPE;
}
export declare class ArFSPublicDrive extends ArFSEntity implements ArFSDriveEntity {
    readonly appName: string;
    readonly appVersion: string;
    readonly arFS: string;
    readonly contentType: ContentType;
    readonly driveId: EntityID;
    readonly entityType: EntityType;
    readonly name: string;
    readonly txId: ArweaveAddress;
    readonly unixTime: UnixTime;
    readonly drivePrivacy: DrivePrivacy;
    readonly rootFolderId: EntityID;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: EntityID, entityType: EntityType, name: string, txId: ArweaveAddress, unixTime: UnixTime, drivePrivacy: DrivePrivacy, rootFolderId: EntityID, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class ArFSPrivateDrive extends ArFSEntity implements ArFSDriveEntity {
    readonly appName: string;
    readonly appVersion: string;
    readonly arFS: string;
    readonly contentType: ContentType;
    readonly driveId: EntityID;
    readonly entityType: EntityType;
    readonly name: string;
    readonly txId: ArweaveAddress;
    readonly unixTime: UnixTime;
    readonly drivePrivacy: DrivePrivacy;
    readonly rootFolderId: EntityID;
    readonly driveAuthMode: DriveAuthMode;
    readonly cipher: string;
    readonly cipherIV: string;
    readonly driveKey: EntityKey;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: EntityID, entityType: EntityType, name: string, txId: ArweaveAddress, unixTime: UnixTime, drivePrivacy: DrivePrivacy, rootFolderId: EntityID, driveAuthMode: DriveAuthMode, cipher: string, cipherIV: string, driveKey: EntityKey, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export interface DriveMetaDataTransactionData extends EntityMetaDataTransactionData {
    name: string;
    rootFolderId: string;
}
declare abstract class ArFSDriveBuilder<T extends ArFSDriveEntity> extends ArFSMetadataEntityBuilder<T> {
    protected readonly protectedDataJsonKeys: string[];
}
export declare class ArFSPublicDriveBuilder extends ArFSDriveBuilder<ArFSPublicDrive> {
    drivePrivacy?: DrivePrivacy;
    rootFolderId?: EntityID;
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI): ArFSPublicDriveBuilder;
    getGqlQueryParameters(): GQLTagInterface[];
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected buildEntity(): Promise<ArFSPublicDrive>;
}
export declare class ArFSPrivateDriveBuilder extends ArFSDriveBuilder<ArFSPrivateDrive> {
    drivePrivacy?: DrivePrivacy;
    rootFolderId?: EntityID;
    driveAuthMode?: DriveAuthMode;
    cipher?: string;
    cipherIV?: string;
    private readonly driveKey;
    constructor({ entityId: driveId, key: driveKey, owner, gatewayApi, }: ArFSPrivateMetadataEntityBuilderParams);
    getGqlQueryParameters(): GQLTagInterface[];
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI, driveKey: EntityKey): ArFSPrivateDriveBuilder;
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected buildEntity(): Promise<ArFSPrivateDrive>;
}
export declare class EncryptedEntityID extends EntityID {
    constructor();
}
export interface SafeArFSPrivateMetadataEntityBuilderParams extends ArFSMetadataEntityBuilderParams {
    privateKeyData: PrivateKeyData;
}
export declare class SafeArFSDriveBuilder extends ArFSDriveBuilder<ArFSDriveEntity> {
    drivePrivacy?: DrivePrivacy;
    rootFolderId?: EntityID;
    driveAuthMode?: DriveAuthMode;
    cipher?: string;
    cipherIV?: string;
    private readonly privateKeyData;
    constructor({ entityId: driveId, privateKeyData, gatewayApi, }: SafeArFSPrivateMetadataEntityBuilderParams);
    getGqlQueryParameters(): GQLTagInterface[];
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI, privateKeyData: PrivateKeyData): SafeArFSDriveBuilder;
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected buildEntity(): Promise<ArFSDriveEntity>;
}
export declare class ArFSPrivateDriveKeyless extends ArFSPrivateDrive {
    driveKey: EntityKey;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: EntityID, entityType: EntityType, name: string, txId: ArweaveAddress, unixTime: UnixTime, drivePrivacy: DrivePrivacy, rootFolderId: EntityID, driveAuthMode: DriveAuthMode, cipher: string, cipherIV: string, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class PrivateDriveKeyData {
    readonly driveId: EntityID;
    readonly driveKey: EntityKey;
    private constructor();
    static from(drivePassword: string, privateKey: JWKInterface): Promise<PrivateDriveKeyData>;
}
export {};
