import { EntityID, EntityKey } from "./arfs";
import { Equatable } from "./common";
import { JWKInterface } from "arweave/node/lib/wallet";
import { BigNumber } from "bignumber.js";
export declare class ArweaveAddress implements Equatable<ArweaveAddress> {
    private readonly address;
    constructor(address: string);
    [Symbol.toPrimitive](hint?: string): string;
    equals(other: ArweaveAddress): boolean;
    toString(): string;
    valueOf(): string;
    toJSON(): string;
}
export declare function ADDR(arAddress: string): ArweaveAddress;
export type JsonSerializable = string | number | boolean | null | {
    [member: string]: JsonSerializable;
} | JsonSerializable[];
/** Data JSON of a MetaData Transaction */
export type EntityMetaDataTransactionData = Record<string, JsonSerializable>;
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
export declare class PrivateKeyData {
    private readonly password?;
    private readonly wallet?;
    private readonly driveKeyCache;
    private unverifiedDriveKeys;
    constructor({ password, driveKeys, wallet }: PrivateKeyDataParams);
    /** Safely decrypts a private data buffer into a decrypted transaction data */
    safelyDecryptToJson<T extends EntityMetaDataTransactionData>(cipherIV: string, driveId: EntityID, dataBuffer: Uint8Array, placeholder: T): Promise<T>;
    /**
     * Decrypts a private data buffer into a decrypted transaction data
     *
     * @throws when the provided driveKey or cipher fails to decrypt the transaction data
     */
    decryptToJson<T extends EntityMetaDataTransactionData>(cipherIV: string, encryptedDataBuffer: Uint8Array, driveKey: EntityKey): Promise<T>;
    /** Synchronously returns a driveKey from the cache by its driveId */
    driveKeyForDriveId(driveId: EntityID): EntityKey | false;
}
export interface Wallet {
    getPublicKey(): Promise<string>;
    getAddress(): Promise<ArweaveAddress>;
    sign(data: Uint8Array): Promise<Uint8Array>;
}
export declare class JWKWallet implements Wallet {
    private readonly jwk;
    constructor(jwk: JWKInterface);
    getPublicKey(): Promise<string>;
    getPrivateKey(): JWKInterface;
    getAddress(): Promise<ArweaveAddress>;
    sign(data: Uint8Array): Promise<Uint8Array>;
}
export declare class Winston {
    private amount;
    constructor(amount: BigNumber.Value);
    plus(winston: Winston): Winston;
    minus(winston: Winston): Winston;
    times(multiplier: BigNumber.Value): Winston;
    dividedBy(divisor: BigNumber.Value, round?: "ROUND_DOWN" | "ROUND_CEIL"): Winston;
    isGreaterThan(winston: Winston): boolean;
    isGreaterThanOrEqualTo(winston: Winston): boolean;
    static difference(a: Winston, b: Winston): string;
    toString(): string;
    valueOf(): string;
    toJSON(): string;
    static max(...winstons: Winston[]): Winston;
}
export declare function W(amount: BigNumber.Value): Winston;
export {};
