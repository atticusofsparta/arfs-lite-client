/// <reference types="node" />
/// <reference types="node" />
import * as crypto from "crypto";
import { ArFSEncryptedData } from "../types/arfs";
import { JWK } from "jwk-to-pem";
import { EntityKey } from "../types/arfs";
export declare function getArweaveWalletSigningKey(jwk: JWK, data: Uint8Array): Promise<Uint8Array>;
export declare function deriveDriveKey(dataEncryptionKey: crypto.BinaryLike, driveId: string, walletPrivateKey: string): Promise<EntityKey>;
export declare function deriveFileKey(fileId: string, driveKey: EntityKey): Promise<EntityKey>;
export declare function uint8ArrayToString(uint8Array: Uint8Array): string;
export declare function convertUint8ArrayToString(uint8Array: Uint8Array): string;
export declare function driveEncrypt(driveKey: EntityKey, data: Buffer): Promise<ArFSEncryptedData>;
export declare function fileEncrypt(fileKey: EntityKey, data: Buffer): Promise<ArFSEncryptedData>;
export declare function getFileAndEncrypt(fileKey: EntityKey, filePath: string): Promise<ArFSEncryptedData>;
export declare function driveDecrypt(cipherIV: string, driveKey: EntityKey, data: Uint8Array): Promise<Uint8Array>;
export declare function decodeBase64ToArrayBuffer(base64: string): Uint8Array;
export declare function fileDecrypt(cipherIV: string, fileKey: EntityKey, data: Uint8Array): Promise<Uint8Array>;
export declare function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array;
export declare function checksumFile(file: File): Promise<string>;
export declare function encryptText(text: crypto.BinaryLike, password: string): Promise<{
    iv: string;
    encryptedText: string;
}>;
export declare function decryptText(text: {
    iv: {
        toString: () => string;
    };
    encryptedText: {
        toString: () => string;
    };
}, password: string): Promise<string>;
