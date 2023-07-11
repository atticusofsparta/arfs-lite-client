import Arweave from "arweave";

import {
  ArFSDriveEntity,
  ArFSPublicDrive,
  ArFSPublicDriveBuilder,
  SafeArFSDriveBuilder,
} from "./types/arfs/drive";
import { ADDR, ArweaveAddress, PrivateKeyData } from "./types/arweave";
import {
  ArFSAllPublicFoldersOfDriveParams,
  EID,
  EntityID,
  GetPublicDriveParams,
  GetPublicFileParams,
  GetPublicFolderParams,
  ListPublicFolderParams,
} from "./types/arfs/common";
import { ASCENDING_ORDER, GQLEdgeInterface } from "./types/gql";
import {
  buildQuery,
  gatewayUrlForArweave,
  latestRevisionFilter,
  latestRevisionFilterForDrives,
  publicEntityWithPathsFactory,
} from "./utils/common";
import { GatewayAPI } from "./types/common";
import {
  ArFSListPublicFolderParams,
  ArFSPublicFolder,
  ArFSPublicFolderBuilder,
  ArFSPublicFolderWithPaths,
  FolderHierarchy,
} from "./types/arfs/folder";
import {
  ArFSPublicFile,
  ArFSPublicFileBuilder,
  ArFSPublicFileWithPaths,
} from "./types/arfs/file";
import { defaultArFSClientCache } from "./types/arfs/cache";

interface ArFSClientType {
  readonly _arweave: Arweave;
  readonly appName: string;
  readonly appVersion: string;

  getOwnerForDriveId(driveId: EntityID): Promise<ArweaveAddress>;
  // public functions
  getPublicDrive({
    driveId,
    owner,
  }: GetPublicDriveParams): Promise<ArFSPublicDrive>;
  getPublicFolder({
    folderId,
    owner,
  }: GetPublicFolderParams): Promise<ArFSPublicFolder>;
  getPublicFile({
    fileId,
    owner,
  }: GetPublicFileParams): Promise<ArFSPublicFile>;
  getAllDrivesForAddress({
    address,
    privateKeyData,
    latestRevisionsOnly = true,
  }: {
    address: string;
    privateKeyData: PrivateKeyData;
    latestRevisionsOnly?: boolean;
  }): Promise<ArFSDriveEntity[]>;
  listPublicFolder({
    folderId,
    maxDepth,
    includeRoot,
    owner,
  }: ListPublicFolderParams): Promise<
    (ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths)[]
  >;
  getAllFoldersOfPublicDrive({
    driveId,
    owner,
    latestRevisionsOnly = false,
  }: ArFSAllPublicFoldersOfDriveParams): Promise<ArFSPublicFolder[]>;
  getPublicFilesWithParentFolderIds({
    folderIDs,
    owner,
    latestRevisionsOnly = false,
  }: {
    folderIDs: EntityID[];
    owner: ArweaveAddress;
    latestRevisionsOnly?: boolean;
  }): Promise<ArFSPublicFile[]>;

  // private functions
  //   getPrivateDrive({
  //     driveId,
  //     owner,
  //   }: GetPublicDriveParams): Promise<ArFSPublicDrive>;
  //   getPrivateFolder({
  //     folderId,
  //     owner,
  //   }: GetPublicFolderParams): Promise<ArFSPublicFolder>;
  //   getPrivateFile({
  //     fileId,
  //     owner,
  //   }: GetPublicFileParams): Promise<ArFSPublicFile>;
  //   getAllPrivateDrivesForAddress(
  //     address: ArweaveAddress,
  //   ): Promise<ArFSDriveEntity[]>;
  //   listPrivateFolder({
  //     folderId,
  //     maxDepth,
  //     includeRoot,
  //     owner,
  //   }: ListPublicFolderParams): Promise<
  //     (ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths)[]
  //   >;
}

class ArFSClient implements ArFSClientType {
  _arweave: Arweave;
  _gatewayApi: GatewayAPI;
  _caches: typeof defaultArFSClientCache;
  appName: string;
  appVersion: string;

