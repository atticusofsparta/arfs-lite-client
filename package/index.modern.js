import"uuid";import t from"axios";import"crypto";import"futoin-hkdf";import"utf8";import"jwk-to-pem";import"base64-js";import*as e from"mime-types";import"bignumber.js";import i from"arweave";let r;class s{constructor({gatewayUrl:e,maxRetriesPerRequest:i=8,initialErrorDelayMS:r=Z,fatalErrors:s=X,validStatusCodes:a=[200],axiosInstance:n=t.create({validateStatus:void 0})}){this.gatewayUrl=void 0,this.maxRetriesPerRequest=void 0,this.initialErrorDelayMS=void 0,this.fatalErrors=void 0,this.validStatusCodes=void 0,this.axiosInstance=void 0,this.lastError="unknown error",this.lastRespStatus=0,this.gatewayUrl=e,this.maxRetriesPerRequest=i,this.initialErrorDelayMS=r,this.fatalErrors=s,this.validStatusCodes=a,this.axiosInstance=n}async postChunk(t){await this.postToEndpoint("chunk",t)}async postTxHeader(t){await this.postToEndpoint("tx",t)}async gqlRequest(t){try{const{data:e}=await this.postToEndpoint("graphql",t);return e.data.transactions}catch(t){throw Error(`GQL Error: ${t.message}`)}}async postToEndpoint(t,e){return this.retryRequestUntilMaxRetries(()=>this.axiosInstance.post(`${this.gatewayUrl.href}${t}`,e))}async getTransaction(t){try{return(await this.retryRequestUntilMaxRetries(()=>this.axiosInstance.get(`${this.gatewayUrl.href}tx/${t}`))).data}catch(t){throw Error(`Transaction could not be found from the gateway: (Status: ${this.lastRespStatus}) ${this.lastError}`)}}async getTxData(t){const e=await $.get(t);if(e)return e;const{data:i}=await this.retryRequestUntilMaxRetries(()=>this.axiosInstance.get(`${this.gatewayUrl.href}${t}`,{responseType:"arraybuffer"}));return await $.put(t,i),i}async retryRequestUntilMaxRetries(t){let e=0;for(;e<=this.maxRetriesPerRequest;){const i=await this.tryRequest(t);if(i)return e>0&&console.error("Request has been successfully retried!"),i;if(this.throwIfFatalError(),429===this.lastRespStatus){await this.rateLimitThrottle();continue}console.error(`Request to gateway has failed: (Status: ${this.lastRespStatus}) ${this.lastError}`);const r=e+1;r<=this.maxRetriesPerRequest&&(await this.exponentialBackOffAfterFailedRequest(e),console.error(`Retrying request, retry attempt ${r}...`)),e=r}throw new Error(`Request to gateway has failed: (Status: ${this.lastRespStatus}) ${this.lastError}`)}async tryRequest(t){try{var e;const i=await t();if(this.lastRespStatus=i.status,this.isRequestSuccessful())return i;this.lastError=null!=(e=i.statusText)?e:i}catch(t){this.lastError=t instanceof Error?t.message:t}}isRequestSuccessful(){return this.validStatusCodes.includes(this.lastRespStatus)}throwIfFatalError(){if(this.fatalErrors.includes(this.lastError))throw new Error(`Fatal error encountered: (Status: ${this.lastRespStatus}) ${this.lastError}`)}async exponentialBackOffAfterFailedRequest(t){const e=Math.pow(2,t)*this.initialErrorDelayMS;console.error(`Waiting for ${(e/1e3).toFixed(1)} seconds before next request...`),await new Promise(t=>setTimeout(t,e))}async rateLimitThrottle(){console.error(`Gateway has returned a ${this.lastRespStatus} status which means your IP is being rate limited. Pausing for ${60..toFixed(1)} seconds before trying next request...`),await new Promise(t=>setTimeout(t,6e4))}}r=Symbol.toPrimitive;class a{constructor(t){if(this.byteCount=void 0,this.byteCount=t,!Number.isFinite(this.byteCount)||!Number.isInteger(this.byteCount)||this.byteCount<0)throw new Error("Byte count must be a non-negative integer value!")}[r](t){return"string"===t&&this.toString(),this.byteCount}plus(t){return new a(this.byteCount+t.byteCount)}minus(t){return new a(this.byteCount-t.byteCount)}isGreaterThan(t){return this.byteCount>t.byteCount}isGreaterThanOrEqualTo(t){return this.byteCount>=t.byteCount}toString(){return`${this.byteCount}`}valueOf(){return this.byteCount}toJSON(){return this.byteCount}equals(t){return this.byteCount===t.byteCount}}const n=t=>`\n\tedges {\n\t\t${t?"":"cursor"}\n\t\t\n\tnode {\n\t\tid\n\t\ttags {\n\t\t\tname\n\t\t\tvalue\n\t\t}\n\t\t\n\towner {\n\t\taddress\n\t}\n\n\t}\n\n\t}\n`,o=tt?Object.values(tt):[];function d(){return d=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var r in i)Object.prototype.hasOwnProperty.call(i,r)&&(t[r]=i[r])}return t},d.apply(this,arguments)}let h,c,l;h=Symbol.toPrimitive;class u{constructor(t){if(this.address=void 0,this.address=t,!t.match(new RegExp("^[a-zA-Z0-9_-]{43}$")))throw new Error("Arweave addresses must be 43 characters in length with characters in the following set: [a-zA-Z0-9_-]")}[h](t){if("number"===t)throw new Error("Arweave addresses cannot be interpreted as a number!");return this.toString()}equals(t){return this.address===t.address}toString(){return this.address}valueOf(){return this.address}toJSON(){return this.toString()}}function p(t){return new u(t)}const y=/^[a-f\d]{8}-([a-f\d]{4}-){3}[a-f\d]{12}$/i;c=Symbol.toPrimitive;class v{constructor(t){if(this.entityId=void 0,this.entityId=t,!t.match(y)&&"ENCRYPTED"!==t)throw new Error(`Invalid entity ID '${t}'!'`)}[c](t){if("number"===t)throw new Error("Entity IDs cannot be interpreted as a number!");return this.toString()}toString(){return this.entityId}valueOf(){return this.entityId}equals(t){return this.entityId===t.entityId}toJSON(){return this.toString()}}function m(t){return new v(t)}l=Symbol.toPrimitive;class I{constructor(t){if(this.unixTime=void 0,this.unixTime=t,this.unixTime<0||!Number.isInteger(this.unixTime)||!Number.isFinite(this.unixTime))throw new Error("Unix time must be a positive integer!")}equals(t){return+this.unixTime==+t.unixTime}[l](t){return"string"===t&&this.toString(),this.unixTime}toString(){return`${this.unixTime}`}valueOf(){return this.unixTime}toJSON(){return this.unixTime}}class f{constructor(t){if(this.keyData=void 0,this.keyData=t,!Buffer.isBuffer(t))throw new Error("The argument must be of type Buffer, got "+typeof t)}toString(){return this.keyData.toString("base64").replace("=","")}toJSON(){return this.toString()}}class w{constructor(t,e,i,r,s,a,n,o,d,h,c){this.appName=void 0,this.appVersion=void 0,this.arFS=void 0,this.contentType=void 0,this.driveId=void 0,this.entityType=void 0,this.name=void 0,this.txId=void 0,this.unixTime=void 0,this.customMetaDataGqlTags=void 0,this.customMetaDataJson=void 0,this.appName=t,this.appVersion=e,this.arFS=i,this.contentType=r,this.driveId=s,this.entityType=a,this.name=n,this.txId=o,this.unixTime=d,this.customMetaDataGqlTags=h,this.customMetaDataJson=c}}class g extends w{constructor(t,e,i,r,s,a,n,o,d,h,c,l,u,p,y,v,m){super(t,e,i,r,s,a,n,d,h,v,m),this.entityType=void 0,this.size=void 0,this.lastModifiedDate=void 0,this.dataTxId=void 0,this.dataContentType=void 0,this.parentFolderId=void 0,this.entityId=void 0,this.entityType=a,this.size=o,this.lastModifiedDate=c,this.dataTxId=l,this.dataContentType=u,this.parentFolderId=p,this.entityId=y}}class F{constructor({entityId:t,gatewayApi:e,owner:i}){this.appName=void 0,this.appVersion=void 0,this.arFS=void 0,this.contentType=void 0,this.driveId=void 0,this.entityType=void 0,this.name=void 0,this.txId=void 0,this.unixTime=void 0,this.entityId=void 0,this.gatewayApi=void 0,this.owner=void 0,this.customMetaData={},this.entityId=t,this.gatewayApi=e,this.owner=i}getDataForTxID(t){return this.gatewayApi.getTxData(t)}async parseFromArweaveNode(t,e){const i=[];if(!t){const i=D({tags:this.getGqlQueryParameters(),owner:e}),r=await this.gatewayApi.gqlRequest(i),{edges:s}=r;if(!s.length)throw new Error(`Entity with ID ${this.entityId} not found!`);t=s[0].node}this.txId=p(t.id);const{tags:r}=t;return r.forEach(t=>{const e=t.name,{value:r}=t;switch(e){case"App-Name":this.appName=r;break;case"App-Version":this.appVersion=r;break;case"ArFS":this.arFS=r;break;case"Content-Type":this.contentType=r;break;case"Drive-Id":this.driveId=m(r);break;case"Entity-Type":this.entityType=r;break;case"Unix-Time":this.unixTime=new I(+r);break;default:i.push(t)}}),i}async build(t){const e=await this.parseFromArweaveNode(t,this.owner);return this.parseCustomMetaDataFromGqlTags(e),this.buildEntity()}parseCustomMetaDataFromGqlTags(t){const e={};for(const{name:i,value:r}of t){const t=e[i],s=t?Array.isArray(t)?[...t,r]:[t,r]:r;Object.assign(e,{[i]:s})}!function(t){if("object"!=typeof t||null===t)return!1;for(const[e,i]of Object.entries(t)){if(b.protectedArFSGqlTagNames.includes(e))return console.error(`Provided custom metadata GQL tag name collides with a protected ArFS protected tag: ${e}`),!1;if("string"!=typeof i){if(!Array.isArray(i))return!1;for(const t of i){if("string"!=typeof t)return!1;S(t)}}else S(i)}return!0}(e)?console.error(`Parsed an invalid custom metadata shape from MetaData Tx GQL Tags: ${e}`):Object.keys(e).length>0&&(this.customMetaData.metaDataGqlTags=e)}parseCustomMetaDataFromDataJson(t){if(!function(t){try{JSON.parse(JSON.stringify(t))}catch(t){return!1}return!0}(t))return void console.error(`Parsed an invalid custom metadata shape from MetaData Tx Data JSON: ${t}`);const e=Object.entries(t).filter(([t])=>!this.protectedDataJsonKeys.includes(t)),i={};for(const[t,r]of e)Object.assign(i,{[t]:r});Object.keys(i).length>0&&(this.customMetaData.metaDataJson=i)}}class T extends F{constructor(...t){super(...t),this.parentFolderId=void 0}async parseFromArweaveNode(t){const e=[];return(await super.parseFromArweaveNode(t)).forEach(t=>{const i=t.name,{value:r}=t;"Parent-Folder-Id"===i?this.parentFolderId=m(r):e.push(t)}),e}}class b{constructor({appName:t="default",appVersion:e="default",arFSVersion:i="default"}){this.appName=void 0,this.appVersion=void 0,this.arFSVersion=void 0,this.appName=t,this.appVersion=e,this.arFSVersion=i}get baseAppTags(){return[{name:"App-Name",value:this.appName},{name:"App-Version",value:this.appVersion}]}get baseArFSTags(){return[...this.baseAppTags,{name:"ArFS",value:this.arFSVersion}]}get baseBundleTags(){return[...this.baseAppTags,{name:"Bundle-Format",value:"binary"},{name:"Bundle-Version",value:"2.0.0"}]}getFileDataItemTags(t,e){const i=this.baseAppTags;return i.push(...t?[U,z,L]:[{name:"Content-Type",value:e}]),i}}function D({tags:t=[],cursor:e,owner:i,sort:r="HEIGHT_DESC",ids:s}){let a="";t.forEach(t=>{a=`${a}\n\t\t\t\t{ name: "${t.name}", values: ${Array.isArray(t.value)?JSON.stringify(t.value):`"${t.value}"`} }`});const o=void 0===e;return{query:`query {\n\t\t\ttransactions(\n\t\t\t\t${null!=s&&s.length?`ids: [${s.map(t=>`"${t}"`)}]`:""}\n\t\t\t\tfirst: ${o?1:100}\n\t\t\t\tsort: ${r}\n\t\t\t\t${o?"":`after: "${e}"`}\n\t\t\t\t${void 0===i?"":`owners: ["${i}"]`}\n\t\t\t\ttags: [\n\t\t\t\t\t${a}\n\t\t\t\t]\n\t\t\t) {\n\t\t\t\t${o?"":"\n\tpageInfo {\n\t\thasNextPage\n\t}\n"}\n\t\t\t\t${n(o)}\n\t\t\t}\n\t\t}`}}function x(t){var e,i;const r=null!=(e=t.api.config.protocol)?e:H,s=null!=(i=t.api.config.host)?i:Q;return new URL(`${r}://${s}${t.api.config.port?`:${t.api.config.port}`:""}/`)}async function E(t){let e,i,r,s,a;e="";const n=t.length;for(i=0;i<n;)switch(r=t[i++],r>>4){case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:e+=String.fromCharCode(r);break;case 12:case 13:s=t[i++],e+=String.fromCharCode((31&r)<<6|63&s);break;case 14:s=t[i++],a=t[i++],e+=String.fromCharCode((15&r)<<12|(63&s)<<6|(63&a)<<0)}return e}function S(t){if(0===t.length)throw Error("Metadata string must be at least one character!")}function P(t,e,i){const r=i.filter(e=>e.entityId.equals(t.entityId));return t.txId.equals(r[0].txId)}function A(t,e,i){const r=i.filter(e=>e.driveId.equals(t.driveId));return t.txId.equals(r[0].txId)}b.protectedArFSGqlTagNames=o,d({},{created:[],tips:[],fees:{}},{manifest:{},links:[]});class N{constructor(t,e){this.dbPromise=void 0,this.cache=new IDBDatabase,this._gatewayApi=void 0,this.dbPromise=this.initDatabase(t),this.initDatabase(t).then(t=>{this.cache=t}),this._gatewayApi=new s({gatewayUrl:x(null!=e?e:i.init({}))})}cacheKeyString(t){return"string"==typeof t?t:JSON.stringify(t)}async initDatabase(t){return new Promise((t,e)=>{const i=indexedDB.open("arfs-entity-cache-db",1);i.onerror=t=>{e(i.error)},i.onupgradeneeded=t=>{const e=i.result.createObjectStore("cache",{keyPath:"key"});e.createIndex("key","key",{unique:!0}),e.createIndex("value","value")},i.onsuccess=e=>{t(i.result)}})}async put(t,e){const i=this.cacheKeyString(t),r=await this.dbPromise;return new Promise((t,s)=>{const a=r.transaction("cache","readwrite").objectStore("cache").put({key:i,value:e});a.onsuccess=i=>{t(e)},a.onerror=t=>{s(a.error)}})}async get(t){const e=this.cacheKeyString(t),i=await this.dbPromise;return new Promise((t,r)=>{const s=i.transaction("cache","readonly").objectStore("cache").index("key").get(e);s.onsuccess=e=>{const i=s.result;t(i?i.value:void 0)},s.onerror=t=>{r(s.error)}})}async remove(t){const e=this.cacheKeyString(t),i=await this.dbPromise;return new Promise((t,r)=>{const s=i.transaction("cache","readwrite").objectStore("cache"),a=s.index("key").getKey(e);a.onsuccess=e=>{const i=a.result;if(void 0!==i){const e=s.delete(i);e.onsuccess=()=>{t()},e.onerror=()=>{r(e.error)}}else t()},a.onerror=t=>{r(a.error)}})}async clear(){const t=await this.dbPromise;return new Promise((e,i)=>{const r=t.transaction("cache","readwrite").objectStore("cache").clear();r.onsuccess=t=>{e()},r.onerror=t=>{i(r.error)}})}async size(){const t=await this.dbPromise;return new Promise((e,i)=>{const r=t.transaction("cache","readonly").objectStore("cache").count();r.onsuccess=t=>{e(r.result)},r.onerror=t=>{i(r.error)}})}}class ${static platformCacheFolder(){return"metadata"}static async initDatabase(){return new Promise((t,e)=>{const i=indexedDB.open("arfs-metadata-cache-db",1);i.onerror=t=>{e(i.error)},i.onupgradeneeded=t=>{const e=i.result.createObjectStore("cache",{keyPath:"txId"});e.createIndex("txId","txId",{unique:!0}),e.createIndex("buffer","buffer")},i.onsuccess=e=>{t(i.result)}})}static async getCacheFolder(){return this.cacheFolderPromise||(this.cacheFolderPromise=new Promise(t=>{t(this.metadataCacheFolder)})),this.cacheFolderPromise}static async put(t,e){const i=await this.getDatabase();return new Promise((r,s)=>{const a=i.transaction("cache","readwrite").objectStore("cache").put({txId:t,buffer:e});a.onsuccess=t=>{r()},a.onerror=t=>{s(a.error)}})}static async get(t){const e=await this.getDatabase();return new Promise((i,r)=>{const s=e.transaction("cache","readonly").objectStore("cache").index("txId").get(t.toString());s.onsuccess=t=>{const e=s.result;i(e?e.buffer:void 0)},s.onerror=t=>{r(s.error)}})}static async getDatabase(){return this.dbPromise||(this.dbPromise=this.initDatabase()),this.dbPromise}}$.cacheFolderPromise=void 0,$.shouldCacheLog="1"===process.env.ARDRIVE_CACHE_LOG,$.metadataCacheFolder=$.platformCacheFolder(),$.logTag="[Metadata Cache] ",$.dbPromise=void 0;const C={ownerCache:new N(10),driveIdCache:new N(10),publicDriveCache:new N(10),publicFolderCache:new N(10),publicFileCache:new N(10)};class M extends g{constructor(t,e,i,r,s,a,n,o,d,h,c,l,u,p,y,v){super(t,e,i,r,s,"file",a,c,n,o,l,u,p,d,h,y,v),this.fileId=void 0,this.fileId=h}}class q extends M{constructor(t,e){super(t.appName,t.appVersion,t.arFS,t.contentType,t.driveId,t.name,t.txId,t.unixTime,t.parentFolderId,t.fileId,t.size,t.lastModifiedDate,t.dataTxId,t.dataContentType,t.customMetaDataGqlTags,t.customMetaDataJson),this.path=void 0,this.txIdPath=void 0,this.entityIdPath=void 0,this.path=`${e.pathToFolderId(t.parentFolderId)}${t.name}`,this.txIdPath=`${e.txPathToFolderId(t.parentFolderId)}${t.txId}`,this.entityIdPath=`${e.entityPathToFolderId(t.parentFolderId)}${t.fileId}`}}class O extends T{constructor(...t){super(...t),this.size=void 0,this.lastModifiedDate=void 0,this.dataTxId=void 0,this.dataContentType=void 0,this.protectedDataJsonKeys=["name","size","lastModifiedDate","dataTxId","dataContentType"]}getGqlQueryParameters(){return[{name:"File-Id",value:`${this.entityId}`},{name:"Entity-Type",value:"file"}]}async parseFromArweaveNode(t){return(await super.parseFromArweaveNode(t)).filter(t=>"File-Id"!==t.name)}}class R extends O{static fromArweaveNode(t,e){var i;const{tags:r}=t,s=null==(i=r.find(t=>"File-Id"===t.name))?void 0:i.value;if(!s)throw new Error("File-ID tag missing!");return new R({entityId:m(s),gatewayApi:e})}async buildEntity(){var t,i,r,s,n;if(null!=(t=this.appName)&&t.length&&null!=(i=this.appVersion)&&i.length&&null!=(r=this.arFS)&&r.length&&null!=(s=this.contentType)&&s.length&&this.driveId&&null!=(n=this.entityType)&&n.length&&this.txId&&this.unixTime&&this.parentFolderId&&this.entityId){var o;const t=await this.getDataForTxID(this.txId),i=await E(t),r=await JSON.parse(i);if(this.name=r.name,this.size=new a(r.size),this.lastModifiedDate=new I(r.lastModifiedDate),this.dataTxId=new u(r.dataTxId),this.dataContentType=null!=(o=r.dataContentType)?o:function(t){let i=t.substring(t.lastIndexOf(".")+1);i=i.toLowerCase();const r=e.lookup(i);return!1===r?"unknown":r}(this.name),!(this.name&&void 0!==this.size&&this.lastModifiedDate&&this.dataTxId&&this.dataContentType&&"file"===this.entityType))throw new Error("Invalid file state");return this.parseCustomMetaDataFromDataJson(r),Promise.resolve(new M(this.appName,this.appVersion,this.arFS,this.contentType,this.driveId,this.name,this.txId,this.unixTime,this.parentFolderId,this.entityId,this.size,this.lastModifiedDate,this.dataTxId,this.dataContentType,this.customMetaData.metaDataGqlTags,this.customMetaData.metaDataJson))}throw new Error("Invalid file state")}}new a(2147483646);class V extends g{constructor(t,e,i,r,s,n,o,d,h,c,l,u){super(t,e,i,r,s,"folder",n,new a(0),o,d,new I(0),et,B,h,c,l,u),this.folderId=void 0,this.folderId=c}}class k extends V{constructor(t,e){super(t.appName,t.appVersion,t.arFS,t.contentType,t.driveId,t.name,t.txId,t.unixTime,t.parentFolderId,t.folderId,t.customMetaDataGqlTags,t.customMetaDataJson),this.path=void 0,this.txIdPath=void 0,this.entityIdPath=void 0,this.path=`${e.pathToFolderId(t.parentFolderId)}${t.name}`,this.txIdPath=`${e.txPathToFolderId(t.parentFolderId)}${t.txId}`,this.entityIdPath=`${e.entityPathToFolderId(t.parentFolderId)}${t.folderId}`}}class _{constructor(t,e,i=[]){this.folderId=void 0,this.parent=void 0,this.children=void 0,this.folderId=t,this.parent=e,this.children=i}static fromEntity(t){return new _(t.entityId)}}class j{constructor(t,e){this.folderIdToEntityMap=void 0,this.folderIdToNodeMap=void 0,this._rootNode=void 0,this.folderIdToEntityMap=t,this.folderIdToNodeMap=e}static newFromEntities(t){const e=t.reduce((t,e)=>Object.assign(t,{[`${e.entityId}`]:e}),{}),i={};for(const r of t)this.setupNodesWithEntity(r,e,i);return new j(e,i)}static setupNodesWithEntity(t,e,i){const r=Object.keys(i).includes(`${t.entityId}`),s=Object.keys(i).includes(`${t.parentFolderId}`);if(!r){if(!s){const r=e[`${t.parentFolderId}`];r&&this.setupNodesWithEntity(r,e,i)}const r=i[`${t.parentFolderId}`];if(r){const e=new _(t.entityId,r);r.children.push(e),i[`${t.entityId}`]=e}else{const e=new _(t.entityId);i[`${t.entityId}`]=e}}}get rootNode(){if(this._rootNode)return this._rootNode;const t=Object.keys(this.folderIdToEntityMap)[0];let e=this.folderIdToNodeMap[t];for(;e.parent&&this.folderIdToNodeMap[`${e.parent.folderId}`];)e=e.parent;return this._rootNode=e,e}subTreeOf(t,e=Number.MAX_SAFE_INTEGER){const i=this.nodeAndChildrenOf(this.folderIdToNodeMap[`${t}`],e),r=i.reduce((t,e)=>Object.assign(t,{[`${e.folderId}`]:this.folderIdToEntityMap[`${e.folderId}`]}),{}),s=i.reduce((t,e)=>Object.assign(t,{[`${e.folderId}`]:e}),{});return new j(r,s)}allFolderIDs(){return Object.keys(this.folderIdToEntityMap).map(t=>m(t))}nodeAndChildrenOf(t,e){const i=[t];return e>0&&t.children.forEach(t=>{i.push(...this.nodeAndChildrenOf(t,e-1))}),i}folderIdSubtreeFromFolderId(t,e){const i=this.folderIdToNodeMap[`${t}`],r=[i.folderId];return 0===e||i.children.map(t=>t.folderId).forEach(t=>{r.push(...this.folderIdSubtreeFromFolderId(t,e-1))}),r}pathToFolderId(t){if(this.rootNode.parent)throw new Error("Can't compute paths from sub-tree");if(`${t}`===W)return"/";let e=this.folderIdToNodeMap[`${t}`];const i=[e];for(;e.parent&&!e.folderId.equals(this.rootNode.folderId);)e=e.parent,i.push(e);return`/${i.reverse().map(t=>this.folderIdToEntityMap[`${t.folderId}`].name).join("/")}/`}entityPathToFolderId(t){if(this.rootNode.parent)throw new Error("Can't compute paths from sub-tree");if(`${t}`===W)return"/";let e=this.folderIdToNodeMap[`${t}`];const i=[e];for(;e.parent&&!e.folderId.equals(this.rootNode.folderId);)e=e.parent,i.push(e);return`/${i.reverse().map(t=>t.folderId).join("/")}/`}txPathToFolderId(t){if(this.rootNode.parent)throw new Error("Can't compute paths from sub-tree");if(`${t}`===W)return"/";let e=this.folderIdToNodeMap[`${t}`];const i=[e];for(;e.parent&&!e.folderId.equals(this.rootNode.folderId);)e=e.parent,i.push(e);return`/${i.reverse().map(t=>this.folderIdToEntityMap[`${t.folderId}`].txId).join("/")}/`}}class J extends T{constructor(...t){super(...t),this.protectedDataJsonKeys=["name"]}async parseFromArweaveNode(t){return(await super.parseFromArweaveNode(t)).filter(t=>"Folder-Id"!==t.name)}getGqlQueryParameters(){return[{name:"Folder-Id",value:`${this.entityId}`},{name:"Entity-Type",value:"folder"}]}}class G extends v{constructor(){super(`${it}`),this.entityId=W}}class K extends J{static fromArweaveNode(t,e){var i;const{tags:r}=t,s=null==(i=r.find(t=>"Folder-Id"===t.name))?void 0:i.value;if(!s)throw new Error("Folder-ID tag missing!");return new K({entityId:m(s),gatewayApi:e})}async buildEntity(){var t,e,i,r,s;if(this.parentFolderId||(this.parentFolderId=new G),null!=(t=this.appName)&&t.length&&null!=(e=this.appVersion)&&e.length&&null!=(i=this.arFS)&&i.length&&null!=(r=this.contentType)&&r.length&&this.driveId&&null!=(s=this.entityType)&&s.length&&this.txId&&this.unixTime&&this.parentFolderId&&this.entityId&&"folder"===this.entityType){const t=await this.getDataForTxID(this.txId),e=await E(t),i=await JSON.parse(e);if(this.name=i.name,!this.name)throw new Error("Invalid public folder state: name not found!");return this.parseCustomMetaDataFromDataJson(i),Promise.resolve(new V(this.appName,this.appVersion,this.arFS,this.contentType,this.driveId,this.name,this.txId,this.unixTime,this.parentFolderId,this.entityId,this.customMetaData.metaDataGqlTags,this.customMetaData.metaDataJson))}throw new Error("Invalid public folder state")}}const B="application/json",U={name:"Content-Type",value:"application/octet-stream"},z={name:"Cipher",value:"AES256-GCM"},L={name:"Cipher-IV",value:"qwertyuiopasdfgh"},Q="arweave.net",H="https",W="root folder",Y="ENCRYPTED",Z=500,X=["invalid_json","chunk_too_big","data_path_too_big","offset_too_big","data_size_too_big","chunk_proof_ratio_not_attractive","invalid_proof"],tt={arFS:"ArFS",tipType:"Tip-Type",contentType:"Content-Type",boost:"Boost",bundleFormat:"Bundle-Format",bundleVersion:"Bundle-Version",entityType:"Entity-Type",unitTime:"Unix-Time",driveId:"Drive-Id",folderId:"Folder-Id",fileId:"File-Id",parentFolderId:"Parent-Folder-Id",drivePrivacy:"Drive-Privacy",cipher:"Cipher",cipherIv:"Cipher-IV",driveAuthMode:"Drive-Auth-Mode"},et=new u("0000000000000000000000000000000000000000000"),it=m("00000000-0000-0000-0000-000000000000");class rt extends w{constructor(t,e,i,r,s,a,n,o,d,h,c,l,u){super(t,e,i,r,s,a,n,o,d,l,u),this.appName=void 0,this.appVersion=void 0,this.arFS=void 0,this.contentType=void 0,this.driveId=void 0,this.entityType=void 0,this.name=void 0,this.txId=void 0,this.unixTime=void 0,this.drivePrivacy=void 0,this.rootFolderId=void 0,this.appName=t,this.appVersion=e,this.arFS=i,this.contentType=r,this.driveId=s,this.entityType=a,this.name=n,this.txId=o,this.unixTime=d,this.drivePrivacy=h,this.rootFolderId=c}}class st extends w{constructor(t,e,i,r,s,a,n,o,d,h,c,l,u,p,y,v,m){super(t,e,i,r,s,a,n,o,d,v,m),this.appName=void 0,this.appVersion=void 0,this.arFS=void 0,this.contentType=void 0,this.driveId=void 0,this.entityType=void 0,this.name=void 0,this.txId=void 0,this.unixTime=void 0,this.drivePrivacy=void 0,this.rootFolderId=void 0,this.driveAuthMode=void 0,this.cipher=void 0,this.cipherIV=void 0,this.driveKey=void 0,this.appName=t,this.appVersion=e,this.arFS=i,this.contentType=r,this.driveId=s,this.entityType=a,this.name=n,this.txId=o,this.unixTime=d,this.drivePrivacy=h,this.rootFolderId=c,this.driveAuthMode=l,this.cipher=u,this.cipherIV=p,this.driveKey=y}}class at extends F{constructor(...t){super(...t),this.protectedDataJsonKeys=["name","rootFolderId"]}}class nt extends at{constructor(...t){super(...t),this.drivePrivacy=void 0,this.rootFolderId=void 0}static fromArweaveNode(t,e){var i;const{tags:r}=t,s=null==(i=r.find(t=>"Drive-Id"===t.name))?void 0:i.value;if(!s)throw new Error("Drive-ID tag missing!");return new nt({entityId:m(s),gatewayApi:e})}getGqlQueryParameters(){return[{name:"Drive-Id",value:`${this.entityId}`},{name:"Entity-Type",value:"drive"},{name:"Drive-Privacy",value:"public"}]}async parseFromArweaveNode(t){const e=[];return(await super.parseFromArweaveNode(t)).forEach(t=>{const i=t.name,{value:r}=t;"Drive-Privacy"===i?this.drivePrivacy=r:e.push(t)}),e}async buildEntity(){var t,e,i,r,s,a;if(null!=(t=this.appName)&&t.length&&null!=(e=this.appVersion)&&e.length&&null!=(i=this.arFS)&&i.length&&null!=(r=this.contentType)&&r.length&&this.driveId&&null!=(s=this.entityType)&&s.length&&this.txId&&this.unixTime&&this.driveId.equals(this.entityId)&&null!=(a=this.drivePrivacy)&&a.length){const t=await this.getDataForTxID(this.txId),e=await E(t),i=await JSON.parse(e);if(this.name=i.name,this.rootFolderId=i.rootFolderId,!this.name||!this.rootFolderId)throw new Error("Invalid drive state");return this.parseCustomMetaDataFromDataJson(i),new rt(this.appName,this.appVersion,this.arFS,this.contentType,this.driveId,this.entityType,this.name,this.txId,this.unixTime,this.drivePrivacy,this.rootFolderId,this.customMetaData.metaDataGqlTags,this.customMetaData.metaDataJson)}throw new Error("Invalid drive state")}}class ot extends at{constructor({entityId:t,privateKeyData:e,gatewayApi:i}){super({entityId:t,gatewayApi:i}),this.drivePrivacy=void 0,this.rootFolderId=void 0,this.driveAuthMode=void 0,this.cipher=void 0,this.cipherIV=void 0,this.privateKeyData=void 0,this.privateKeyData=e}getGqlQueryParameters(){return[{name:"Drive-Id",value:`${this.entityId}`},{name:"Entity-Type",value:"drive"}]}static fromArweaveNode(t,e,i){var r;const{tags:s}=t,a=null==(r=s.find(t=>"Drive-Id"===t.name))?void 0:r.value;if(!a)throw new Error("Drive-ID tag missing!");return new ot({entityId:m(a),privateKeyData:i,gatewayApi:e})}async parseFromArweaveNode(t){const e=[];return(await super.parseFromArweaveNode(t)).forEach(t=>{const i=t.name,{value:r}=t;switch(i){case"Cipher":this.cipher=r;break;case"Cipher-IV":this.cipherIV=r;break;case"Drive-Auth-Mode":this.driveAuthMode=r;break;case"Drive-Privacy":this.drivePrivacy=r;break;default:e.push(t)}}),e}async buildEntity(){var t,e,i,r,s,a,n=this;if(null!=(t=this.appName)&&t.length&&null!=(e=this.appVersion)&&e.length&&null!=(i=this.arFS)&&i.length&&null!=(r=this.contentType)&&r.length&&this.driveId&&null!=(s=this.entityType)&&s.length&&this.txId&&this.unixTime&&null!=(a=this.drivePrivacy)&&a.length){const t="private"===this.drivePrivacy,e=await this.getDataForTxID(this.txId),i=Buffer.from(e),r=await async function(){if(t){var r,s,a;if(null!=(r=n.cipher)&&r.length&&null!=(s=n.driveAuthMode)&&s.length&&null!=(a=n.cipherIV)&&a.length)return n.privateKeyData.safelyDecryptToJson(n.cipherIV,n.entityId,i,{name:Y,rootFolderId:Y});throw new Error("Invalid private drive state")}const o=await E(e);return JSON.parse(o)}();if(this.name=r.name,this.rootFolderId=m(r.rootFolderId),this.parseCustomMetaDataFromDataJson(r),t){if(!this.driveAuthMode||!this.cipher||!this.cipherIV)throw new Error(`Unexpectedly null privacy data for private drive with ID ${this.driveId}!`);return new dt(this.appName,this.appVersion,this.arFS,this.contentType,this.driveId,this.entityType,this.name,this.txId,this.unixTime,this.drivePrivacy,this.rootFolderId,this.driveAuthMode,this.cipher,this.cipherIV,this.customMetaData.metaDataGqlTags,this.customMetaData.metaDataJson)}return new rt(this.appName,this.appVersion,this.arFS,this.contentType,this.driveId,this.entityType,this.name,this.txId,this.unixTime,this.drivePrivacy,this.rootFolderId,this.customMetaData.metaDataGqlTags,this.customMetaData.metaDataJson)}throw new Error("Invalid drive state")}}class dt extends st{constructor(t,e,i,r,s,a,n,o,d,h,c,l,u,p,y,v){super(t,e,i,r,s,a,n,o,d,h,c,l,u,p,new f(Buffer.from([])),y,v),this.driveKey=void 0,this.driveKey=new f(Buffer.from([])),delete this.driveKey}}class ht{constructor(t,e=C,i=new s({gatewayUrl:x(t)})){this.caches=void 0,this.gatewayApi=void 0,this._arweave=void 0,this._gatewayApi=void 0,this._caches=void 0,this.appName=void 0,this.appVersion=void 0,this.caches=e,this.gatewayApi=i,this._arweave=t,this._gatewayApi=i,this._caches=e,this.appName="ArFS",this.appVersion="0.0.1"}async getOwnerForDriveId(t){var e=this;return await this.caches.ownerCache.get(t)||this.caches.ownerCache.put(t,async function(){const i=D({tags:[{name:"Drive-Id",value:`${t}`},{name:"Entity-Type",value:"drive"}],sort:"HEIGHT_ASC"}),r=(await e.gatewayApi.gqlRequest(i)).edges;if(!r.length)throw new Error(`Could not find a transaction with "Drive-Id": ${t}`);return p(r[0].node.owner.address)}())}async getDriveIDForEntityId(t,e){var i=this;return await this.caches.driveIdCache.get(t)||this.caches.driveIdCache.put(t,async function(){const r=D({tags:[{name:e,value:`${t}`}]}),s=(await i.gatewayApi.gqlRequest(r)).edges;if(!s.length)throw new Error(`Entity with ${e} ${t} not found!`);const a=s[0].node.tags.find(t=>"Drive-Id"===t.name);if(a)return m(a.value);throw new Error(`No Drive-Id tag found for meta data transaction of ${e}: ${t}`)}())}async getDriveOwnerForFolderId(t){return this.getOwnerForDriveId(await this.getDriveIdForFolderId(t))}async getDriveIdForFolderId(t){return this.getDriveIDForEntityId(t,"Folder-Id")}async getDriveOwnerForFileId(t){return this.getOwnerForDriveId(await this.getDriveIdForFileId(t))}async getDriveIdForFileId(t){return this.getDriveIDForEntityId(t,"File-Id")}async getDriveIdForEntityID(t){return this.getDriveIDForEntityId(t,"Folder-Id")}async getPublicDrive({driveId:t,owner:e}){const i={driveId:t,owner:e};return await this.caches.publicDriveCache.get(i)||await this.caches.publicDriveCache.put(i,new nt({entityId:t,gatewayApi:this.gatewayApi,owner:e}).build())}async getPublicFolder({folderId:t,owner:e}){const i={folderId:t,owner:e};return await this.caches.publicFolderCache.get(i)||await this.caches.publicFolderCache.put(i,new K({entityId:t,gatewayApi:this.gatewayApi,owner:e}).build())}async getPublicFile({fileId:t,owner:e}){const i={fileId:t,owner:e};return await this.caches.publicFileCache.get(i)||await this.caches.publicFileCache.put(i,new R({entityId:t,gatewayApi:this.gatewayApi,owner:e}).build())}async getAllDrivesForAddress({address:t,privateKeyData:e,latestRevisionsOnly:i=!0}){var r=this;let s="",a=!0;const n=[];for(;a;){const i=D({tags:[{name:"Entity-Type",value:"drive"}],cursor:s,owner:t}),o=await this.gatewayApi.gqlRequest(i),{edges:d}=o;a=o.pageInfo.hasNextPage;const h=d.map(async function(i){const{node:a}=i;s=i.cursor;const n=ot.fromArweaveNode(a,r.gatewayApi,e),o=await n.build(a);return"public"===o.drivePrivacy?r.caches.publicDriveCache.put({driveId:o.driveId,owner:t},Promise.resolve(o)):Promise.resolve(o)});n.push(...await Promise.all(h))}return i?n.filter(A):n}async getPublicFilesWithParentFolderIds(t,e,i=!1){var r=this;let s="",a=!0;const n=[];for(;a;){const i=D({tags:[{name:"Parent-Folder-Id",value:t.map(t=>t.toString())},{name:"Entity-Type",value:"file"}],cursor:s,owner:e}),o=await this.gatewayApi.gqlRequest(i),{edges:d}=o;a=o.pageInfo.hasNextPage;const h=d.map(async function(t){const{node:i}=t;s=t.cursor;const a=R.fromArweaveNode(i,r.gatewayApi),o=await a.build(i),d={fileId:o.fileId,owner:e};return n.push(o),r.caches.publicFileCache.put(d,Promise.resolve(o))});await Promise.all(h)}return i?n.filter(P):n}async getAllFoldersOfPublicDrive({driveId:t,owner:e,latestRevisionsOnly:i=!1}){var r=this;let s="",a=!0;const n=[];for(;a;){const i=D({tags:[{name:"Drive-Id",value:`${t}`},{name:"Entity-Type",value:"folder"}],cursor:s,owner:e}),o=await this.gatewayApi.gqlRequest(i),{edges:d}=o;a=o.pageInfo.hasNextPage;const h=d.map(async function(t){const{node:i}=t;s=t.cursor;const a=K.fromArweaveNode(i,r.gatewayApi),n=await a.build(i);return r.caches.publicFolderCache.put({folderId:n.entityId,owner:e},Promise.resolve(n))});n.push(...await Promise.all(h))}return i?n.filter(P):n}async listPublicFolder({folderId:t,maxDepth:e,includeRoot:i,owner:r}){if(!Number.isInteger(e)||e<0)throw new Error("maxDepth should be a non-negative integer!");const s=await this.getPublicFolder({folderId:t,owner:r}),a=s.driveId,n=await this.getAllFoldersOfPublicDrive({driveId:a,owner:r,latestRevisionsOnly:!0}),o=j.newFromEntities(n),d=o.folderIdSubtreeFromFolderId(t,e),[,...h]=o.folderIdSubtreeFromFolderId(t,e+1),c=n.filter(t=>h.some(e=>e.equals(t.entityId)));i&&c.unshift(s);const l=[];for(const t of d)(await this.getPublicFilesWithParentFolderIds([t],r,!0)).forEach(t=>{l.push(t)});const u=[];for(const t of c)u.push(t);for(const t of l)u.push(t);const p=u.map(t=>function(t,e){return"folder"===t.entityType?new k(t,e):new q(t,e)}(t,o));return p}}export{ht as ArFSClient};
