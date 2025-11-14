export class BundlerError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'BundlerError';
  }
}

export class NetworkError extends BundlerError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends BundlerError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

