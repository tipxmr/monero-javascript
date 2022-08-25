const TestUtils = require("./utils/TestUtils");
const WalletSyncPrinter = require("./utils/WalletSyncPrinter");
const monerojs = require("../../index");
const MoneroConnectionManager = monerojs.MoneroConnectionManager;
const MoneroConnectionManagerListener = monerojs.MoneroConnectionManagerListener;
const MoneroRpcConnection = monerojs.MoneroRpcConnection;
const GenUtils = monerojs.GenUtils;

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // create in-memory wallet with mnemonic
    let walletFull = await monerojs.createWalletFull({
      password: "abctesting123",
      networkType: "mainnet",
      proxyToWorker: TestUtils.PROXY_TO_WORKER,
      rejectUnauthorized: false
    });
    
    console.log("Full wallet daemon height: " + await walletFull.getHeight());
    console.log("Full wallet mnemonic: " + await walletFull.getMnemonic());
    
    // initialize connection manager
    let connectionManager = new MoneroConnectionManager();
    await connectionManager.addConnection(new MoneroRpcConnection("https://fallacy.fiatfaucet.com:18089"));
    await connectionManager.addConnection(new MoneroRpcConnection("https://community.organic-meatballs.duckdns.org:443"));
    await connectionManager.checkConnections();
    await connectionManager.startCheckingConnection();

    // listen for connection changes
    let restoreHeight = undefined;
    connectionManager.addListener(new class extends MoneroConnectionManagerListener {
      async onConnectionChanged(connection) {
        console.log("connection changed: ");
        console.log(connection);
        try {
          if (connection && connection.isConnected()) {
            await walletFull.setDaemonConnection(connection);
            if (restoreHeight === undefined) {
              restoreHeight = await walletFull.getDaemonHeight() - 1;
            }
            await walletFull.setSyncHeight(restoreHeight);
            await walletFull.startSyncing(5000);
          } else {
            console.log("Not connected, stopping syncing");
            await walletFull.stopSyncing();
          }
        } catch (err) {
            console.error(err);
        }
      }
    });
    
    // change connections
    await connectionManager.setConnection("https://fallacy.fiatfaucet.com:18089");
    await GenUtils.waitFor(10000);
    await connectionManager.setConnection("https://community.organic-meatballs.duckdns.org:443");
    await GenUtils.waitFor(10000);
    
    await walletFull.close();
  });
});