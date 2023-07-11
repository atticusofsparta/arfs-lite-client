import * as crypto from "crypto";
import { parse } from "uuid";
import { ArFSEncryptedData } from "../types/arfs";

import hkdf from "futoin-hkdf";
import utf8 from "utf8";
import jwkToPem, { JWK } from "jwk-to-pem";
import { authTagLength } from "../constants";
import { EntityKey } from "../types/arfs";
import { encodeStringToArrayBuffer } from "./common";

const keyByteLength = 32;
const algo = "aes-256-gcm"; // crypto library does not accept this in uppercase. So gotta keep using aes-256-gcm
const keyHash = "SHA-256";

// Gets an unsalted SHA256 signature from an Arweave wallet's private PEM file
export async function getArweaveWalletSigningKey(
  jwk: JWK,
  data: Uint8Array,
): Promise<Uint8Array> {
  const sign = crypto.createSign("sha256");
  sign.update(data);
  const pem: string = jwkToPem(jwk, { private: true });
  const signature = sign.sign({
    key: pem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 0, // We do not need to salt the signature since we combine with a random UUID
  });
  return signature;
}

// Derive a key from the user's ArDrive ID, JWK and Data Encryption Password (also their login password)
export async function deriveDriveKey(
  dataEncryptionKey: crypto.BinaryLike,
  driveId: string,
  walletPrivateKey: string,
): Promise<EntityKey> {
  const driveIdBytes: Uint8Array = new Uint8Array(parse(driveId)); // The UUID of the driveId is the SALT used for the drive key
  const driveBuffer: Uint8Array = new Uint8Array(
    encodeStringToArrayBuffer(utf8.encode("drive")),
  );
  const signingKey: Uint8Array = concatenateUint8Arrays(
    driveBuffer,
    driveIdBytes,
  );
  const walletSignature: Uint8Array = await getArweaveWalletSigningKey(
    JSON.parse(walletPrivateKey),
    signingKey,
  );
  const info: string = uint8ArrayToString(
    new Uint8Array(
      encodeStringToArrayBuffer(utf8.encode(dataEncryptionKey as string)),
    ),
  );
  const driveKey: Uint8Array = await hkdf(
    uint8ArrayToString(walletSignature),
    keyByteLength,
    {
      info,
      hash: keyHash,
    },
  );
  return new EntityKey(driveKey);
}

function concatenateUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce(
    (length, array) => length + array.length,
    0,
  );
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

// Derive a key from the user's Drive Key and the File Id
export async function deriveFileKey(
  fileId: string,
  driveKey: EntityKey,
): Promise<EntityKey> {
  const info = uint8ArrayToString(parse(fileId) as Uint8Array);
  const keyDataString = uint8ArrayToString(driveKey.keyData);
  const fileKey = await hkdf(keyDataString, keyByteLength, {
    info,
    hash: keyHash,
  });
  return new EntityKey(new Uint8Array(fileKey));
}

