import {
  JSON_CONTENT_TYPE,
  ROOT_FOLDER_ID_PLACEHOLDER,
  fakeEntityId,
  stubTransactionID,
} from "src/constants";
import { ArweaveAddress } from "../arweave";
import { ByteCount, GatewayAPI } from "../common";
import {
  CustomMetaDataGqlTags,
  CustomMetaDataJsonFields,
  GQLNodeInterface,
  GQLTagInterface,
} from "../gql";
import {
  ArFSBaseEntityToUpload,
  ArFSFileOrFolderBuilder,
  ArFSFileOrFolderEntity,
  ArFSWithPath,
  ContentType,
  CustomMetaData,
  EID,
  EntityID,
  EntityKey,
  FolderConflictResolution,
  UnixTime,
} from "./common";
import { Utf8ArrayToStr } from "src/utils/common";
import {
  ArFSFileToUpload,
  ArFSPrivateFile,
  ArFSPrivateFileWithPaths,
} from "./file";

export class ArFSPublicFolder extends ArFSFileOrFolderEntity<"folder"> {
  constructor(
    appName: string,
    appVersion: string,
    arFS: string,
    contentType: ContentType,
    driveId: EntityID,
    name: string,
    txId: ArweaveAddress,
    unixTime: UnixTime,
    parentFolderId: EntityID,
    readonly folderId: EntityID,
    customMetaDataGqlTags?: CustomMetaDataGqlTags,
    customMetaDataJson?: CustomMetaDataJsonFields,
  ) {
    super(
      appName,
      appVersion,
      arFS,
      contentType,
      driveId,
      "folder",
      name,
      new ByteCount(0),
      txId,
      unixTime,
      new UnixTime(0),
      stubTransactionID,
      JSON_CONTENT_TYPE,
      parentFolderId,
      folderId,
      customMetaDataGqlTags,
      customMetaDataJson,
    );
  }
}

export class ArFSPublicFolderWithPaths
  extends ArFSPublicFolder
  implements ArFSWithPath
{
  readonly path: string;
  readonly txIdPath: string;
  readonly entityIdPath: string;

  constructor(entity: ArFSPublicFolder, hierarchy: FolderHierarchy) {
    super(
      entity.appName,
      entity.appVersion,
      entity.arFS,
      entity.contentType,
      entity.driveId,
      entity.name,
      entity.txId,
      entity.unixTime,
      entity.parentFolderId,
      entity.folderId,
      entity.customMetaDataGqlTags,
      entity.customMetaDataJson,
    );

    this.path = `${hierarchy.pathToFolderId(entity.parentFolderId)}${
      entity.name
    }`;
    this.txIdPath = `${hierarchy.txPathToFolderId(entity.parentFolderId)}${
      entity.txId
    }`;
    this.entityIdPath = `${hierarchy.entityPathToFolderId(
      entity.parentFolderId,
    )}${entity.folderId}`;
  }
}

export class ArFSPrivateFolder extends ArFSFileOrFolderEntity<"folder"> {
  constructor(
    appName: string,
    appVersion: string,
    arFS: string,
    contentType: ContentType,
    driveId: EntityID,
    name: string,
    txId: ArweaveAddress,
    unixTime: UnixTime,
    parentFolderId: EntityID,
    readonly folderId: EntityID,
    readonly cipher: string,
    readonly cipherIV: string,
    readonly driveKey: string,
    customMetaDataGqlTags?: CustomMetaDataGqlTags,
    customMetaDataJson?: CustomMetaDataJsonFields,
  ) {
    super(
      appName,
      appVersion,
      arFS,
      contentType,
      driveId,
      "folder",
      name,
      new ByteCount(0),
      txId,
      unixTime,
      new UnixTime(0),
      stubTransactionID,
      JSON_CONTENT_TYPE,
      parentFolderId,
      folderId,
      customMetaDataGqlTags,
      customMetaDataJson,
    );
  }
}

