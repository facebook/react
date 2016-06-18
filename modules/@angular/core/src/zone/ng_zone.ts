import {EventEmitter} from '../facade/async';
import {BaseException} from '../facade/exceptions';

import {NgZoneError, NgZoneImpl} from './ng_zone_impl';

export {NgZoneError} from './ng_zone_impl';



/**
 * An injectable service for executing work inside or outside of the Angular zone.
 *
 * The most common use of this service is to optimize performance when starting a work consisting of
 * one or more asynchronous tasks that don't require UI updates or error handling to be handled by
 * Angular. Such tasks can be kicked off via {@link #runOutsideAngular} and if needed, these tasks
 * can reenter the Angular zone via {@link #run}.
 *
 * <!-- TODO: add/fix links to:
 *   - docs explaining zones and the use of zones in Angular and change-detection
 *   - link to runOutsideAngular/run (throughout this file!)
 *   -->
 *
 * ### Example ([live demo](http://plnkr.co/edit/lY9m8HLy7z06vDoUaSN2?p=preview))
 * ```
 * import {Component, View, NgZone} from '@angular/core';
 * import {NgIf} from '@angular/common';
 *
 * @Component({
 *   selector: 'ng-zone-demo'.
 *   template: `
 *     <h2>Demo: NgZone</h2>
 *
 *     <p>Progress: {{progress}}%</p>
 *     <p *ngIf="progress >= 100">Done processing {{label}} of Angular zone!</p>
 *
 *     <button (click)="processWithinAngularZone()">Process within Angular zone</button>
 *     <button (click)="processOutsideOfAngularZone()">Process outside of Angular zone</button>
 *   `,
 *   directives: [NgIf]
 * })
 * export class NgZoneDemo {
 *   progress: number = 0;
 *   label: string;
 *
 *   constructor(private _ngZone: NgZone) {}
 *
 *   // Loop inside the Angular zone
 *   // so the UI DOES refresh after each setTimeout cycle
 *   processWithinAngularZone() {
 *     this.label = 'inside';
 *     this.progress = 0;
 *     this._increaseProgress(() => console.log('Inside Done!'));
 *   }
 *
 *   // Loop outside of the Angular zone
 *   // so the UI DOES NOT refresh after each setTimeout cycle
 *   processOutsideOfAngularZone() {
 *     this.label = 'outside';
 *     this.progress = 0;
 *     this._ngZone.runOutsideAngular(() => {
 *       this._increaseProgress(() => {
 *       // reenter the Angular zone and display done
 *       this._ngZone.run(() => {console.log('Outside Done!') });
 *     }}));
 *   }
 *
 *
 *   _increaseProgress(doneCallback: () => void) {
 *     this.progress += 1;
 *     console.log(`Current progress: ${this.progress}%`);
 *
 *     if (this.progress < 100) {
 *       window.setTimeout(() => this._increaseProgress(doneCallback)), 10)
 *     } else {
 *       doneCallback();
 *     }
 *   }
 * }
 * ```
 * @experimental
 */
export class NgZone {
  static isInAngularZone(): boolean { return NgZoneImpl.isInAngularZone(); }
  static assertInAngularZone(): void {
    if (!NgZoneImpl.isInAngularZone()) {
      throw new BaseException('Expected to be in Angular Zone, but it is not!');
    }
  }
  static assertNotInAngularZone(): void {
    if (NgZoneImpl.isInAngularZone()) {
      throw new BaseException('Expected to not be in Angular Zone, but it is!');
    }
  }

  private _zoneImpl: NgZoneImpl;

  private _hasPendingMicrotasks: boolean = false;
  private _hasPendingMacrotasks: boolean = false;

  /** @internal */
  private _isStable = true;
  /** @internal */
  private _nesting = 0;
  /** @internal */
  private _onUnstable: EventEmitter<any> = new EventEmitter(false);
  /** @internal */
  private _onMicrotaskEmpty: EventEmitter<any> = new EventEmitter(false);
  /** @internal */
  private _onStable: EventEmitter<any> = new EventEmitter(false);
  /** @internal */
  private _onErrorEvents: EventEmitter<any> = new EventEmitter(false);

