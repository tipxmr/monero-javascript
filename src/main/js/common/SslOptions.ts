/**
 * SSL options for remote endpoints.
 */

interface State {
  privateKeyPath: string;
  certificatePath: string;
  certificateAuthorityFile: string;
  allowedFingerprints: string[];
  allowAnyCert: boolean;
}

interface SslOptions {
  state: State;
}

class SslOptions {
  constructor(state: State) {
    this.state = Object.assign({}, state);
  }

  getPrivateKeyPath() {
    return this.state.privateKeyPath;
  }

  setPrivateKeyPath(privateKeyPath: string) {
    this.state.privateKeyPath = privateKeyPath;
    return this;
  }

  getCertificatePath() {
    return this.state.certificatePath;
  }

  setCertificatePath(certificatePath: string) {
    this.state.certificatePath = certificatePath;
    return this;
  }

  getCertificateAuthorityFile() {
    return this.state.certificateAuthorityFile;
  }

  setCertificateAuthorityFile(certificateAuthorityFile: string) {
    this.state.certificateAuthorityFile = certificateAuthorityFile;
    return this;
  }

  getAllowedFingerprints() {
    return this.state.allowedFingerprints;
  }

  setAllowedFingerprints(allowedFingerprints: string[]) {
    this.state.allowedFingerprints = allowedFingerprints;
    return this;
  }

  getAllowAnyCert() {
    return this.state.allowAnyCert;
  }

  setAllowAnyCert(allowAnyCert: boolean) {
    this.state.allowAnyCert = allowAnyCert;
    return this;
  }
}

export default SslOptions;
