export class MissingConfigError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
  }
}
