import {BaseWrappedException} from './base_wrapped_exception';
import {isListLikeIterable} from './collection';
import {isBlank, isPresent} from './lang';

class _ArrayLogger {
  res: any[] = [];
  log(s: any): void { this.res.push(s); }
  logError(s: any): void { this.res.push(s); }
  logGroup(s: any): void { this.res.push(s); }
  logGroupEnd(){};
}

/**
 * Provides a hook for centralized exception handling.
 *
 * The default implementation of `ExceptionHandler` prints error messages to the `Console`. To
 * intercept error handling,
 * write a custom exception handler that replaces this default as appropriate for your app.
 *
 * ### Example
 *
 * ```javascript
 *
 * class MyExceptionHandler implements ExceptionHandler {
 *   call(error, stackTrace = null, reason = null) {
 *     // do something with the exception
 *   }
 * }
 *
 * bootstrap(MyApp, {provide: ExceptionHandler, useClass: MyExceptionHandler}])
 *
 * ```
 * @stable
 */
export class ExceptionHandler {
  constructor(private _logger: any, private _rethrowException: boolean = true) {}

  static exceptionToString(exception: any, stackTrace: any = null, reason: string = null): string {
    var l = new _ArrayLogger();
    var e = new ExceptionHandler(l, false);
    e.call(exception, stackTrace, reason);
    return l.res.join('\n');
  }

  call(exception: any, stackTrace: any = null, reason: string = null): void {
    var originalException = this._findOriginalException(exception);
    var originalStack = this._findOriginalStack(exception);
    var context = this._findContext(exception);

    this._logger.logGroup(`EXCEPTION: ${this._extractMessage(exception)}`);

    if (isPresent(stackTrace) && isBlank(originalStack)) {
      this._logger.logError('STACKTRACE:');
      this._logger.logError(this._longStackTrace(stackTrace));
    }

    if (isPresent(reason)) {
      this._logger.logError(`REASON: ${reason}`);
    }

    if (isPresent(originalException)) {
      this._logger.logError(`ORIGINAL EXCEPTION: ${this._extractMessage(originalException)}`);
    }

    if (isPresent(originalStack)) {
      this._logger.logError('ORIGINAL STACKTRACE:');
      this._logger.logError(this._longStackTrace(originalStack));
    }

    if (isPresent(context)) {
      this._logger.logError('ERROR CONTEXT:');
      this._logger.logError(context);
    }

    this._logger.logGroupEnd();

    // We rethrow exceptions, so operations like 'bootstrap' will result in an error
    // when an exception happens. If we do not rethrow, bootstrap will always succeed.
    if (this._rethrowException) throw exception;
  }

  /** @internal */
  _extractMessage(exception: any): string {
    return exception instanceof BaseWrappedException ? exception.wrapperMessage :
                                                       exception.toString();
  }

  /** @internal */
  _longStackTrace(stackTrace: any): any {
    return isListLikeIterable(stackTrace) ? (<any[]>stackTrace).join('\n\n-----async gap-----\n') :
                                            stackTrace.toString();
  }

  /** @internal */
  _findContext(exception: any): any {
    try {
      if (!(exception instanceof BaseWrappedException)) return null;
      return isPresent(exception.context) ? exception.context :
                                            this._findContext(exception.originalException);
    } catch (e) {
      // exception.context can throw an exception. if it happens, we ignore the context.
      return null;
    }
  }

  /** @internal */
  _findOriginalException(exception: any): any {
    if (!(exception instanceof BaseWrappedException)) return null;

    var e = exception.originalException;
    while (e instanceof BaseWrappedException && isPresent(e.originalException)) {
      e = e.originalException;
    }

    return e;
  }

  /** @internal */
  _findOriginalStack(exception: any): any {
    if (!(exception instanceof BaseWrappedException)) return null;

    var e = exception;
    var stack = exception.originalStack;
    while (e instanceof BaseWrappedException && isPresent(e.originalException)) {
      e = e.originalException;
      if (e instanceof BaseWrappedException && isPresent(e.originalException)) {
        stack = e.originalStack;
      }
    }

    return stack;
  }
}
