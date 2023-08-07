import assert from "assert";
import LibraryUtils from "../common/LibraryUtils";
import MoneroError from "../common/MoneroError";
import MoneroNetworkType from "../daemon/model/MoneroNetworkType";
import MoneroSubaddress from "./model/MoneroSubaddress";
import MoneroUtils from "../common/MoneroUtils";
import MoneroVersion from "../daemon/model/MoneroVersion";
import MoneroWallet from "./MoneroWallet";
import MoneroWalletConfig from "./model/MoneroWalletConfig";

/**
 * Implements a MoneroWallet which only manages keys using WebAssembly.
 * 
 * @implements {MoneroWallet}
 * @hideconstructor
 */
class MoneroWalletKeys extends MoneroWallet {
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  /**
   * <p>Create a wallet using WebAssembly bindings to monero-project.</p>
   * 
   * <p>Example:</p>
   * 
   * <code>
   * let wallet = await MoneroWalletKeys.createWallet({<br>
   * &nbsp;&nbsp; password: "abc123",<br>
   * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
   * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon..."<br>
   * });
   * </code>
   * 
   * @param {MoneroWalletConfig|object} config - MoneroWalletConfig or equivalent config object
   * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
   * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
   * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
   * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
   * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
   * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
   * @param {string} [config.language] - language of the wallet's seed (defaults to "English" or auto-detected)
   * @return {MoneroWalletKeys} the created wallet
   */
  static async createWallet(config) {
    
    // normalize and validate config
    if (config === undefined) throw new MoneroError("Must provide config to create wallet");
    config = config instanceof MoneroWalletConfig ? config : new MoneroWalletConfig(config);
    if (config.getSeed() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined)) {
      throw new MoneroError("Wallet may be initialized with a seed or keys but not both");
    }
    if (config.getNetworkType() === undefined) throw new MoneroError("Must provide a networkType: 'mainnet', 'testnet' or 'stagenet'");
    if (config.getSaveCurrent() === true) throw new MoneroError("Cannot save current wallet when creating keys-only wallet");
    
