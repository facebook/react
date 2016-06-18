import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {EventEmitter, Observable, PromiseWrapper, Subject} from '../../src/facade/async';

export function main() {
  describe('Observable', () => {
    describe('#core', () => {

      it('should call next with values',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {

           let o = new Observable((sink: any /** TODO #9100 */) => { sink.next(1); });

           o.subscribe(v => {
             expect(v).toEqual(1);
             async.done();
           });

         }));

      it('should call next and then complete',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {

           let o = new Observable((sink: any /** TODO #9100 */) => {
             sink.next(1);
             sink.complete();
           });
           let nexted = false;

           o.subscribe(
               v => { nexted = true; }, null,
               () => {
                 expect(nexted).toBe(true);
                 async.done();
               });

         }));

      it('should call error with errors',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {

           let o = new Observable((sink: any /** TODO #9100 */) => { sink.error('oh noes!'); });

           o.subscribe(
               v => {

               },
               (err) => {
                 expect(err).toEqual('oh noes!');
                 async.done();
               });

         }));
    });
  });
}
