import {describe, it, expect, beforeEach, ddescribe, iit, xit, inject,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {browserDetection} from '@angular/platform-browser/testing';
import {ObservableWrapper, Observable, Subject, EventEmitter, PromiseWrapper} from '../src/async';

export function main() {
  describe('EventEmitter', () => {
    var emitter: EventEmitter<any>;

    beforeEach(() => { emitter = new EventEmitter(); });

    it('should call the next callback',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         ObservableWrapper.subscribe(emitter, (value) => {
           expect(value).toEqual(99);
           async.done();
         });

         ObservableWrapper.callEmit(emitter, 99);
       }));

    it('should call the throw callback',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         ObservableWrapper.subscribe(emitter, (_) => {}, (error) => {
           expect(error).toEqual('Boom');
           async.done();
         });
         ObservableWrapper.callError(emitter, 'Boom');
       }));

    it('should work when no throw callback is provided',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         ObservableWrapper.subscribe(emitter, (_) => {}, (_) => { async.done(); });
         ObservableWrapper.callError(emitter, 'Boom');
       }));

    it('should call the return callback',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         ObservableWrapper.subscribe(emitter, (_) => {}, (_) => {}, () => { async.done(); });

         ObservableWrapper.callComplete(emitter);
       }));

    it('should subscribe to the wrapper synchronously', () => {
      var called = false;
      ObservableWrapper.subscribe(emitter, (value) => { called = true; });

      ObservableWrapper.callEmit(emitter, 99);
      expect(called).toBe(true);
    });

    // Makes Edge to disconnect when running the full unit test campaign
    // TODO: remove when issue is solved: https://github.com/angular/angular/issues/4756
    if (!browserDetection.isEdge) {
      it('delivers next and error events synchronously',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           let log: any[] /** TODO #9100 */ = [];
           ObservableWrapper.subscribe(
               emitter,
               (x) => {
                 log.push(x);
                 expect(log).toEqual([1, 2]);
               },
               (err) => {
                 log.push(err);
                 expect(log).toEqual([1, 2, 3, 4]);
                 async.done();
               });
           log.push(1);
           ObservableWrapper.callEmit(emitter, 2);
           log.push(3);
           ObservableWrapper.callError(emitter, 4);
           log.push(5);
         }));

      it('delivers next and complete events synchronously', () => {
        let log: any[] /** TODO #9100 */ = [];
        ObservableWrapper.subscribe(
            emitter,
            (x) => {
              log.push(x);
              expect(log).toEqual([1, 2]);
            },
            null,
            () => {
              log.push(4);
              expect(log).toEqual([1, 2, 3, 4]);
            });
        log.push(1);
        ObservableWrapper.callEmit(emitter, 2);
        log.push(3);
        ObservableWrapper.callComplete(emitter);
        log.push(5);
        expect(log).toEqual([1, 2, 3, 4, 5]);
      });
    }

    it('delivers events asynchronously when forced to async mode',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         var e = new EventEmitter(true);
         var log: any[] /** TODO #9100 */ = [];
         ObservableWrapper.subscribe(e, (x) => {
           log.push(x);
           expect(log).toEqual([1, 3, 2]);
           async.done();
         });
         log.push(1);
         ObservableWrapper.callEmit(e, 2);
         log.push(3);

       }));

    it('reports whether it has subscribers', () => {
      var e = new EventEmitter(false);
      expect(ObservableWrapper.hasSubscribers(e)).toBe(false);
      ObservableWrapper.subscribe(e, (_) => {});
      expect(ObservableWrapper.hasSubscribers(e)).toBe(true);
    });

    // TODO: vsavkin: add tests cases
    // should call dispose on the subscription if generator returns {done:true}
    // should call dispose on the subscription on throw
    // should call dispose on the subscription on return
  });

  describe('ObservableWrapper', () => {

    it('should correctly check isObservable for EventEmitter', () => {
      var e = new EventEmitter(false);
      expect(ObservableWrapper.isObservable(e)).toBe(true);
    });

    it('should correctly check isObservable for Subject', () => {
      var e = new Subject();
      expect(ObservableWrapper.isObservable(e)).toBe(true);
    });

    it('should subscribe to EventEmitters', () => {
      let e = new EventEmitter(false);

      ObservableWrapper.subscribe(e, (val) => {});

      ObservableWrapper.callEmit(e, 1);
      ObservableWrapper.callComplete(e);
    });

  });

  // See ECMAScript 6 Spec 25.4.4.1
  describe('PromiseWrapper', () => {
    describe('#all', () => {
      it('should combine lists of Promises',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var one = PromiseWrapper.completer();
           var two = PromiseWrapper.completer();

           var all = PromiseWrapper.all([one.promise, two.promise]);
           var allCalled = false;

           PromiseWrapper.then(one.promise, (_) => {
             expect(allCalled).toBe(false);
             two.resolve('two');
             return null;
           });

           PromiseWrapper.then(all, (_) => {
             allCalled = true;
             async.done();
             return null;
           });

           one.resolve('one');
         }));

      [null, true, false, 10, 'thing', {}, []].forEach(abruptCompletion => {
        it(`should treat "${abruptCompletion}" as an "abrupt completion"`,
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             var one = PromiseWrapper.completer();

             var all = PromiseWrapper.all([one.promise, abruptCompletion]);

             PromiseWrapper.then(all, (val) => {
               expect(val[1]).toEqual(abruptCompletion);
               async.done();
             });

             one.resolve('one');
           }));
      });
    });
  });
}
