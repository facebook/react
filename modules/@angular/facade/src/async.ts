import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {PromiseObservable} from 'rxjs/observable/PromiseObservable';
import {toPromise} from 'rxjs/operator/toPromise';

import {global, noop} from './lang';

export {Observable} from 'rxjs/Observable';
export {Subject} from 'rxjs/Subject';
export {PromiseCompleter, PromiseWrapper} from './promise';

export class TimerWrapper {
  static setTimeout(fn: (...args: any[]) => void, millis: number): number {
    return global.setTimeout(fn, millis);
  }
  static clearTimeout(id: number): void { global.clearTimeout(id); }

  static setInterval(fn: (...args: any[]) => void, millis: number): number {
    return global.setInterval(fn, millis);
  }
  static clearInterval(id: number): void { global.clearInterval(id); }
}

export class ObservableWrapper {
  // TODO(vsavkin): when we use rxnext, try inferring the generic type from the first arg
  static subscribe<T>(
      emitter: any, onNext: (value: T) => void, onError?: (exception: any) => void,
      onComplete: () => void = () => {}): Object {
    onError = (typeof onError === 'function') && onError || noop;
    onComplete = (typeof onComplete === 'function') && onComplete || noop;
    return emitter.subscribe({next: onNext, error: onError, complete: onComplete});
  }

  static isObservable(obs: any): boolean { return !!obs.subscribe; }

  /**
   * Returns whether `obs` has any subscribers listening to events.
   */
  static hasSubscribers(obs: EventEmitter<any>): boolean { return obs.observers.length > 0; }

  static dispose(subscription: any) { subscription.unsubscribe(); }

  /**
   * @deprecated - use callEmit() instead
   */
  static callNext(emitter: EventEmitter<any>, value: any) { emitter.next(value); }

  static callEmit(emitter: EventEmitter<any>, value: any) { emitter.emit(value); }

  static callError(emitter: EventEmitter<any>, error: any) { emitter.error(error); }

  static callComplete(emitter: EventEmitter<any>) { emitter.complete(); }

  static fromPromise(promise: Promise<any>): Observable<any> {
    return PromiseObservable.create(promise);
  }

  static toPromise(obj: Observable<any>): Promise<any> { return toPromise.call(obj); }
}

/**
 * Use by directives and components to emit custom Events.
 *
 * ### Examples
 *
 * In the following example, `Zippy` alternatively emits `open` and `close` events when its
 * title gets clicked:
 *
 * ```
 * @Component({
 *   selector: 'zippy',
 *   template: `
 *   <div class="zippy">
 *     <div (click)="toggle()">Toggle</div>
 *     <div [hidden]="!visible">
 *       <ng-content></ng-content>
 *     </div>
 *  </div>`})
 * export class Zippy {
 *   visible: boolean = true;
 *   @Output() open: EventEmitter<any> = new EventEmitter();
 *   @Output() close: EventEmitter<any> = new EventEmitter();
 *
 *   toggle() {
 *     this.visible = !this.visible;
 *     if (this.visible) {
 *       this.open.emit(null);
 *     } else {
 *       this.close.emit(null);
 *     }
 *   }
 * }
 * ```
 *
 * The events payload can be accessed by the parameter `$event` on the components output event
 * handler:
 *
 * ```
 * <zippy (open)="onOpen($event)" (close)="onClose($event)"></zippy>
 * ```
 *
 * Uses Rx.Observable but provides an adapter to make it work as specified here:
 * https://github.com/jhusain/observable-spec
 *
 * Once a reference implementation of the spec is available, switch to it.
 * @stable
 */
export class EventEmitter<T> extends Subject<T> {
  // TODO: mark this as internal once all the facades are gone
  // we can't mark it as internal now because EventEmitter exported via @angular/core would not
  // contain this property making it incompatible with all the code that uses EventEmitter via
  // facades, which are local to the code and do not have this property stripped.
  // tslint:disable-next-line
  __isAsync: boolean;

  /**
   * Creates an instance of [EventEmitter], which depending on [isAsync],
   * delivers events synchronously or asynchronously.
   */
  constructor(isAsync: boolean = false) {
    super();
    this.__isAsync = isAsync;
  }

  emit(value: T) { super.next(value); }

  /**
   * @deprecated - use .emit(value) instead
   */
  next(value: any) { super.next(value); }

  subscribe(generatorOrNext?: any, error?: any, complete?: any): any {
    let schedulerFn: any /** TODO #9100 */;
    let errorFn = (err: any): any /** TODO #9100 */ => null;
    let completeFn = (): any /** TODO #9100 */ => null;

    if (generatorOrNext && typeof generatorOrNext === 'object') {
      schedulerFn = this.__isAsync ? (value: any /** TODO #9100 */) => {
        setTimeout(() => generatorOrNext.next(value));
      } : (value: any /** TODO #9100 */) => { generatorOrNext.next(value); };

      if (generatorOrNext.error) {
        errorFn = this.__isAsync ? (err) => { setTimeout(() => generatorOrNext.error(err)); } :
                                   (err) => { generatorOrNext.error(err); };
      }

      if (generatorOrNext.complete) {
        completeFn = this.__isAsync ? () => { setTimeout(() => generatorOrNext.complete()); } :
                                      () => { generatorOrNext.complete(); };
      }
    } else {
      schedulerFn = this.__isAsync ? (value: any /** TODO #9100 */) => {
        setTimeout(() => generatorOrNext(value));
      } : (value: any /** TODO #9100 */) => { generatorOrNext(value); };

      if (error) {
        errorFn =
            this.__isAsync ? (err) => { setTimeout(() => error(err)); } : (err) => { error(err); };
      }

      if (complete) {
        completeFn =
            this.__isAsync ? () => { setTimeout(() => complete()); } : () => { complete(); };
      }
    }

    return super.subscribe(schedulerFn, errorFn, completeFn);
  }
}