  constructor(
    arweave: Arweave,
    protected caches = defaultArFSClientCache,
    protected gatewayApi = new GatewayAPI({
      gatewayUrl: gatewayUrlForArweave(arweave),
    }),
  ) {
    this._arweave = arweave;
    this._gatewayApi = gatewayApi;
    this._caches = caches;
    this.appName = "ArFS";
    this.appVersion = "0.0.1";
  }

  public async getOwnerForDriveId(driveId: EntityID): Promise<ArweaveAddress> {
    const cachedOwner = await this.caches.ownerCache.get(driveId);
    if (cachedOwner) {
      return cachedOwner;
    }

    const newDriveId = async () => {
      const gqlQuery = buildQuery({
        tags: [
          { name: "Drive-Id", value: `${driveId}` },
          { name: "Entity-Type", value: "drive" },
        ],
        sort: ASCENDING_ORDER,
      });
      const transactions = await this.gatewayApi.gqlRequest(gqlQuery);
      const edges: GQLEdgeInterface[] = transactions.edges;

      if (!edges.length) {
        throw new Error(
          `Could not find a transaction with "Drive-Id": ${driveId}`,
        );
      }

      const edgeOfFirstDrive = edges[0];
      const driveOwnerAddress = edgeOfFirstDrive.node.owner.address;
      const driveOwner = ADDR(driveOwnerAddress);
      return driveOwner;
    };

    return this.caches.ownerCache.put(driveId, await newDriveId());
  }

  async getDriveIDForEntityId(
    entityId: EntityID,
    gqlTypeTag: "File-Id" | "Folder-Id",
  ): Promise<EntityID> {
    const cachedDriveID = await this.caches.driveIdCache.get(entityId);
    if (cachedDriveID) {
      return cachedDriveID;
    }

    const newEntityId = await (async () => {
      const gqlQuery = buildQuery({
        tags: [{ name: gqlTypeTag, value: `${entityId}` }],
      });

      const transactions = await this.gatewayApi.gqlRequest(gqlQuery);
      const edges: GQLEdgeInterface[] = transactions.edges;

      if (!edges.length) {
        throw new Error(`Entity with ${gqlTypeTag} ${entityId} not found!`);
      }

      const driveIdTag = edges[0].node.tags.find((t) => t.name === "Drive-Id");
      if (driveIdTag) {
        return EID(driveIdTag.value);
      }

      throw new Error(
        `No Drive-Id tag found for meta data transaction of ${gqlTypeTag}: ${entityId}`,
      );
    });

    return await this.caches.driveIdCache.put(entityId, await newEntityId());
  }

  async getDriveOwnerForFolderId(folderId: EntityID): Promise<ArweaveAddress> {
    return this.getOwnerForDriveId(await this.getDriveIdForFolderId(folderId));
  }

  async getDriveIdForFolderId(folderId: EntityID): Promise<EntityID> {
    return this.getDriveIDForEntityId(folderId, "Folder-Id");
  }

  async getDriveOwnerForFileId(fileId: EntityID): Promise<ArweaveAddress> {
    return this.getOwnerForDriveId(await this.getDriveIdForFileId(fileId));
  }

  async getDriveIdForFileId(fileId: EntityID): Promise<EntityID> {
    return this.getDriveIDForEntityId(fileId, "File-Id");
  }

  async getDriveIdForEntityID(folderId: EntityID): Promise<EntityID> {
    return this.getDriveIDForEntityId(folderId, "Folder-Id");
  }

  // Convenience function for known-public use cases
  async getPublicDrive({
    driveId,
    owner,
  }: {
    driveId: EntityID;
    owner: ArweaveAddress;
  }): Promise<ArFSPublicDrive> {
    const cacheKey = { driveId, owner };
    const cachedDrive = await this.caches.publicDriveCache.get(cacheKey);
    if (cachedDrive) {
      return cachedDrive;
    }
    return await this.caches.publicDriveCache.put(
      cacheKey,
      await new ArFSPublicDriveBuilder({
        entityId: driveId,
        gatewayApi: this.gatewayApi,
        owner,
      }).build(),
    );
  }

