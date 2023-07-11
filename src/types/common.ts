export type UnionOfObjectPropertiesType<
  T extends { [key: string]: string | number },
> = T[keyof T];

import axios, { AxiosInstance, AxiosResponse } from "axios";
import { FATAL_CHUNK_UPLOAD_ERRORS, INITIAL_ERROR_DELAY } from "src/constants";
import Transaction from "arweave/web/lib/transaction";
import GQLResultInterface, {
  GQLQuery,
  GQLTransactionsResultInterface,
} from "./gql";
import { ArweaveAddress } from "./arweave";
import { ArFSMetadataIDBCache } from "./arfs/cache";

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
const MAX_CHUNKS_IN_BODY = 1;

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

const rateLimitStatus = 429;
const rateLimitTimeout = 60_000; // 60 seconds

// With the current default error delay and max retries, we expect the following wait times after each request sent:

// 1st request attempt
// Retry wait 1: 500ms
// 2nd request attempt
// Retry wait 2: 1,000ms
// 3rd request attempt
// Retry wait 3: 2,000ms
// 4th request attempt
// Retry wait 4: 4,000ms
// 5th request attempt
// Retry wait 5: 8,000ms
// 6th request attempt
// Retry wait 6: 16,000ms
// 7th request attempt
// Retry wait 7: 32,000ms
// 8th request attempt
// Retry wait 8: 64,000ms
// 9th request attempt
// Throw error if 9th request failure

// Total wait time:
// 127,500ms / 2 minutes and 7.5 seconds

export class GatewayAPI {
  private gatewayUrl: URL;
  private maxRetriesPerRequest: number;
  private initialErrorDelayMS: number;
  private fatalErrors: string[];
  private validStatusCodes: number[];
  private axiosInstance: AxiosInstance;

  constructor({
    gatewayUrl,
    maxRetriesPerRequest = 8,
    initialErrorDelayMS = INITIAL_ERROR_DELAY,
    fatalErrors = FATAL_CHUNK_UPLOAD_ERRORS,
    validStatusCodes = [200],
    axiosInstance = axios.create({ validateStatus: undefined }),
  }: GatewayAPIConstParams) {
    this.gatewayUrl = gatewayUrl;
    this.maxRetriesPerRequest = maxRetriesPerRequest;
    this.initialErrorDelayMS = initialErrorDelayMS;
    this.fatalErrors = fatalErrors;
    this.validStatusCodes = validStatusCodes;
    this.axiosInstance = axiosInstance;
  }

  private lastError = "unknown error";
  private lastRespStatus = 0;

  public async postChunk(chunk: Chunk): Promise<void> {
    await this.postToEndpoint("chunk", chunk);
  }

  public async postTxHeader(transaction: Transaction): Promise<void> {
    await this.postToEndpoint("tx", transaction);
  }

  public async gqlRequest(
    query: GQLQuery,
  ): Promise<GQLTransactionsResultInterface> {
    try {
      const { data } = await this.postToEndpoint<GQLResultInterface>(
        "graphql",
        query,
      );

      return data.data.transactions;
    } catch (error: any) {
      throw Error(`GQL Error: ${error.message}`);
    }
  }

  public async postToEndpoint<T = unknown>(
    endpoint: string,
    data?: unknown,
  ): Promise<AxiosResponse<T>> {
    return this.retryRequestUntilMaxRetries(() =>
      this.axiosInstance.post(`${this.gatewayUrl.href}${endpoint}`, data),
    );
  }

  public async getTransaction(txId: ArweaveAddress): Promise<Transaction> {
    try {
      return (
        await this.retryRequestUntilMaxRetries<Transaction>(() =>
          this.axiosInstance.get(`${this.gatewayUrl.href}tx/${txId}`),
        )
      ).data;
    } catch (err) {
      throw Error(
        `Transaction could not be found from the gateway: (Status: ${this.lastRespStatus}) ${this.lastError}`,
      );
    }
  }

  /**
   * For fetching the Data JSON of a MetaData Tx
   *
   * @remarks Will use data from `ArFSMetadataCache` if it exists and will cache any fetched data
   * */
  public async getTxData(txId: ArweaveAddress): Promise<Uint8Array> {
    const cachedData = await ArFSMetadataIDBCache.get(txId);
    if (cachedData) {
      return cachedData;
    }
    const { data: txData } = await this.retryRequestUntilMaxRetries<Uint8Array>(
      () =>
        this.axiosInstance.get(`${this.gatewayUrl.href}${txId}`, {
          responseType: "arraybuffer",
        }),
    );

    await ArFSMetadataIDBCache.put(txId, txData);
    return txData;
  }

