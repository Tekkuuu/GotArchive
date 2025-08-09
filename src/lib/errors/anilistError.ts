import { AppError } from './appError';
import type { AnilistErrorOptions } from './types';
import type { ErrorCode } from './codes';


export class AnilistError extends AppError {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  /**
   * Constructs a new AnilistError.
   * @param errorCode - The predefined error code object from ERROR_CODES.anilist.
   * @param options - Optional parameters to provide a cause or add structured details.
   */
  constructor(errorCode: ErrorCode, options: AnilistErrorOptions = {}) {
    super(errorCode.message, errorCode.httpStatus, {
      cause: options.cause,
      metadata: {
        code: errorCode.code,
        details: options.details,
      },
    });

    this.name = 'AnilistError';
    this.code = errorCode.code;
    this.details = options.details;
  }
}
