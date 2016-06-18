import {BaseWrappedException} from './base_wrapped_exception';
import {ExceptionHandler} from './exception_handler';

export {ExceptionHandler} from './exception_handler';

/**
 * @stable
 */
export class BaseException extends Error {
  public stack: any;
  constructor(public message: string = '--') {
    super(message);
    this.stack = (<any>new Error(message)).stack;
  }

  toString(): string { return this.message; }
}

/**
 * Wraps an exception and provides additional context or information.
 * @stable
 */
export class WrappedException extends BaseWrappedException {
  private _wrapperStack: any;

  constructor(
      private _wrapperMessage: string, private _originalException: any /** TODO #9100 */,
      private _originalStack?: any /** TODO #9100 */, private _context?: any /** TODO #9100 */) {
    super(_wrapperMessage);
    this._wrapperStack = (<any>new Error(_wrapperMessage)).stack;
  }

  get wrapperMessage(): string { return this._wrapperMessage; }

  get wrapperStack(): any { return this._wrapperStack; }


  get originalException(): any { return this._originalException; }

  get originalStack(): any { return this._originalStack; }


  get context(): any { return this._context; }

  get message(): string { return ExceptionHandler.exceptionToString(this); }

  toString(): string { return this.message; }
}

export function makeTypeError(message?: string): Error {
  return new TypeError(message);
}

export function unimplemented(): any {
  throw new BaseException('unimplemented');
}