  // Convenience function for known-private use cases
  async getPublicFolder({
    folderId,
    owner,
  }: {
    folderId: EntityID;
    owner: ArweaveAddress;
  }): Promise<ArFSPublicFolder> {
    const cacheKey = { folderId, owner };
    const cachedFolder = await this.caches.publicFolderCache.get(cacheKey);
    if (cachedFolder) {
      return cachedFolder;
    }
    return await this.caches.publicFolderCache.put(
      cacheKey,
      await new ArFSPublicFolderBuilder({
        entityId: folderId,
        gatewayApi: this.gatewayApi,
        owner,
      }).build(),
    );
  }

  async getPublicFile({
    fileId,
    owner,
  }: {
    fileId: EntityID;
    owner: ArweaveAddress;
  }): Promise<ArFSPublicFile> {
    const cacheKey = { fileId, owner };
    const cachedFile = await this.caches.publicFileCache.get(cacheKey);
    if (cachedFile) {
      return cachedFile;
    }
    return await this.caches.publicFileCache.put(
      cacheKey,
      await new ArFSPublicFileBuilder({
        entityId: fileId,
        gatewayApi: this.gatewayApi,
        owner,
      }).build(),
    );
  }

  async getAllDrivesForAddress({
    address,
    privateKeyData,
    latestRevisionsOnly = true,
  }: {
    address: string;
    privateKeyData: PrivateKeyData;
    latestRevisionsOnly?: boolean;
  }): Promise<ArFSDriveEntity[]> {
    const owner = new ArweaveAddress(address);
    let cursor = "";
    let hasNextPage = true;
    const allDrives: ArFSDriveEntity[] = [];

    while (hasNextPage) {
      const gqlQuery = buildQuery({
        tags: [{ name: "Entity-Type", value: "drive" }],
        cursor,
        owner,
      });

      const transactions = await this.gatewayApi.gqlRequest(gqlQuery);
      const { edges } = transactions;
      hasNextPage = transactions.pageInfo.hasNextPage;

      const drives: Promise<ArFSDriveEntity>[] = edges.map(
        async (edge: GQLEdgeInterface) => {
          const { node } = edge;
          cursor = edge.cursor;

          const driveBuilder = SafeArFSDriveBuilder.fromArweaveNode(
            node,
            this.gatewayApi,
            privateKeyData,
          );
          const drive = await driveBuilder.build(node);
          if (drive.drivePrivacy === "public") {
            const cacheKey = { driveId: drive.driveId, owner };
            return await this.caches.publicDriveCache.put(
              cacheKey,
              await Promise.resolve(drive as ArFSPublicDrive),
            );
          } else {
            // TODO: No access to private drive cache from here
            return Promise.resolve(drive);
          }
        },
      );

      allDrives.push(...(await Promise.all(drives)));
    }

    return latestRevisionsOnly
      ? allDrives.filter(latestRevisionFilterForDrives)
      : allDrives;
  }

  async getPublicFilesWithParentFolderIds({
    folderIDs,
    owner,
    latestRevisionsOnly = false,
  }: {
    folderIDs: EntityID[];
    owner: ArweaveAddress;
    latestRevisionsOnly?: boolean;
  }): Promise<ArFSPublicFile[]> {
    let cursor = "";
    let hasNextPage = true;
    const allFiles: ArFSPublicFile[] = [];

    while (hasNextPage) {
      const gqlQuery = buildQuery({
        tags: [
          {
            name: "Parent-Folder-Id",
            value: folderIDs.map((fid) => fid.toString()),
          },
          { name: "Entity-Type", value: "file" },
        ],
        cursor,
        owner,
      });

      const transactions = await this.gatewayApi.gqlRequest(gqlQuery);
      const { edges } = transactions;
      hasNextPage = transactions.pageInfo.hasNextPage;
      const files: Promise<ArFSPublicFile>[] = edges.map(
        async (edge: GQLEdgeInterface) => {
          const { node } = edge;
          cursor = edge.cursor;
          const fileBuilder = ArFSPublicFileBuilder.fromArweaveNode(
            node,
            this.gatewayApi,
          );
          const file = await fileBuilder.build(node);
          const cacheKey = { fileId: file.fileId, owner };
          allFiles.push(file);
          return await this.caches.publicFileCache.put(
            cacheKey,
            await Promise.resolve(file),
          );
        },
      );
      await Promise.all(files);
    }
    return latestRevisionsOnly
      ? allFiles.filter(latestRevisionFilter)
      : allFiles;
  }

