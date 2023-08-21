import MoneroError from "./MoneroError";

/**
 * Error when interacting with Monero RPC.
 */
class MoneroRpcError extends MoneroError {
  // is the rpc method invoked
  rpcMethod: string;
  // are parameters sent with the rpc request
  rpcParams: any;

  constructor(
    rpcDescription: string,
    rpcCode: number,
    rpcMethod: string,
    rpcParams: any
  ) {
    super(rpcDescription, rpcCode);
    this.rpcMethod = rpcMethod;
    this.rpcParams = rpcParams;
  }

  getRpcMethod() {
    return this.rpcMethod;
  }

  getRpcParams() {
    return this.rpcParams;
  }

  toString() {
    let str = super.toString();
    if (this.rpcMethod || this.rpcParams)
      str +=
        "\nRequest: '" +
        this.rpcMethod +
        "' with params: " +
        (typeof this.rpcParams === "object"
          ? JSON.stringify(this.rpcParams)
          : this.rpcParams);
    return str;
  }
}

export default MoneroRpcError;
