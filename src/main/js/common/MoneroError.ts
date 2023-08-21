/**
 * Exception when interacting with a Monero wallet or daemon.
 */
class MoneroError extends Error {
  // is the error code (optional)
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }

  getCode() {
    return this.code;
  }

  toString() {
    if (this.message === undefined && this.getCode() === undefined)
      return super.message;
    let str = "";
    if (this.getCode() !== undefined) str += this.getCode() + ": ";
    str += this.message;
    return str;
  }
}

export default MoneroError;
