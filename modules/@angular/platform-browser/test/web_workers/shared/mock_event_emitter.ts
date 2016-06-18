import {EventEmitter} from '../../../src/facade/async';

export class MockEventEmitter<T> extends EventEmitter<T> {
  private _nextFns: Function[] = [];

  constructor() { super(); }

  subscribe(generator: any): any {
    this._nextFns.push(generator.next);
    return new MockDisposable();
  }

  emit(value: any) { this._nextFns.forEach(fn => fn(value)); }
}

class MockDisposable {
  isUnsubscribed: boolean = false;
  unsubscribe(): void {}
}