    // create wallet
    if (config.getSeed() !== undefined) return MoneroWalletKeys._createWalletFromSeed(config);
    else if (config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined) return MoneroWalletKeys._createWalletFromKeys(config);
    else return MoneroWalletKeys._createWalletRandom(config);
  }
  
  static async _createWalletRandom(config) {

    // validate and sanitize params
    config = config.copy();
    if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot provide seedOffset when creating random wallet");
    if (config.getRestoreHeight() !== undefined) throw new MoneroError("Cannot provide restoreHeight when creating random wallet");
    MoneroNetworkType.validate(config.getNetworkType());
    if (config.getLanguage() === undefined) config.setLanguage("English");
    
    // load wasm module
    let module = await LibraryUtils.loadKeysModule();
    
    // queue call to wasm module
    return module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletKeys(cppAddress));
        };
        
        // create wallet in wasm and invoke callback when done
        module.create_keys_wallet_random(JSON.stringify(config.toJson()), callbackFn);
      });
    });
  }
  
  static async _createWalletFromSeed(config) {
    
    // validate and sanitize params
    MoneroNetworkType.validate(config.getNetworkType());
    if (config.getSeed() === undefined) throw Error("Must define seed to create wallet from");
    if (config.getSeedOffset() === undefined) config.setSeedOffset("");
    if (config.getLanguage() !== undefined) throw new MoneroError("Cannot provide language when creating wallet from seed");
    
    // load wasm module
    let module = await LibraryUtils.loadKeysModule();
    
    // queue call to wasm module
    return module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletKeys(cppAddress));
        };
        
        // create wallet in wasm and invoke callback when done
        module.create_keys_wallet_from_seed(JSON.stringify(config.toJson()), callbackFn);
      });
    });
  }
  
  static async _createWalletFromKeys(config) {
    
    // validate and sanitize params
    if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot provide seedOffset when creating wallet from keys");
    MoneroNetworkType.validate(config.getNetworkType());
    if (config.getPrimaryAddress() === undefined) config.setPrimaryAddress("");
    if (config.getPrivateViewKey() === undefined) config.setPrivateViewKey("");
    if (config.getPrivateSpendKey() === undefined) config.setPrivateSpendKey("");
    if (config.getLanguage() === undefined) config.setLanguage("English");
    
    // load wasm module
    let module = await LibraryUtils.loadKeysModule();
    
    // queue call to wasm module
    return module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletKeys(cppAddress));
        };
        
        // create wallet in wasm and invoke callback when done
        module.create_keys_wallet_from_keys(JSON.stringify(config.toJson()), callbackFn);
      });
    });
  }
  
  static async getSeedLanguages() {
    let module = await LibraryUtils.loadKeysModule();
    return module.queueTask(async function() {
      return JSON.parse(module.get_keys_wallet_seed_languages()).languages;
    });
  }
  
  // --------------------------- INSTANCE METHODS -----------------------------
  
  /**
   * Internal constructor which is given the memory address of a C++ wallet
   * instance.
   * 
   * This method should not be called externally but should be called through
   * static wallet creation utilities in this class.
   * 
   * @param {number} cppAddress - address of the wallet instance in C++
   */
  constructor(cppAddress) {
    super();
    this._cppAddress = cppAddress;
    this._module = LibraryUtils.getWasmModule();
    if (!this._module.create_full_wallet) throw new MoneroError("WASM module not loaded - create wallet instance using static utilities");  // static utilites pre-load wasm module
  }
  
  async addListener(listener) {
    throw new MoneroError("MoneroWalletKeys does not support adding listeners");
  }
  
  async removeListener(listener) {
    throw new MoneroError("MoneroWalletKeys does not support removing listeners");
  }
  
  async isViewOnly() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      return that._module.is_view_only(that._cppAddress);
    });
  }
  
  async isConnectedToDaemon() {
    return false;
  }
  
  async getVersion() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let versionStr = that._module.get_version(that._cppAddress);
      let versionJson = JSON.parse(versionStr);
      return new MoneroVersion(versionJson.number, versionJson.isRelease);
    });
  }
  
  /**
   * @ignore
   */
  getPath() {
    this._assertNotClosed();
    throw new MoneroError("MoneroWalletKeys does not support a persisted path");
  }
  
  async getSeed() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let resp = that._module.get_seed(that._cppAddress);
      const errorStr = "error: ";
      if (resp.indexOf(errorStr) === 0) throw new MoneroError(resp.substring(errorStr.length));
      return resp ? resp : undefined;
    });
  }
  
  async getSeedLanguage() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let resp = that._module.get_seed_language(that._cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorStr.length));
      return resp ? resp : undefined;
    });
  }

  async getPrivateSpendKey() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let resp = that._module.get_private_spend_key(that._cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorStr.length));
      return resp ? resp : undefined;
    });
  }
  
  async getPrivateViewKey() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let resp = that._module.get_private_view_key(that._cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorStr.length));
      return resp ? resp : undefined;
    });
  }
  
  async getPublicViewKey() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let resp = that._module.get_public_view_key(that._cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorStr.length));
      return resp ? resp : undefined;
    });
  }
  
  async getPublicSpendKey() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let resp = that._module.get_public_spend_key(that._cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorStr.length));
      return resp ? resp : undefined;
    });
  }
  
  async getAddress(accountIdx, subaddressIdx) {
    this._assertNotClosed();
    assert(typeof accountIdx === "number");
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      return that._module.get_address(that._cppAddress, accountIdx, subaddressIdx);
    });
  }
  
  async getAddressIndex(address) {
    this._assertNotClosed();
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let resp = that._module.get_address_index(that._cppAddress, address);
      if (resp.charAt(0) !== '{') throw new MoneroError(resp);
      return new MoneroSubaddress(JSON.parse(resp));
    });
  }
  
  getAccounts() {
    this._assertNotClosed();
    throw new MoneroError("MoneroWalletKeys does not support getting an enumerable set of accounts; query specific accounts");
  }
  
  // getIntegratedAddress(paymentId)  // TODO
  // decodeIntegratedAddress
  
  async close(save) {
    if (this._isClosed) return; // closing a closed wallet has no effect
    
    // save wallet if requested
    if (save) await this.save();
    
    // queue task to use wasm module
    let that = this;
    return that._module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        if (that._isClosed) {
          resolve();
          return;
        }
        
        // define callback for wasm
        let callbackFn = async function() {
          delete that._cppAddress;
          that._isClosed = true;
          resolve();
        };
        
        // close wallet in wasm and invoke callback when done
        that._module.close(that._cppAddress, false, callbackFn);  // saving handled external to webassembly
      });
    });
  }
  
  async isClosed() {
    return this._isClosed;
  }
  
  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------
  
  async getPrimaryAddress() { return super.getPrimaryAddress(...arguments); }
  async getSubaddress() { return super.getSubaddress(...arguments); }
  
  // ----------------------------- PRIVATE HELPERS ----------------------------
  
  _assertNotClosed() {
    if (this._isClosed) throw new MoneroError("Wallet is closed");
  }
}

export default MoneroWalletKeys;