  /**
   * Retries the given request until the response returns a successful
   * status code or the maxRetries setting has been exceeded
   *
   * @throws when a fatal error has been returned by request
   * @throws when max retries have been exhausted
   */
  private async retryRequestUntilMaxRetries<T = unknown>(
    request: () => Promise<AxiosResponse<T>>,
  ): Promise<AxiosResponse<T>> {
    let retryNumber = 0;

    while (retryNumber <= this.maxRetriesPerRequest) {
      const response = await this.tryRequest<T>(request);

      if (response) {
        if (retryNumber > 0) {
          console.error(`Request has been successfully retried!`);
        }
        return response;
      }
      this.throwIfFatalError();

      if (this.lastRespStatus === rateLimitStatus) {
        // When rate limited by the gateway, we will wait without incrementing retry count
        await this.rateLimitThrottle();
        continue;
      }

      console.error(
        `Request to gateway has failed: (Status: ${this.lastRespStatus}) ${this.lastError}`,
      );

      const nextRetry = retryNumber + 1;

      if (nextRetry <= this.maxRetriesPerRequest) {
        await this.exponentialBackOffAfterFailedRequest(retryNumber);

        console.error(`Retrying request, retry attempt ${nextRetry}...`);
      }

      retryNumber = nextRetry;
    }

    // Didn't succeed within number of allocated retries
    throw new Error(
      `Request to gateway has failed: (Status: ${this.lastRespStatus}) ${this.lastError}`,
    );
  }

  private async tryRequest<T = unknown>(
    request: () => Promise<AxiosResponse<T>>,
  ): Promise<AxiosResponse<T> | undefined> {
    try {
      const resp = await request();
      this.lastRespStatus = resp.status;

      if (this.isRequestSuccessful()) {
        return resp;
      }

      this.lastError = resp.statusText ?? resp;
    } catch (err: any) {
      this.lastError = err instanceof Error ? err.message : err;
    }

    return undefined;
  }

  private isRequestSuccessful(): boolean {
    return this.validStatusCodes.includes(this.lastRespStatus);
  }

  private throwIfFatalError() {
    if (this.fatalErrors.includes(this.lastError)) {
      throw new Error(
        `Fatal error encountered: (Status: ${this.lastRespStatus}) ${this.lastError}`,
      );
    }
  }

  private async exponentialBackOffAfterFailedRequest(
    retryNumber: number,
  ): Promise<void> {
    const delay = Math.pow(2, retryNumber) * this.initialErrorDelayMS;
    console.error(
      `Waiting for ${(delay / 1000).toFixed(1)} seconds before next request...`,
    );
    await new Promise((res) => setTimeout(res, delay));
  }

  private async rateLimitThrottle() {
    console.error(
      `Gateway has returned a ${
        this.lastRespStatus
      } status which means your IP is being rate limited. Pausing for ${(
        rateLimitTimeout / 1000
      ).toFixed(1)} seconds before trying next request...`,
    );
    await new Promise((res) => setTimeout(res, rateLimitTimeout));
  }
}

export class ByteCount implements Equatable<ByteCount> {
  constructor(private readonly byteCount: number) {
    if (
      !Number.isFinite(this.byteCount) ||
      !Number.isInteger(this.byteCount) ||
      this.byteCount < 0
    ) {
      throw new Error("Byte count must be a non-negative integer value!");
    }
  }

  [Symbol.toPrimitive](hint?: string): number | string {
    if (hint === "string") {
      this.toString();
    }

    return this.byteCount;
  }

  plus(byteCount: ByteCount): ByteCount {
    return new ByteCount(this.byteCount + byteCount.byteCount);
  }

  minus(byteCount: ByteCount): ByteCount {
    return new ByteCount(this.byteCount - byteCount.byteCount);
  }

  isGreaterThan(byteCount: ByteCount): boolean {
    return this.byteCount > byteCount.byteCount;
  }

  isGreaterThanOrEqualTo(byteCount: ByteCount): boolean {
    return this.byteCount >= byteCount.byteCount;
  }

  toString(): string {
    return `${this.byteCount}`;
  }

  valueOf(): number {
    return this.byteCount;
  }

  toJSON(): number {
    return this.byteCount;
  }

  equals(other: ByteCount): boolean {
    return this.byteCount === other.byteCount;
  }
}

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
export type MakeOptional<T, K> = Omit<T, K> & Partial<T>;
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
