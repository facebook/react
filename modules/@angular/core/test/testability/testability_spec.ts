import {Injectable} from '@angular/core/src/di';
import {inject, describe, ddescribe, it, iit, xit, xdescribe, expect, beforeEach,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter, SpyObject} from '@angular/core/testing/testing_internal';
import {Testability} from '@angular/core/src/testability/testability';
import {NgZone} from '@angular/core/src/zone/ng_zone';
import {normalizeBlank, scheduleMicroTask} from '../../src/facade/lang';
import {PromiseWrapper, EventEmitter, ObservableWrapper} from '../../src/facade/async';

// Schedules a microtasks (using a resolved promise .then())
function microTask(fn: Function): void {
  scheduleMicroTask(() => {
    // We do double dispatch so that we  can wait for scheduleMicrotas in the Testability when
    // NgZone becomes stable.
    scheduleMicroTask(fn);
  });
}

@Injectable()
class MockNgZone extends NgZone {
  _onUnstableStream: EventEmitter<any>;
  get onUnstable() { return this._onUnstableStream; }

  _onStableStream: EventEmitter<any>;
  get onStable() { return this._onStableStream; }

  constructor() {
    super({enableLongStackTrace: false});
    this._onUnstableStream = new EventEmitter(false);
    this._onStableStream = new EventEmitter(false);
  }

  unstable(): void { ObservableWrapper.callEmit(this._onUnstableStream, null); }

  stable(): void { ObservableWrapper.callEmit(this._onStableStream, null); }
}

export function main() {
  describe('Testability', () => {
    var testability: Testability;
    var execute: any;
    var execute2: any;
    var ngZone: MockNgZone;

    beforeEach(() => {
      ngZone = new MockNgZone();
      testability = new Testability(ngZone);
      execute = new SpyObject().spy('execute');
      execute2 = new SpyObject().spy('execute');
    });

    describe('Pending count logic', () => {
      it('should start with a pending count of 0',
         () => { expect(testability.getPendingRequestCount()).toEqual(0); });

      it('should fire whenstable callbacks if pending count is 0',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           testability.whenStable(execute);
           microTask(() => {
             expect(execute).toHaveBeenCalled();
             async.done();
           });
         }));

      it('should not fire whenstable callbacks synchronously if pending count is 0', () => {
        testability.whenStable(execute);
        expect(execute).not.toHaveBeenCalled();
      });

      it('should not call whenstable callbacks when there are pending counts',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           testability.increasePendingRequestCount();
           testability.increasePendingRequestCount();
           testability.whenStable(execute);

           microTask(() => {
             expect(execute).not.toHaveBeenCalled();
             testability.decreasePendingRequestCount();

             microTask(() => {
               expect(execute).not.toHaveBeenCalled();
               async.done();
             });
           });
         }));

      it('should fire whenstable callbacks when pending drops to 0',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           testability.increasePendingRequestCount();
           testability.whenStable(execute);

           microTask(() => {
             expect(execute).not.toHaveBeenCalled();
             testability.decreasePendingRequestCount();

             microTask(() => {
               expect(execute).toHaveBeenCalled();
               async.done();
             });
           });
         }));

      it('should not fire whenstable callbacks synchronously when pending drops to 0', () => {
        testability.increasePendingRequestCount();
        testability.whenStable(execute);
        testability.decreasePendingRequestCount();

        expect(execute).not.toHaveBeenCalled();
      });

      it('should fire whenstable callbacks with didWork if pending count is 0',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           testability.whenStable(execute);
           microTask(() => {
             expect(execute).toHaveBeenCalledWith(false);
             async.done();
           });
         }));

      it('should fire whenstable callbacks with didWork when pending drops to 0',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           testability.increasePendingRequestCount();
           testability.whenStable(execute);

           microTask(() => {
             testability.decreasePendingRequestCount();

             microTask(() => {
               expect(execute).toHaveBeenCalledWith(true);
               testability.whenStable(execute2);

               microTask(() => {
                 expect(execute2).toHaveBeenCalledWith(false);
                 async.done();
               });
             });
           });
         }));
    });

    describe('NgZone callback logic', () => {
      it('should fire whenstable callback if event is already finished',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           ngZone.unstable();
           ngZone.stable();
           testability.whenStable(execute);

           microTask(() => {
             expect(execute).toHaveBeenCalled();
             async.done();
           });
         }));

      it('should not fire whenstable callbacks synchronously if event is already finished', () => {
        ngZone.unstable();
        ngZone.stable();
        testability.whenStable(execute);

        expect(execute).not.toHaveBeenCalled();
      });

      it('should fire whenstable callback when event finishes',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           ngZone.unstable();
           testability.whenStable(execute);

           microTask(() => {
             expect(execute).not.toHaveBeenCalled();
             ngZone.stable();

             microTask(() => {
               expect(execute).toHaveBeenCalled();
               async.done();
             });
           });
         }));

      it('should not fire whenstable callbacks synchronously when event finishes', () => {
        ngZone.unstable();
        testability.whenStable(execute);
        ngZone.stable();

        expect(execute).not.toHaveBeenCalled();
      });

      it('should not fire whenstable callback when event did not finish',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           ngZone.unstable();
           testability.increasePendingRequestCount();
           testability.whenStable(execute);

           microTask(() => {
             expect(execute).not.toHaveBeenCalled();
             testability.decreasePendingRequestCount();

             microTask(() => {
               expect(execute).not.toHaveBeenCalled();
               ngZone.stable();

               microTask(() => {
                 expect(execute).toHaveBeenCalled();
                 async.done();
               });
             });
           });
         }));

      it('should not fire whenstable callback when there are pending counts',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           ngZone.unstable();
           testability.increasePendingRequestCount();
           testability.increasePendingRequestCount();
           testability.whenStable(execute);

           microTask(() => {
             expect(execute).not.toHaveBeenCalled();
             ngZone.stable();

             microTask(() => {
               expect(execute).not.toHaveBeenCalled();
               testability.decreasePendingRequestCount();

               microTask(() => {
                 expect(execute).not.toHaveBeenCalled();
                 testability.decreasePendingRequestCount();

                 microTask(() => {
                   expect(execute).toHaveBeenCalled();
                   async.done();
                 });
               });
             });
           });
         }));

      it('should fire whenstable callback with didWork if event is already finished',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           ngZone.unstable();
           ngZone.stable();
           testability.whenStable(execute);

           microTask(() => {
             expect(execute).toHaveBeenCalledWith(true);
             testability.whenStable(execute2);

             microTask(() => {
               expect(execute2).toHaveBeenCalledWith(false);
               async.done();
             });
           });
         }));

      it('should fire whenstable callback with didwork when event finishes',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           ngZone.unstable();
           testability.whenStable(execute);

           microTask(() => {
             ngZone.stable();

             microTask(() => {
               expect(execute).toHaveBeenCalledWith(true);
               testability.whenStable(execute2);

               microTask(() => {
                 expect(execute2).toHaveBeenCalledWith(false);
                 async.done();
               });
             });
           });
         }));
    });
  });
}
