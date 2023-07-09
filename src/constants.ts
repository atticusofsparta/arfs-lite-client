import { EID } from "./types/arfs";
import { ArweaveAddress } from "./types/arweave";

export const JSON_CONTENT_TYPE = "application/json";
export const PRIVATE_CONTENT_TYPE = "application/octet-stream";
export const MANIFEST_CONTENT_TYPE = "application/x.arweave-manifest+json";

export const publicJsonContentTypeTag = {
  name: "Content-Type",
  value: JSON_CONTENT_TYPE,
};
export const privateOctetContentTypeTag = {
  name: "Content-Type",
  value: PRIVATE_CONTENT_TYPE,
};
export const defaultCipher: string = "AES256-GCM";

export const privateCipherTag = { name: "Cipher", value: defaultCipher };
export const fakePrivateCipherIVTag = {
  name: "Cipher-IV",
  value: "qwertyuiopasdfgh",
}; // Cipher-IV is always 16 characters

export const defaultGatewayHost = "arweave.net";
export const defaultGatewayProtocol = "https";
export const defaultGatewayPort = 443;
export const defaultArweaveGatewayPath = `${defaultGatewayProtocol}://${defaultGatewayHost}/`;
export const gatewayGqlEndpoint = "graphql";

export const authTagLength = 16;
export const defaultMaxConcurrentChunks = 32;

export const ROOT_FOLDER_ID_PLACEHOLDER = "root folder";

export const ENCRYPTED_DATA_PLACEHOLDER = "ENCRYPTED";
export type ENCRYPTED_DATA_PLACEHOLDER_TYPE = "ENCRYPTED";

export const INITIAL_ERROR_DELAY = 500; // 500ms
export const FATAL_CHUNK_UPLOAD_ERRORS = [
  "invalid_json",
  "chunk_too_big",
  "data_path_too_big",
  "offset_too_big",
  "data_size_too_big",
  "chunk_proof_ratio_not_attractive",
  "invalid_proof",
];
export const gqlTagNameRecord = {
  arFS: "ArFS",
  tipType: "Tip-Type",
  contentType: "Content-Type",
  boost: "Boost",
  bundleFormat: "Bundle-Format",
  bundleVersion: "Bundle-Version",
  entityType: "Entity-Type",
  unitTime: "Unix-Time",
  driveId: "Drive-Id",
  folderId: "Folder-Id",
  fileId: "File-Id",
  parentFolderId: "Parent-Folder-Id",
  drivePrivacy: "Drive-Privacy",
  cipher: "Cipher",
  cipherIv: "Cipher-IV",
  driveAuthMode: "Drive-Auth-Mode",
} as const;

export const stubTransactionID = new ArweaveAddress(
  "0000000000000000000000000000000000000000000",
);
export const fakeEntityId = EID("00000000-0000-0000-0000-000000000000");
