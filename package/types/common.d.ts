export type UnionOfObjectPropertiesType<T extends {
    [key: string]: string | number;
}> = T[keyof T];
import { AxiosInstance, AxiosResponse } from "axios";
import Transaction from "arweave/web/lib/transaction";
import { GQLQuery, GQLTransactionsResultInterface } from "./gql";
import { ArweaveAddress } from "./arweave";
export interface Equatable<T> {
    equals(other: T): boolean;
}
export interface Chunk {
    chunk: string;
    data_root: string;
    data_size: string;
    offset: string;
    data_path: string;
}
export type ProgressCallback = (pctComplete: number) => void;
export interface MultiChunkTxUploaderConstructorParams {
    gatewayApi: GatewayAPI;
    transaction: Transaction;
    maxConcurrentChunks?: number;
    progressCallback?: ProgressCallback;
}
interface GatewayAPIConstParams {
    gatewayUrl: URL;
    maxRetriesPerRequest?: number;
    initialErrorDelayMS?: number;
    fatalErrors?: string[];
    validStatusCodes?: number[];
    axiosInstance?: AxiosInstance;
}
export declare class GatewayAPI {
    private gatewayUrl;
    private maxRetriesPerRequest;
    private initialErrorDelayMS;
    private fatalErrors;
    private validStatusCodes;
    private axiosInstance;
    constructor({ gatewayUrl, maxRetriesPerRequest, initialErrorDelayMS, fatalErrors, validStatusCodes, axiosInstance, }: GatewayAPIConstParams);
    private lastError;
    private lastRespStatus;
    postChunk(chunk: Chunk): Promise<void>;
    postTxHeader(transaction: Transaction): Promise<void>;
    gqlRequest(query: GQLQuery): Promise<GQLTransactionsResultInterface>;
    postToEndpoint<T = unknown>(endpoint: string, data?: unknown): Promise<AxiosResponse<T>>;
    getTransaction(txId: ArweaveAddress): Promise<Transaction>;
    /**
     * For fetching the Data JSON of a MetaData Tx
     *
     * @remarks Will use data from `ArFSMetadataCache` if it exists and will cache any fetched data
     * */
    getTxData(txId: ArweaveAddress): Promise<Uint8Array>;
    /**
     * Retries the given request until the response returns a successful
     * status code or the maxRetries setting has been exceeded
     *
     * @throws when a fatal error has been returned by request
     * @throws when max retries have been exhausted
     */
    private retryRequestUntilMaxRetries;
    private tryRequest;
    private isRequestSuccessful;
    private throwIfFatalError;
    private exponentialBackOffAfterFailedRequest;
    private rateLimitThrottle;
}
export declare class ByteCount implements Equatable<ByteCount> {
    private readonly byteCount;
    constructor(byteCount: number);
    [Symbol.toPrimitive](hint?: string): number | string;
    plus(byteCount: ByteCount): ByteCount;
    minus(byteCount: ByteCount): ByteCount;
    isGreaterThan(byteCount: ByteCount): boolean;
    isGreaterThanOrEqualTo(byteCount: ByteCount): boolean;
    toString(): string;
    valueOf(): number;
    toJSON(): number;
    equals(other: ByteCount): boolean;
}
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
export type MakeOptional<T, K> = Omit<T, K> & Partial<T>;
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
export {};