  async getAllFoldersOfPublicDrive({
    driveId,
    owner,
    latestRevisionsOnly = false,
  }: ArFSAllPublicFoldersOfDriveParams): Promise<ArFSPublicFolder[]> {
    let cursor = "";
    let hasNextPage = true;
    const allFolders: ArFSPublicFolder[] = [];

    while (hasNextPage) {
      const gqlQuery = buildQuery({
        tags: [
          { name: "Drive-Id", value: `${driveId}` },
          { name: "Entity-Type", value: "folder" },
        ],
        cursor,
        owner,
      });

      const transactions = await this.gatewayApi.gqlRequest(gqlQuery);
      const { edges } = transactions;

      hasNextPage = transactions.pageInfo.hasNextPage;
      const folders: Promise<ArFSPublicFolder>[] = edges.map(
        async (edge: GQLEdgeInterface) => {
          const { node } = edge;
          cursor = edge.cursor;
          const folderBuilder = ArFSPublicFolderBuilder.fromArweaveNode(
            node,
            this.gatewayApi,
          );
          const folder = await folderBuilder.build(node);
          const cacheKey = { folderId: folder.entityId, owner };
          return await this.caches.publicFolderCache.put(
            cacheKey,
            await Promise.resolve(folder),
          );
        },
      );
      allFolders.push(...(await Promise.all(folders)));
    }
    return latestRevisionsOnly
      ? allFolders.filter(latestRevisionFilter)
      : allFolders;
  }

  /**
   * Lists the children of certain public folder
   * @param {FolderID} folderId the folder ID to list children of
   * @param {number} maxDepth a non-negative integer value indicating the depth of the folder tree to list where 0 = this folder's contents only
   * @param {boolean} includeRoot whether or not folderId's folder data should be included in the listing
   * @returns {ArFSPublicFileOrFolderWithPaths[]} an array representation of the children and parent folder
   */
  async listPublicFolder({
    folderId,
    maxDepth,
    includeRoot,
    owner,
  }: ArFSListPublicFolderParams): Promise<
    (ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths)[]
  > {
    if (!Number.isInteger(maxDepth) || maxDepth < 0) {
      throw new Error("maxDepth should be a non-negative integer!");
    }

    const folder = await this.getPublicFolder({ folderId, owner });

    // Fetch all of the folder entities within the drive
    const driveIdOfFolder = folder.driveId;
    const allFolderEntitiesOfDrive = await this.getAllFoldersOfPublicDrive({
      driveId: driveIdOfFolder,
      owner,
      latestRevisionsOnly: true,
    });

    // Feed entities to FolderHierarchy
    const hierarchy = FolderHierarchy.newFromEntities(allFolderEntitiesOfDrive);
    const searchFolderIDs = hierarchy.folderIdSubtreeFromFolderId(
      folderId,
      maxDepth,
    );
    const [, ...subFolderIDs]: EntityID[] =
      hierarchy.folderIdSubtreeFromFolderId(folderId, maxDepth + 1);

    const childrenFolderEntities = allFolderEntitiesOfDrive.filter((folder) =>
      subFolderIDs.some((fid) => fid.equals(folder.entityId)),
    );

    if (includeRoot) {
      childrenFolderEntities.unshift(folder);
    }

    // Fetch all file entities within all Folders of the drive
    const childrenFileEntities: ArFSPublicFile[] = [];

    for (const id of searchFolderIDs) {
      (
        await this.getPublicFilesWithParentFolderIds({
          folderIDs: [id],
          owner,
          latestRevisionsOnly: true,
        })
      ).forEach((e) => {
        childrenFileEntities.push(e);
      });
    }

    const children: (ArFSPublicFolder | ArFSPublicFile)[] = [];
    for (const en of childrenFolderEntities) {
      children.push(en);
    }
    for (const en of childrenFileEntities) {
      children.push(en);
    }

    const entitiesWithPath = children.map((entity) =>
      publicEntityWithPathsFactory(entity, hierarchy),
    );
    return entitiesWithPath;
  }
}

export { ArFSClient, ArFSClientType, ArweaveAddress, PrivateKeyData };
