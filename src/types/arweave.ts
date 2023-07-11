import { deriveDriveKey, driveDecrypt } from "src/utils/crypto";
import { EntityID, EntityKey } from "./arfs";
import { Equatable } from "./common";
import {
  Utf8ArrayToStr,
  b64UrlToBuffer,
  bufferTob64Url,
} from "src/utils/common";
import { JWKInterface } from "arweave/node/lib/wallet";
import * as crypto from "crypto";
import jwkToPem, { JWK } from "jwk-to-pem";
import { BigNumber } from "bignumber.js";

export class ArweaveAddress implements Equatable<ArweaveAddress> {
  constructor(private readonly address: string) {
    if (!new RegExp("^[a-zA-Z0-9_-]{43}$").test(address)) {
      throw new Error(
        "Arweave addresses must be 43 characters in length with characters in the following set: [a-zA-Z0-9_-]",
      );
    }
  }

  [Symbol.toPrimitive](hint?: string): string {
    if (hint === "number") {
      throw new Error("Arweave addresses cannot be interpreted as a number!");
    }

    return this.toString();
  }

  equals(other: ArweaveAddress): boolean {
    return this.address === other.address;
  }

  toString(): string {
    return this.address;
  }

  valueOf(): string {
    return this.address;
  }

  toJSON(): string {
    return this.toString();
  }
}

export function ADDR(arAddress: string): ArweaveAddress {
  return new ArweaveAddress(arAddress);
}

export type JsonSerializable =
  | string
  | number
  | boolean
  | null
  | { [member: string]: JsonSerializable }
  | JsonSerializable[];

/** Data JSON of a MetaData Transaction */
export type EntityMetaDataTransactionData = Record<string, JsonSerializable>;

type DriveIdKeyPair = { [key: string /* DriveID */]: EntityKey };

// Users may optionally supply any drive keys, a password, or a wallet
interface PrivateKeyDataParams {
  readonly driveKeys?: EntityKey[];
  readonly password?: string;
  readonly wallet?: JWKWallet;
}

/**
 * A utility class that uses optional private key data to safely decrypt metadata
 * transaction data (the data JSON). Upon a successful decryption, the class
 * will cache the verified driveId and driveKey as a pair for future use.
 */
export class PrivateKeyData {
  private readonly password?: string;
  private readonly wallet?: JWKWallet;

  // Drive IDs are paired with their Drive Keys upon successful decryption
  // TODO: Migrate this to ArFS Cache so it can persist between commands
  private readonly driveKeyCache: DriveIdKeyPair = {};

  // Drive keys provided by the user are initially unverified
  // until we successfully decrypt a drive with them
  private unverifiedDriveKeys: EntityKey[];

  constructor({ password, driveKeys, wallet }: PrivateKeyDataParams) {
    if (password && !wallet) {
      throw new Error(
        "Password supplied without a wallet. Did you forget to include your wallet?",
      );
    }

    if (password && driveKeys) {
      throw new Error(
        "Password and drive keys can't be used together. Please provide one or the other.",
      );
    }

    this.unverifiedDriveKeys = driveKeys ?? [];
    this.password = password;
    this.wallet = wallet;
  }

  /** Safely decrypts a private data buffer into a decrypted transaction data */
  public async safelyDecryptToJson<T extends EntityMetaDataTransactionData>(
    cipherIV: string,
    driveId: EntityID,
    dataBuffer: Uint8Array,
    placeholder: T,
  ): Promise<T> {
    // Check for a cached key that is matching provided driveId first
    const cachedDriveKey = this.driveKeyForDriveId(driveId);
    if (cachedDriveKey) {
      return this.decryptToJson<T>(cipherIV, dataBuffer, cachedDriveKey);
    }

    // Next, try any unverified drive keys provided by the user
    for (const driveKey of this.unverifiedDriveKeys) {
      try {
        const decryptedDriveJSON = await this.decryptToJson<T>(
          cipherIV,
          dataBuffer,
          driveKey,
        );

        // Correct key, add this pair to the cache
        this.driveKeyCache[`${driveId}`] = driveKey;
        this.unverifiedDriveKeys = this.unverifiedDriveKeys.filter(
          (k) => k !== driveKey,
        );

        return decryptedDriveJSON;
      } catch {
        // Wrong key, continue
      }
    }

    // Finally, if we have a password and a wallet, we can derive a drive key and try it
    if (this.password && this.wallet) {
      const derivedDriveKey: EntityKey = await deriveDriveKey(
        this.password,
        `${driveId}`,
        JSON.stringify(this.wallet.getPrivateKey()),
      );
      try {
        const decryptedDriveJSON = await this.decryptToJson<T>(
          cipherIV,
          dataBuffer,
          derivedDriveKey,
        );

        // Correct key, add this pair to the cache
        this.driveKeyCache[`${driveId}`] = derivedDriveKey;

        return decryptedDriveJSON;
      } catch (error) {
        // Wrong key, continue
      }
    }

    // Decryption is not possible, return placeholder data
    return placeholder;
  }