export function uint8ArrayToString(uint8Array: Uint8Array): string {
  let binary = "";
  const length = uint8Array.length;
  for (let i = 0; i < length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return binary;
}

export function convertUint8ArrayToString(uint8Array: Uint8Array) {
  const byteArray = Array.from(uint8Array);
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(new Uint8Array(byteArray));
  return jsonString;
}

// New ArFS Drive decryption function, using ArDrive KDF and AES-256-GCM
export async function driveEncrypt(
  driveKey: EntityKey,
  data: Buffer,
): Promise<ArFSEncryptedData> {
  const iv: Buffer = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algo, driveKey.keyData, iv, {
    authTagLength,
  });
  const encryptedDriveBuffer: Buffer = Buffer.concat([
    cipher.update(data),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const encryptedDrive: ArFSEncryptedData = {
    cipher: "AES256-GCM",
    cipherIV: iv.toString("base64"),
    data: encryptedDriveBuffer,
  };
  return encryptedDrive;
}

// New ArFS File encryption function using a buffer and using ArDrive KDF with AES-256-GCM
export async function fileEncrypt(
  fileKey: EntityKey,
  data: Buffer,
): Promise<ArFSEncryptedData> {
  const iv: Buffer = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algo, fileKey.keyData, iv, {
    authTagLength,
  });
  const encryptedBuffer: Buffer = Buffer.concat([
    cipher.update(data),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const encryptedFile: ArFSEncryptedData = {
    cipher: "AES256-GCM",
    cipherIV: iv.toString("base64"),
    data: encryptedBuffer,
  };
  return encryptedFile;
}

// New ArFS File encryption function using a file path to get a file buffer and encrypt and using ArDrive KDF with AES-256-GCM

export async function getFileAndEncrypt(
  fileKey: EntityKey,
  filePath: string,
): Promise<ArFSEncryptedData> {
  const response = await fetch(filePath);
  const data = await response.arrayBuffer();
  const buffer = new Uint8Array(data);

  const iv: Uint8Array = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algo, fileKey.keyData, iv, {
    authTagLength,
  });
  const encryptedBuffer: Buffer = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const encryptedFile: ArFSEncryptedData = {
    cipher: "AES256-GCM",
    cipherIV: uint8ArrayToString(iv),
    data: encryptedBuffer,
  };
  return encryptedFile;
}

// New ArFS Drive decryption function, using ArDrive KDF and AES-256-GCM
export async function driveDecrypt(
  cipherIV: string,
  driveKey: EntityKey,
  data: Uint8Array,
): Promise<Uint8Array> {
  try {
    const authTagLength = 16; // Assuming authTagLength is known
    const authTag = data.slice(data.length - authTagLength);
    const encryptedDataSlice = data.slice(0, data.length - authTagLength);
    const iv = decodeBase64ToArrayBuffer(cipherIV);
    const keyData = decodeBase64ToArrayBuffer(
      uint8ArrayToString(driveKey.keyData),
    );
    const decipher = crypto.createDecipheriv(algo, keyData, iv, {
      authTagLength,
    });
    decipher.setAuthTag(authTag);

    const blockSize = 16;
    const decryptedChunks = [];
    let chunk = decipher.update(encryptedDataSlice);
    while (chunk.length > 0) {
      decryptedChunks.push(chunk);
      chunk = decipher.update(new Uint8Array(blockSize));
    }
    const finalChunk = decipher.final();
    if (finalChunk.length > 0) {
      decryptedChunks.push(finalChunk);
    }
    const decryptedFile = concatUint8Arrays(decryptedChunks);

    return decryptedFile;
  } catch (err) {
    console.error("Error decrypting file data");
    return new Uint8Array([69, 114, 114, 111, 114]); // Return Uint8Array for "Error"
  }
}

export function decodeBase64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const length = binary.length;
  const buffer = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

// New ArFS File decryption function, using ArDrive KDF and AES-256-GCM
export async function fileDecrypt(
  cipherIV: string,
  fileKey: EntityKey,
  data: Uint8Array,
): Promise<Uint8Array> {
  try {
    const authTagLength = 16; // Assuming authTagLength is known
    const authTag = data.slice(data.length - authTagLength);
    const encryptedDataSlice = data.slice(0, data.length - authTagLength);
    const iv = decodeBase64ToArrayBuffer(cipherIV);
    const keyData = decodeBase64ToArrayBuffer(
      uint8ArrayToString(fileKey.keyData),
    );
    const decipher = crypto.createDecipheriv(algo, keyData, iv, {
      authTagLength,
    });
    decipher.setAuthTag(authTag);

    const blockSize = 16;
    const decryptedChunks = [];
    let chunk = decipher.update(encryptedDataSlice);
    while (chunk.length > 0) {
      decryptedChunks.push(chunk);
      chunk = decipher.update(new Uint8Array(blockSize));
    }
    const finalChunk = decipher.final();
    if (finalChunk.length > 0) {
      decryptedChunks.push(finalChunk);
    }
    const decryptedFile = concatUint8Arrays(decryptedChunks);

    return decryptedFile;
  } catch (err) {
    console.error("Error decrypting file data");
    return new Uint8Array([69, 114, 114, 111, 114]); // Return Uint8Array for "Error"
  }
}

export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// gets hash of a file using SHA512
export async function checksumFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      const buffer = new Uint8Array(reader.result as ArrayBuffer);
      const hash = crypto.createHash("sha512");
      hash.update(buffer);
      resolve(hash.digest("hex"));
    };
    reader.onerror = function () {
      reject(new Error("Error reading file"));
    };
    reader.readAsArrayBuffer(file);
  });
}

// Used to encrypt data going into sqlitedb, like arweave private key
export async function encryptText(
  text: crypto.BinaryLike,
  password: string,
): Promise<{ iv: string; encryptedText: string }> {
  try {
    const initVect = crypto.randomBytes(16);
    const CIPHER_KEY = getTextCipherKey(password);
    const cipher = crypto.createCipheriv("aes-256-cbc", CIPHER_KEY, initVect);
    let encryptedText = cipher.update(text.toString());
    encryptedText = Buffer.concat([encryptedText, cipher.final()]);
    return {
      iv: initVect.toString("hex"),
      encryptedText: encryptedText.toString("hex"),
    };
  } catch (err) {
    console.error(err);
    return {
      iv: "Error",
      encryptedText: "Error",
    };
  }
}

// Used to decrypt data going into sqlitedb, like arweave private key
export async function decryptText(
  text: {
    iv: { toString: () => string };
    encryptedText: { toString: () => string };
  },
  password: string,
): Promise<string> {
  try {
    const iv = hexStringToUint8Array(text.iv.toString());
    const encryptedText = hexStringToUint8Array(text.encryptedText.toString());
    const cipherKey = getTextCipherKey(password);
    const decipher = crypto.createDecipheriv("aes-256-cbc", cipherKey, iv);
    const decrypted = concatenateUint8Arrays(
      decipher.update(encryptedText),
      decipher.final(),
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    console.error(err)
    return "ERROR";
  }
}

function hexStringToUint8Array(hexString: string): Uint8Array {
  const length = hexString.length / 2;
  const uint8Array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    const startIndex = i * 2;
    const endIndex = startIndex + 2;
    const byteString = hexString.slice(startIndex, endIndex);
    const byte = parseInt(byteString, 16);
    uint8Array[i] = byte;
  }
  return uint8Array;
}

// Used to encrypt data stored in SQLite DB
function getTextCipherKey(password: crypto.BinaryLike): Buffer {
  const hash = crypto.createHash("sha256");
  hash.update(password);
  const KEY = hash.digest();
  return KEY;
}
