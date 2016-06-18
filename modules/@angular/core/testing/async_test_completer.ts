import {PromiseCompleter} from '../src/facade/promise';

/**
 * Injectable completer that allows signaling completion of an asynchronous test. Used internally.
 */
export class AsyncTestCompleter {
  private _completer = new PromiseCompleter<any>();
  done(value?: any) { this._completer.resolve(value); }

  fail(error?: any, stackTrace?: string) { this._completer.reject(error, stackTrace); }

  get promise(): Promise<any> { return this._completer.promise; }
}
