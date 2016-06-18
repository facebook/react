import {ChangeDetectorRef, OnDestroy, Pipe, WrappedValue} from '@angular/core';
import {EventEmitter, Observable, ObservableWrapper} from '../facade/async';
import {isBlank, isPresent, isPromise} from '../facade/lang';
import {InvalidPipeArgumentException} from './invalid_pipe_argument_exception';

interface SubscriptionStrategy {
  createSubscription(async: any, updateLatestValue: any): any;
  dispose(subscription: any): void;
  onDestroy(subscription: any): void;
}

class ObservableStrategy implements SubscriptionStrategy {
  createSubscription(async: any, updateLatestValue: any): any {
    return ObservableWrapper.subscribe(async, updateLatestValue, e => { throw e; });
  }

  dispose(subscription: any): void { ObservableWrapper.dispose(subscription); }

  onDestroy(subscription: any): void { ObservableWrapper.dispose(subscription); }
}

class PromiseStrategy implements SubscriptionStrategy {
  createSubscription(async: Promise<any>, updateLatestValue: (v: any) => any): any {
    return async.then(updateLatestValue, e => { throw e; });
  }

  dispose(subscription: any): void {}

  onDestroy(subscription: any): void {}
}

var _promiseStrategy = new PromiseStrategy();
var _observableStrategy = new ObservableStrategy();
var __unused: Promise<any>;  // avoid unused import when Promise union types are erased

/**
 * The `async` pipe subscribes to an `Observable` or `Promise` and returns the latest value it has
 * emitted.
 * When a new value is emitted, the `async` pipe marks the component to be checked for changes.
 * When the component gets destroyed, the `async` pipe unsubscribes automatically to avoid
 * potential memory leaks.
 *
 * ## Usage
 *
 *     object | async
 *
 * where `object` is of type `Observable` or of type `Promise`.
 *
 * ## Examples
 *
 * This example binds a `Promise` to the view. Clicking the `Resolve` button resolves the
 * promise.
 *
 * {@example core/pipes/ts/async_pipe/async_pipe_example.ts region='AsyncPipePromise'}
 *
 * It's also possible to use `async` with Observables. The example below binds the `time` Observable
 * to the view. Every 500ms, the `time` Observable updates the view with the current time.
 *
 * {@example core/pipes/ts/async_pipe/async_pipe_example.ts region='AsyncPipeObservable'}
 *
 * @stable
 */
@Pipe({name: 'async', pure: false})
export class AsyncPipe implements OnDestroy {
  /** @internal */
  _latestValue: Object = null;
  /** @internal */
  _latestReturnedValue: Object = null;

  /** @internal */
  _subscription: Object = null;
  /** @internal */
  _obj: Observable<any>|Promise<any>|EventEmitter<any> = null;
  /** @internal */
  _ref: ChangeDetectorRef;
  private _strategy: SubscriptionStrategy = null;

  constructor(_ref: ChangeDetectorRef) { this._ref = _ref; }

  ngOnDestroy(): void {
    if (isPresent(this._subscription)) {
      this._dispose();
    }
  }

  transform(obj: Observable<any>|Promise<any>|EventEmitter<any>): any {
    if (isBlank(this._obj)) {
      if (isPresent(obj)) {
        this._subscribe(obj);
      }
      this._latestReturnedValue = this._latestValue;
      return this._latestValue;
    }

    if (obj !== this._obj) {
      this._dispose();
      return this.transform(obj);
    }

    if (this._latestValue === this._latestReturnedValue) {
      return this._latestReturnedValue;
    } else {
      this._latestReturnedValue = this._latestValue;
      return WrappedValue.wrap(this._latestValue);
    }
  }

  /** @internal */
  _subscribe(obj: Observable<any>|Promise<any>|EventEmitter<any>): void {
    this._obj = obj;
    this._strategy = this._selectStrategy(obj);
    this._subscription = this._strategy.createSubscription(
        obj, (value: Object) => this._updateLatestValue(obj, value));
  }

  /** @internal */
  _selectStrategy(obj: Observable<any>|Promise<any>|EventEmitter<any>): any {
    if (isPromise(obj)) {
      return _promiseStrategy;
    } else if (ObservableWrapper.isObservable(obj)) {
      return _observableStrategy;
    } else {
      throw new InvalidPipeArgumentException(AsyncPipe, obj);
    }
  }

  /** @internal */
  _dispose(): void {
    this._strategy.dispose(this._subscription);
    this._latestValue = null;
    this._latestReturnedValue = null;
    this._subscription = null;
    this._obj = null;
  }

  /** @internal */
  _updateLatestValue(async: any, value: Object) {
    if (async === this._obj) {
      this._latestValue = value;
      this._ref.markForCheck();
    }
  }
}
