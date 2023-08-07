import GenUtils from "../../common/GenUtils";
import MoneroError from "../../common/MoneroError";
import MoneroNetworkType from "../../daemon/model/MoneroNetworkType";
import MoneroRpcConnection from "../../common/MoneroRpcConnection";

/**
 * Configuration to create a Monero wallet.
 */
class MoneroWalletConfig {
  
  /**
   * Construct a configuration to open or create a wallet.
   * 
   * @param {object|MoneroWalletConfig} config - MoneroWalletConfig or equivalent config object
   * @param {string} [config.path] - path of the wallet to open or create
   * @param {string} config.password - password of the wallet to open
   * @param {string|number} config.networkType - network type of the wallet to open (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
   * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
   * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
   * @param {boolean} [config.isMultisig] - restore multisig wallet from seed
   * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
   * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
   * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
   * @param {number} [config.restoreHeight] - block height to start scanning from (defaults to 0 unless generating random wallet)
   * @param {string} [config.language] - language of the wallet's seed phrase (defaults to "English" or auto-detected)
   * @param {number} [config.accountLookahead] -  number of accounts to scan (optional)
   * @param {number} [config.subaddressLookahead] - number of subaddresses to scan per account (optional)
   * @param {string} [config.serverUri] - uri of the wallet's server (optional)
   * @param {string} [config.serverUsername] - username of the wallet's server (optional)
   * @param {string} [config.serverPassword] - password of the wallet's server (optional)
   * @param {boolean} [config.rejectUnauthorized] - reject self-signed server certificates if true (default true)
   * @param {MoneroRpcConnection|object} [config.server] - MoneroRpcConnection or equivalent JS object configuring the server connection (optional)
   * @param {Uint8Array} [config.keysData] - wallet keys data to open (optional)
   * @param {Uint8Array} [config.cacheData] - wallet cache data to open (optional)
   * @param {boolean} [config.proxyToWorker] - proxies wallet operations to a worker in order to not block the main thread (default true)
   * @param {fs} [config.fs] - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
   * @param {boolean} [config.saveCurrent] - specifies if the current RPC wallet should be saved before being closed
   * @param {number} [config.accountLookahead] - number of accounts to scan (optional)
   * @param {number} [config.subaddressLookahead] - number of subaddresses to scan per account (optional)
   */
  constructor(config) {
    
    // initialize internal config
    if (!config) config = {};
    else if (config instanceof MoneroWalletConfig) config = config.toJson();
    else if (typeof config === "object") config = Object.assign({}, config);
    else throw new MoneroError("config must be a MoneroWalletConfig or JavaScript object");
    this.config = config;
    
    // normalize config
    this.setNetworkType(config.networkType);
    if (config.server) this.setServer(config.server);
    delete this.config.server;
    
    // check for unsupported fields
    for (let key of Object.keys(this.config)) {
      if (!GenUtils.arrayContains(MoneroWalletConfig.SUPPORTED_FIELDS, key)) {
        throw new MoneroError("Unsupported field in MoneroWalletConfig: '" + key + "'");
      }
    }
  }

  copy() {
    return new MoneroWalletConfig(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.config);
    json.fs = undefined; // remove filesystem
    return json;
  }
  
  getPath() {
    return this.config.path;
  }
  
  setPath(path) {
    this.config.path = path;
    return this;
  }
  
  getPassword() {
    return this.config.password;
  }
  
  setPassword(password) {
    this.config.password = password;
    return this;
  }
  
  getNetworkType() {
    return this.config.networkType;
  }
  
  setNetworkType(networkTypeOrStr) {
    this.config.networkType = typeof networkTypeOrStr === "string" ? MoneroNetworkType.parse(networkTypeOrStr) : networkTypeOrStr;
    return this;
  }
  
  getServer() {
    return !this.config.serverUri ? undefined : new MoneroRpcConnection({uri: this.config.serverUri, username: this.config.serverUsername, password: this.config.serverPassword, rejectUnauthorized: this.config.rejectUnauthorized})
  }
  
  setServer(server) {
    if (server && !(server instanceof MoneroRpcConnection)) server = new MoneroRpcConnection(server);
    this.config.serverUri = server === undefined ? undefined : server.getUri();
    this.config.serverUsername = server === undefined ? undefined : server.getUsername();
    this.config.serverPassword = server === undefined ? undefined : server.getPassword();
    this.config.rejectUnauthorized = server === undefined ? undefined : server.getRejectUnauthorized();
    return this;
  }
  