export class ArFSPrivateFolderWithPaths
  extends ArFSPrivateFolder
  implements ArFSWithPath
{
  readonly path: string;
  readonly txIdPath: string;
  readonly entityIdPath: string;

  constructor(entity: ArFSPrivateFolder, hierarchy: FolderHierarchy) {
    super(
      entity.appName,
      entity.appVersion,
      entity.arFS,
      entity.contentType,
      entity.driveId,
      entity.name,
      entity.txId,
      entity.unixTime,
      entity.parentFolderId,
      entity.folderId,
      entity.cipher,
      entity.cipherIV,
      entity.driveKey,
      entity.customMetaDataGqlTags,
      entity.customMetaDataJson,
    );

    this.path = `${hierarchy.pathToFolderId(entity.parentFolderId)}${
      entity.name
    }`;
    this.txIdPath = `${hierarchy.txPathToFolderId(entity.parentFolderId)}${
      entity.txId
    }`;
    this.entityIdPath = `${hierarchy.entityPathToFolderId(
      entity.parentFolderId,
    )}${entity.folderId}`;
  }
}

export class ArFSPrivateFolderWithPathsKeyless extends ArFSPrivateFolderWithPaths {
  driveKey: never;

  constructor(entity: ArFSPrivateFolder, hierarchy: FolderHierarchy) {
    super(entity, hierarchy);
    delete this.driveKey;
  }
}

// Remove me after PE-1027 is applied
export class ArFSPrivateFolderKeyless extends ArFSPrivateFolder {
  driveKey: never;

  constructor(entity: ArFSPrivateFolder) {
    super(
      entity.appName,
      entity.appVersion,
      entity.arFS,
      entity.contentType,
      entity.driveId,
      entity.name,
      entity.txId,
      entity.unixTime,
      entity.parentFolderId,
      entity.folderId,
      entity.cipher,
      entity.cipherIV,
      entity.driveKey,
      entity.customMetaDataGqlTags,
      entity.customMetaDataJson,
    );
    delete this.driveKey;
  }
}

export class FolderTreeNode {
  constructor(
    public readonly folderId: EntityID,
    public readonly parent?: FolderTreeNode,
    public children: FolderTreeNode[] = [],
  ) {}

  public static fromEntity(
    folderEntity: ArFSFileOrFolderEntity<"folder">,
  ): FolderTreeNode {
    const node = new FolderTreeNode(folderEntity.entityId);
    return node;
  }
}

export class FolderHierarchy {
  private _rootNode?: FolderTreeNode;

  constructor(
    private readonly folderIdToEntityMap: {
      [k: string]: ArFSFileOrFolderEntity<"folder">;
    },
    private readonly folderIdToNodeMap: { [k: string]: FolderTreeNode },
  ) {}

  static newFromEntities(
    entities: ArFSFileOrFolderEntity<"folder">[],
  ): FolderHierarchy {
    const folderIdToEntityMap = entities.reduce((accumulator, entity) => {
      return Object.assign(accumulator, { [`${entity.entityId}`]: entity });
    }, {});
    const folderIdToNodeMap: { [k: string]: FolderTreeNode } = {};

    for (const entity of entities) {
      this.setupNodesWithEntity(entity, folderIdToEntityMap, folderIdToNodeMap);
    }

    return new FolderHierarchy(folderIdToEntityMap, folderIdToNodeMap);
  }

