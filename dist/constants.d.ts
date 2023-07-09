import { ArweaveAddress } from "./types/arweave";
export declare const JSON_CONTENT_TYPE = "application/json";
export declare const PRIVATE_CONTENT_TYPE = "application/octet-stream";
export declare const MANIFEST_CONTENT_TYPE = "application/x.arweave-manifest+json";
export declare const publicJsonContentTypeTag: {
    name: string;
    value: string;
};
export declare const privateOctetContentTypeTag: {
    name: string;
    value: string;
};
export declare const defaultCipher: string;
export declare const privateCipherTag: {
    name: string;
    value: string;
};
export declare const fakePrivateCipherIVTag: {
    name: string;
    value: string;
};
export declare const defaultGatewayHost = "arweave.net";
export declare const defaultGatewayProtocol = "https";
export declare const defaultGatewayPort = 443;
export declare const defaultArweaveGatewayPath: string;
export declare const gatewayGqlEndpoint = "graphql";
export declare const authTagLength = 16;
export declare const defaultMaxConcurrentChunks = 32;
export declare const ROOT_FOLDER_ID_PLACEHOLDER = "root folder";
export declare const ENCRYPTED_DATA_PLACEHOLDER = "ENCRYPTED";
export type ENCRYPTED_DATA_PLACEHOLDER_TYPE = "ENCRYPTED";
export declare const INITIAL_ERROR_DELAY = 500;
export declare const FATAL_CHUNK_UPLOAD_ERRORS: string[];
export declare const gqlTagNameRecord: {
    readonly arFS: "ArFS";
    readonly tipType: "Tip-Type";
    readonly contentType: "Content-Type";
    readonly boost: "Boost";
    readonly bundleFormat: "Bundle-Format";
    readonly bundleVersion: "Bundle-Version";
    readonly entityType: "Entity-Type";
    readonly unitTime: "Unix-Time";
    readonly driveId: "Drive-Id";
    readonly folderId: "Folder-Id";
    readonly fileId: "File-Id";
    readonly parentFolderId: "Parent-Folder-Id";
    readonly drivePrivacy: "Drive-Privacy";
    readonly cipher: "Cipher";
    readonly cipherIv: "Cipher-IV";
    readonly driveAuthMode: "Drive-Auth-Mode";
};
export declare const stubTransactionID: ArweaveAddress;
export declare const fakeEntityId: import("./types/arfs").EntityID;
