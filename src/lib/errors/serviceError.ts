import { AppError } from './appError';
import type { ServiceErrorOptions } from './types';
import type { ErrorCode } from './codes';

export class ServiceError extends AppError {
  public readonly code: string;

  /**
   * Constructs a new ServiceError.
   * @param errorCode - The predefined error code object from ERROR_CODES.
   * @param options - Optional parameters to provide a cause, override message, or add metadata.
   */
  constructor(errorCode: ErrorCode, options: ServiceErrorOptions = {}) {
    const message = options.overrideMessage || errorCode.message;

    super(message, errorCode.httpStatus, {
      cause: options.cause,
      metadata: {
        code: errorCode.code,
        ...options.metadata
      },
    });

    this.name = 'ServiceError';
    this.code = errorCode.code;
  }
}