  private static setupNodesWithEntity(
    entity: ArFSFileOrFolderEntity<"folder">,
    folderIdToEntityMap: { [k: string]: ArFSFileOrFolderEntity<"folder"> },
    folderIdToNodeMap: { [k: string]: FolderTreeNode },
  ): void {
    const folderIdKeyIsPresent = Object.keys(folderIdToNodeMap).includes(
      `${entity.entityId}`,
    );
    const parentFolderIdKeyIsPresent = Object.keys(folderIdToNodeMap).includes(
      `${entity.parentFolderId}`,
    );
    if (!folderIdKeyIsPresent) {
      if (!parentFolderIdKeyIsPresent) {
        const parentFolderEntity =
          folderIdToEntityMap[`${entity.parentFolderId}`];
        if (parentFolderEntity) {
          this.setupNodesWithEntity(
            parentFolderEntity,
            folderIdToEntityMap,
            folderIdToNodeMap,
          );
        }
      }
      const parent = folderIdToNodeMap[`${entity.parentFolderId}`];
      if (parent) {
        const node = new FolderTreeNode(entity.entityId, parent);
        parent.children.push(node);
        folderIdToNodeMap[`${entity.entityId}`] = node;
      } else {
        // this one is supposed to be the new root
        const rootNode = new FolderTreeNode(entity.entityId);
        folderIdToNodeMap[`${entity.entityId}`] = rootNode;
      }
    }
  }

  public get rootNode(): FolderTreeNode {
    if (this._rootNode) {
      return this._rootNode;
    }

    const someFolderId = Object.keys(this.folderIdToEntityMap)[0];
    let tmpNode = this.folderIdToNodeMap[someFolderId];
    while (
      tmpNode.parent &&
      this.folderIdToNodeMap[`${tmpNode.parent.folderId}`]
    ) {
      tmpNode = tmpNode.parent;
    }
    this._rootNode = tmpNode;
    return tmpNode;
  }

  public subTreeOf(
    folderId: EntityID,
    maxDepth = Number.MAX_SAFE_INTEGER,
  ): FolderHierarchy {
    const newRootNode = this.folderIdToNodeMap[`${folderId}`];

    const subTreeNodes = this.nodeAndChildrenOf(newRootNode, maxDepth);

    const entitiesMapping = subTreeNodes.reduce((accumulator, node) => {
      return Object.assign(accumulator, {
        [`${node.folderId}`]: this.folderIdToEntityMap[`${node.folderId}`],
      });
    }, {});
    const nodesMapping = subTreeNodes.reduce((accumulator, node) => {
      return Object.assign(accumulator, { [`${node.folderId}`]: node });
    }, {});

    return new FolderHierarchy(entitiesMapping, nodesMapping);
  }

  public allFolderIDs(): EntityID[] {
    return Object.keys(this.folderIdToEntityMap).map((eid) => EID(eid));
  }

  public nodeAndChildrenOf(
    node: FolderTreeNode,
    maxDepth: number,
  ): FolderTreeNode[] {
    const subTreeEntities: FolderTreeNode[] = [node];
    if (maxDepth > 0) {
      node.children.forEach((child) => {
        subTreeEntities.push(...this.nodeAndChildrenOf(child, maxDepth - 1));
      });
    }
    return subTreeEntities;
  }

  public folderIdSubtreeFromFolderId(
    folderId: EntityID,
    maxDepth: number,
  ): EntityID[] {
    const rootNode = this.folderIdToNodeMap[`${folderId}`];
    const subTree: EntityID[] = [rootNode.folderId];
    switch (maxDepth) {
      case 0:
        // Recursion stopping condition - hit the max allowable depth
        break;
      default: {
        // Recursion stopping condition - no further child nodes to recurse to
        rootNode.children
          .map((node) => node.folderId)
          .forEach((childFolderID) => {
            subTree.push(
              ...this.folderIdSubtreeFromFolderId(childFolderID, maxDepth - 1),
            );
          });
        break;
      }
    }
    return subTree;
  }