  getServerUri() {
    return this.config.serverUri;
  }
  
  setServerUri(serverUri) {
    this.config.serverUri = serverUri;
    return this;
  }
  
  getServerUsername() {
    return this.config.serverUsername;
  }
  
  setServerUsername(serverUsername) {
    this.config.serverUsername = serverUsername;
    return this;
  }
  
  getServerPassword() {
    return this.config.serverPassword;
  }
  
  setServerPassword(serverPassword) {
    this.config.serverPassword = serverPassword;
    return this;
  }
  
  getRejectUnauthorized() {
    return this.config.rejectUnauthorized;
  }
  
  setRejectUnauthorized(rejectUnauthorized) {
    this.config.rejectUnauthorized = rejectUnauthorized;
    return this;
  }
  
  getSeed() {
    return this.config.seed;
  }
  
  setSeed(seed) {
    this.config.seed = seed;
    return this;
  }
  
  getSeedOffset() {
    return this.config.seedOffset;
  }
  
  setSeedOffset(seedOffset) {
    this.config.seedOffset = seedOffset;
    return this;
  }

  isMultisig() {
    return this.config.isMultisig;
  }
  
  setIsMultisig(isMultisig) {
    this.config.isMultisig = isMultisig;
    return this;
  }
  
  getPrimaryAddress() {
    return this.config.primaryAddress;
  }
  
  setPrimaryAddress(primaryAddress) {
    this.config.primaryAddress = primaryAddress;
    return this;
  }
  
  getPrivateViewKey() {
    return this.config.privateViewKey;
  }
  
  setPrivateViewKey(privateViewKey) {
    this.config.privateViewKey = privateViewKey;
    return this;
  }
  
  getPrivateSpendKey() {
    return this.config.privateSpendKey;
  }
  
  setPrivateSpendKey(privateSpendKey) {
    this.config.privateSpendKey = privateSpendKey;
    return this;
  }
  
  getRestoreHeight() {
    return this.config.restoreHeight;
  }
  
  setRestoreHeight(restoreHeight) {
    this.config.restoreHeight = restoreHeight;
    return this;
  }
  
  getLanguage() {
    return this.config.language;
  }
  
  setLanguage(language) {
    this.config.language = language;
    return this;
  }
  
  getSaveCurrent() {
    return this.config.saveCurrent;
  }
  
  setSaveCurrent(saveCurrent) {
    this.config.saveCurrent = saveCurrent;
    return this;
  }
  
  getProxyToWorker() {
    return this.config.proxyToWorker;
  }
  
  setProxyToWorker(proxyToWorker) {
    this.config.proxyToWorker = proxyToWorker;
    return this;
  }
  
  getFs() {
    return this.config.fs;
  }
  
  setFs(fs) {
    this.config.fs = fs;
    return this;
  }
  
  getKeysData() {
    return this.config.keysData;
  }
  
  setKeysData(keysData) {
    this.config.keysData = keysData;
    return this;
  }
  
  getCacheData() {
    return this.config.cacheData;
  }
  
  setCacheData(cacheData) {
    this.config.cacheData = cacheData;
    return this;
  }
  
  getAccountLookahead() {
    return this.config.accountLookahead;
  }
  
  setAccountLookahead(accountLookahead) {
    this.config.accountLookahead = accountLookahead;
    return this;
  }
  
  getSubaddressLookahead() {
    return this.config.subaddressLookahead;
  }
  
  setSubaddressLookahead(subaddressLookahead) {
    this.config.subaddressLookahead = subaddressLookahead;
    return this;
  }
}

MoneroWalletConfig.SUPPORTED_FIELDS = ["path", "password", "networkType", "serverUri", "serverUsername", "serverPassword", "rejectUnauthorized", "seed", "seedOffset", "isMultisig", "primaryAddress", "privateViewKey", "privateSpendKey", "restoreHeight", "language", "saveCurrent", "proxyToWorker", "fs", "keysData", "cacheData", "accountLookahead", "subaddressLookahead"];

export default MoneroWalletConfig;