  /**
   * Decrypts a private data buffer into a decrypted transaction data
   *
   * @throws when the provided driveKey or cipher fails to decrypt the transaction data
   */
  public async decryptToJson<T extends EntityMetaDataTransactionData>(
    cipherIV: string,
    encryptedDataBuffer: Uint8Array,
    driveKey: EntityKey,
  ): Promise<T> {
    const decryptedDriveBuffer: Uint8Array = await driveDecrypt(
      cipherIV,
      driveKey,
      encryptedDataBuffer,
    );
    const decryptedDriveString = await Utf8ArrayToStr(decryptedDriveBuffer);
    return decryptedDriveString as unknown as T;
  }

  /** Synchronously returns a driveKey from the cache by its driveId */
  public driveKeyForDriveId(driveId: EntityID): EntityKey | false {
    return this.driveKeyCache[`${driveId}`] ?? false;
  }
}

export interface Wallet {
  getPublicKey(): Promise<string>;
  getAddress(): Promise<ArweaveAddress>;
  sign(data: Uint8Array): Promise<Uint8Array>;
}

export class JWKWallet implements Wallet {
  constructor(private readonly jwk: JWKInterface) {}

  getPublicKey(): Promise<string> {
    return Promise.resolve(this.jwk.n);
  }

  getPrivateKey(): JWKInterface {
    return this.jwk;
  }

  async getAddress(): Promise<ArweaveAddress> {
    const result = crypto
      .createHash("sha256")
      .update(b64UrlToBuffer(await this.getPublicKey()))
      .digest();
    return Promise.resolve(ADDR(bufferTob64Url(result)));
  }

  // Use cases: generating drive keys, file keys, etc.
  sign(data: Uint8Array): Promise<Uint8Array> {
    const sign = crypto.createSign("sha256");
    sign.update(data);
    const pem: string = jwkToPem(this.jwk as JWK, { private: true });
    const signature = sign.sign({
      key: pem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 0, // We do not need to salt the signature since we combine with a random UUID
    });
    return Promise.resolve(signature);
  }
}

export class Winston {
  private amount: BigNumber;
  constructor(amount: BigNumber.Value) {
    this.amount = new BigNumber(amount);
    if (this.amount.isLessThan(0) || !this.amount.isInteger()) {
      throw new Error("Winston value should be a non-negative integer!");
    }
  }

  plus(winston: Winston): Winston {
    return W(this.amount.plus(winston.amount));
  }

  minus(winston: Winston): Winston {
    return W(this.amount.minus(winston.amount));
  }

  times(multiplier: BigNumber.Value): Winston {
    return W(
      this.amount.times(multiplier).decimalPlaces(0, BigNumber.ROUND_DOWN),
    );
  }

  dividedBy(
    divisor: BigNumber.Value,
    round: "ROUND_DOWN" | "ROUND_CEIL" = "ROUND_CEIL",
  ): Winston {
    // TODO: Best rounding strategy? Up or down?
    return W(
      this.amount
        .dividedBy(divisor)
        .decimalPlaces(
          0,
          round === "ROUND_DOWN" ? BigNumber.ROUND_DOWN : BigNumber.ROUND_CEIL,
        ),
    );
  }

  isGreaterThan(winston: Winston): boolean {
    return this.amount.isGreaterThan(winston.amount);
  }

  isGreaterThanOrEqualTo(winston: Winston): boolean {
    return this.amount.isGreaterThanOrEqualTo(winston.amount);
  }

  static difference(a: Winston, b: Winston): string {
    return a.amount.minus(b.amount).toString();
  }

  toString(): string {
    return this.amount.toFixed();
  }

  valueOf(): string {
    return this.amount.toFixed();
  }

  toJSON(): string {
    return this.toString();
  }

  static max(...winstons: Winston[]): Winston {
    BigNumber.max();
    return winstons.reduce((max, next) =>
      next.amount.isGreaterThan(max.amount) ? next : max,
    );
  }
}

export function W(amount: BigNumber.Value): Winston {
  return new Winston(amount);
}