  public pathToFolderId(folderId: EntityID): string {
    if (this.rootNode.parent) {
      throw new Error(`Can't compute paths from sub-tree`);
    }
    if (`${folderId}` === ROOT_FOLDER_ID_PLACEHOLDER) {
      return "/";
    }
    let folderNode = this.folderIdToNodeMap[`${folderId}`];
    const nodesInPathToFolder = [folderNode];
    while (
      folderNode.parent &&
      !folderNode.folderId.equals(this.rootNode.folderId)
    ) {
      folderNode = folderNode.parent;
      nodesInPathToFolder.push(folderNode);
    }
    const olderFirstNodesInPathToFolder = nodesInPathToFolder.reverse();
    const olderFirstNamesOfNodesInPath = olderFirstNodesInPathToFolder.map(
      (n) => this.folderIdToEntityMap[`${n.folderId}`].name,
    );
    const stringPath = olderFirstNamesOfNodesInPath.join("/");
    return `/${stringPath}/`;
  }

  public entityPathToFolderId(folderId: EntityID): string {
    if (this.rootNode.parent) {
      throw new Error(`Can't compute paths from sub-tree`);
    }
    if (`${folderId}` === ROOT_FOLDER_ID_PLACEHOLDER) {
      return "/";
    }
    let folderNode = this.folderIdToNodeMap[`${folderId}`];
    const nodesInPathToFolder = [folderNode];
    while (
      folderNode.parent &&
      !folderNode.folderId.equals(this.rootNode.folderId)
    ) {
      folderNode = folderNode.parent;
      nodesInPathToFolder.push(folderNode);
    }
    const olderFirstNodesInPathToFolder = nodesInPathToFolder.reverse();
    const olderFirstFolderIDsOfNodesInPath = olderFirstNodesInPathToFolder.map(
      (n) => n.folderId,
    );
    const stringPath = olderFirstFolderIDsOfNodesInPath.join("/");
    return `/${stringPath}/`;
  }

  public txPathToFolderId(folderId: EntityID): string {
    if (this.rootNode.parent) {
      throw new Error(`Can't compute paths from sub-tree`);
    }
    if (`${folderId}` === ROOT_FOLDER_ID_PLACEHOLDER) {
      return "/";
    }
    let folderNode = this.folderIdToNodeMap[`${folderId}`];
    const nodesInPathToFolder = [folderNode];
    while (
      folderNode.parent &&
      !folderNode.folderId.equals(this.rootNode.folderId)
    ) {
      folderNode = folderNode.parent;
      nodesInPathToFolder.push(folderNode);
    }
    const olderFirstNodesInPathToFolder = nodesInPathToFolder.reverse();
    const olderFirstTxTDsOfNodesInPath = olderFirstNodesInPathToFolder.map(
      (n) => this.folderIdToEntityMap[`${n.folderId}`].txId,
    );
    const stringPath = olderFirstTxTDsOfNodesInPath.join("/");
    return `/${stringPath}/`;
  }
}

export abstract class ArFSFolderBuilder<
  T extends ArFSPublicFolder | ArFSPrivateFolder,
> extends ArFSFileOrFolderBuilder<"folder", T> {
  protected async parseFromArweaveNode(
    node?: GQLNodeInterface,
  ): Promise<GQLTagInterface[]> {
    const tags = await super.parseFromArweaveNode(node);
    return tags.filter((tag) => tag.name !== "Folder-Id");
  }

  getGqlQueryParameters(): GQLTagInterface[] {
    return [
      { name: "Folder-Id", value: `${this.entityId}` },
      { name: "Entity-Type", value: "folder" },
    ];
  }

  protected readonly protectedDataJsonKeys = ["name"];
}

export class RootFolderID extends EntityID {
  constructor() {
    super(`${fakeEntityId}`); // Unused after next line
    this.entityId = ROOT_FOLDER_ID_PLACEHOLDER;
  }
}

export class ArFSPublicFolderBuilder extends ArFSFolderBuilder<ArFSPublicFolder> {
  static fromArweaveNode(
    node: GQLNodeInterface,
    gatewayApi: GatewayAPI,
  ): ArFSPublicFolderBuilder {
    const { tags } = node;
    const folderId = tags.find((tag) => tag.name === "Folder-Id")?.value;
    if (!folderId) {
      throw new Error("Folder-ID tag missing!");
    }
    const folderBuilder = new ArFSPublicFolderBuilder({
      entityId: EID(folderId),
      gatewayApi,
    });
    return folderBuilder;
  }

