import { ArweaveAddress, EntityMetaDataTransactionData } from "./arweave";
export type GQLQuery = {
    query: string;
};
export interface BuildGQLQueryParams {
    tags: GQLQueryTagInterface[];
    cursor?: string;
    owner?: ArweaveAddress;
    sort?: Sort;
    ids?: ArweaveAddress[];
}
export interface GQLPageInfoInterface {
    hasNextPage: boolean;
}
export interface GQLOwnerInterface {
    address: string;
    key: string;
}
export interface GQLAmountInterface {
    winston: string;
    ar: string;
}
export interface GQLMetaDataInterface {
    size: number;
    type: string;
}
export interface GQLTagInterface {
    name: string;
    value: string;
}
export interface GQLQueryTagInterface {
    name: string;
    value: string | string[];
}
export interface GQLBlockInterface {
    id: string;
    timestamp: number;
    height: number;
    previous: string;
}
export interface GQLNodeInterface {
    id: string;
    anchor: string;
    signature: string;
    recipient: string;
    owner: GQLOwnerInterface;
    fee: GQLAmountInterface;
    quantity: GQLAmountInterface;
    data: GQLMetaDataInterface;
    tags: GQLTagInterface[];
    block: GQLBlockInterface;
    parent: {
        id: string;
    };
}
export interface GQLEdgeInterface {
    cursor: string;
    node: GQLNodeInterface;
}
export interface GQLTransactionsResultInterface {
    pageInfo: GQLPageInfoInterface;
    edges: GQLEdgeInterface[];
}
export default interface GQLResultInterface {
    data: {
        transactions: GQLTransactionsResultInterface;
    };
}
export type CustomMetaDataGqlTags = Record<string, string | string[]>;
export type CustomMetaDataJsonFields = EntityMetaDataTransactionData;
export type CustomMetaDataTagInterface = CustomMetaDataGqlTags;
export declare const ASCENDING_ORDER = "HEIGHT_ASC";
export declare const DESCENDING_ORDER = "HEIGHT_DESC";
export declare const ownerFragment = "\n\towner {\n\t\taddress\n\t}\n";
export declare const nodeFragment: string;
export declare const edgesFragment: (singleResult: boolean) => string;
export declare const pageInfoFragment = "\n\tpageInfo {\n\t\thasNextPage\n\t}\n";
export declare const latestResult = 1;
export declare const pageLimit = 100;
export type Sort = typeof ASCENDING_ORDER | typeof DESCENDING_ORDER;
export declare const gqlTagNameArray: ("ArFS" | "File-Id" | "Folder-Id" | "Drive-Id" | "Entity-Type" | "Parent-Folder-Id" | "Content-Type" | "Cipher" | "Cipher-IV" | "Tip-Type" | "Boost" | "Bundle-Format" | "Bundle-Version" | "Unix-Time" | "Drive-Privacy" | "Drive-Auth-Mode")[];
export type GqlTagName = (typeof gqlTagNameArray)[number];