  constructor({enableLongStackTrace = false}) {
    this._zoneImpl = new NgZoneImpl({
      trace: enableLongStackTrace,
      onEnter: () => {
        // console.log('ZONE.enter', this._nesting, this._isStable);
        this._nesting++;
        if (this._isStable) {
          this._isStable = false;
          this._onUnstable.emit(null);
        }
      },
      onLeave: () => {
        this._nesting--;
        // console.log('ZONE.leave', this._nesting, this._isStable);
        this._checkStable();
      },
      setMicrotask: (hasMicrotasks: boolean) => {
        this._hasPendingMicrotasks = hasMicrotasks;
        this._checkStable();
      },
      setMacrotask: (hasMacrotasks: boolean) => { this._hasPendingMacrotasks = hasMacrotasks; },
      onError: (error: NgZoneError) => this._onErrorEvents.emit(error)
    });
  }

  private _checkStable() {
    if (this._nesting == 0) {
      if (!this._hasPendingMicrotasks && !this._isStable) {
        try {
          // console.log('ZONE.microtaskEmpty');
          this._nesting++;
          this._onMicrotaskEmpty.emit(null);
        } finally {
          this._nesting--;
          if (!this._hasPendingMicrotasks) {
            try {
              // console.log('ZONE.stable', this._nesting, this._isStable);
              this.runOutsideAngular(() => this._onStable.emit(null));
            } finally {
              this._isStable = true;
            }
          }
        }
      }
    }
  };

  /**
   * Notifies when code enters Angular Zone. This gets fired first on VM Turn.
   */
  get onUnstable(): EventEmitter<any> { return this._onUnstable; }

  /**
   * Notifies when there is no more microtasks enqueue in the current VM Turn.
   * This is a hint for Angular to do change detection, which may enqueue more microtasks.
   * For this reason this event can fire multiple times per VM Turn.
   */
  get onMicrotaskEmpty(): EventEmitter<any> { return this._onMicrotaskEmpty; }

  /**
   * Notifies when the last `onMicrotaskEmpty` has run and there are no more microtasks, which
   * implies we are about to relinquish VM turn.
   * This event gets called just once.
   */
  get onStable(): EventEmitter<any> { return this._onStable; }

  /**
   * Notify that an error has been delivered.
   */
  get onError(): EventEmitter<any> { return this._onErrorEvents; }

  /**
   * Whether there are no outstanding microtasks or microtasks.
   */
  get isStable(): boolean { return this._isStable; }

  /**
   * Whether there are any outstanding microtasks.
   */
  get hasPendingMicrotasks(): boolean { return this._hasPendingMicrotasks; }

  /**
   * Whether there are any outstanding microtasks.
   */
  get hasPendingMacrotasks(): boolean { return this._hasPendingMacrotasks; }

  /**
   * Executes the `fn` function synchronously within the Angular zone and returns value returned by
   * the function.
   *
   * Running functions via `run` allows you to reenter Angular zone from a task that was executed
   * outside of the Angular zone (typically started via {@link #runOutsideAngular}).
   *
   * Any future tasks or microtasks scheduled from within this function will continue executing from
   * within the Angular zone.
   *
   * If a synchronous error happens it will be rethrown and not reported via `onError`.
   */
  run(fn: () => any): any { return this._zoneImpl.runInner(fn); }

  /**
   * Same as #run, except that synchronous errors are caught and forwarded
   * via `onError` and not rethrown.
   */
  runGuarded(fn: () => any): any { return this._zoneImpl.runInnerGuarded(fn); }

  /**
   * Executes the `fn` function synchronously in Angular's parent zone and returns value returned by
   * the function.
   *
   * Running functions via `runOutsideAngular` allows you to escape Angular's zone and do work that
   * doesn't trigger Angular change-detection or is subject to Angular's error handling.
   *
   * Any future tasks or microtasks scheduled from within this function will continue executing from
   * outside of the Angular zone.
   *
   * Use {@link #run} to reenter the Angular zone and do work that updates the application model.
   */
  runOutsideAngular(fn: () => any): any { return this._zoneImpl.runOuter(fn); }
}
