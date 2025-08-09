import type { AppErrorOptions } from './types';

export class AppError extends Error {
  public readonly httpStatus: number;
  public readonly timestamp: string;
  public readonly metadata: Record<string, unknown>;
  public readonly cause: unknown;

  /**
   * @param message - A human-readable description of the error.
   * @param httpStatus - The recommended HTTP status code for API responses (e.g., 400, 404, 502).
   * @param options - Optional parameters including the original `cause` and `metadata`.
   */
  constructor(message: string, httpStatus: number = 500, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });

    this.name = this.constructor.name;
    this.httpStatus = httpStatus;
    this.timestamp = new Date().toISOString(); // Use current time, not the provided one
    this.metadata = options.metadata || {};
    this.cause = options.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
