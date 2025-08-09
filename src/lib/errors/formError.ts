import { AppError } from './appError';
import type { FormErrorOptions } from './types';
import type { ErrorCode } from './codes';


export class FormError extends AppError {
  public readonly code: string;
  public readonly form?: string;

  /**
   * Constructs a new AnilistError.
   * @param errorCode - The predefined error code object from ERROR_CODES.forms.
   * @param options - Optional parameters to provide a cause or add structured details.
   */
  constructor(errorCode: ErrorCode, options: FormErrorOptions = {}) {
    super(errorCode.message, errorCode.httpStatus, {
      cause: options.cause,
      metadata: {
        code: errorCode.code,
        form: options.form,
      },
    });

    this.name = 'FormError';
    this.code = errorCode.code;
    this.form = options.form
  }
}