  protected async buildEntity(): Promise<ArFSPublicFolder> {
    if (!this.parentFolderId) {
      // Root folders do not have a Parent-Folder-Id tag
      this.parentFolderId = new RootFolderID();
    }

    if (
      this.appName?.length &&
      this.appVersion?.length &&
      this.arFS?.length &&
      this.contentType?.length &&
      this.driveId &&
      this.entityType?.length &&
      this.txId &&
      this.unixTime &&
      this.parentFolderId &&
      this.entityId &&
      this.entityType === "folder"
    ) {
      const txData = await this.getDataForTxID(this.txId);
      const dataString = await Utf8ArrayToStr(txData);
      const dataJSON = await JSON.parse(dataString);

      // Get the folder name
      this.name = dataJSON.name;
      if (!this.name) {
        throw new Error("Invalid public folder state: name not found!");
      }
      this.parseCustomMetaDataFromDataJson(dataJSON);

      return Promise.resolve(
        new ArFSPublicFolder(
          this.appName,
          this.appVersion,
          this.arFS,
          this.contentType,
          this.driveId,
          this.name,
          this.txId,
          this.unixTime,
          this.parentFolderId,
          this.entityId,
          this.customMetaData.metaDataGqlTags,
          this.customMetaData.metaDataJson,
        ),
      );
    }
    throw new Error("Invalid public folder state");
  }
}

export interface ArFSListPublicFolderParams {
  folderId: EntityID;
  maxDepth: number;
  includeRoot: boolean;
  owner: ArweaveAddress;
  withKeys?: boolean;
  withPathsFactory?: (
    entity: ArFSPrivateFile | ArFSPrivateFolder,
    hierarchy: FolderHierarchy,
    driveKey: EntityKey,
  ) => ArFSPrivateFolderWithPaths | ArFSPrivateFileWithPaths;
}
export class ArFSFolderToUpload extends ArFSBaseEntityToUpload {
  files: ArFSFileToUpload[] = [];
  folders: ArFSFolderToUpload[] = [];

  conflictResolution: FolderConflictResolution = undefined;

  public readonly entityType = "folder";
  public readonly sourceUri = this.filePath.fullPath ?? this.filePath.name;

  constructor(
    public readonly filePath: FileSystemEntry,
    public readonly fileStats: FileSystemEntry,
    public readonly customMetaData?: CustomMetaData,
  ) {
    super();

    //	const entitiesInFolder = this.filePath.fullPath;

    // 	for (const entityPath of entitiesInFolder) {
    // 		const absoluteEntityPath = [this.filePath, entityPath].join('/');
    // 		const entityStats = entitiesInFolder;

    // 		if (entityStats.isDirectory()) {
    // 			// Child is a folder, build a new folder which will construct it's own children
    // 			const childFolder = new ArFSFolderToUpload(absoluteEntityPath, entityStats, customMetaData);
    // 			this.folders.push(childFolder);
    // 		} else {
    // 			// Child is a file, build a new file
    // 			const childFile = new ArFSFileToUpload(absoluteEntityPath, entityStats, undefined, customMetaData);
    // 			if (childFile.getBaseName() !== '.DS_Store') {
    // 				this.files.push(childFile);
    // 			}
    // 		}
    // 	}
  }

  public getBaseName(): string {
    return this.filePath.fullPath;
  }

  getTotalByteCount(encrypted = false): ByteCount {
    let totalByteCount = 0;

    for (const file of this.files) {
      totalByteCount += encrypted
        ? +file.encryptedDataSize()
        : file.fileStats.size;
    }
    for (const folder of this.folders) {
      totalByteCount += +folder.getTotalByteCount(encrypted);
    }

    return new ByteCount(totalByteCount);
  }
}
