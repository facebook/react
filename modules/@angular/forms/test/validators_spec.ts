import {Log, fakeAsync, flushMicrotasks, tick} from '@angular/core/testing';
import {afterEach, beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing/testing_internal';
import {AbstractControl, FormControl, Validators} from '@angular/forms';

import {EventEmitter, ObservableWrapper, TimerWrapper} from '../src/facade/async';
import {PromiseWrapper} from '../src/facade/promise';

export function main() {
  function validator(key: string, error: any) {
    return function(c: AbstractControl) {
      var r = {};
      (r as any /** TODO #9100 */)[key] = error;
      return r;
    }
  }

  describe('Validators', () => {
    describe('required', () => {
      it('should error on an empty string',
         () => { expect(Validators.required(new FormControl(''))).toEqual({'required': true}); });

      it('should error on null',
         () => { expect(Validators.required(new FormControl(null))).toEqual({'required': true}); });

      it('should not error on a non-empty string',
         () => { expect(Validators.required(new FormControl('not empty'))).toEqual(null); });

      it('should accept zero as valid',
         () => { expect(Validators.required(new FormControl(0))).toEqual(null); });
    });

    describe('minLength', () => {
      it('should not error on an empty string',
         () => { expect(Validators.minLength(2)(new FormControl(''))).toEqual(null); });

      it('should not error on null',
         () => { expect(Validators.minLength(2)(new FormControl(null))).toEqual(null); });

      it('should not error on valid strings',
         () => { expect(Validators.minLength(2)(new FormControl('aa'))).toEqual(null); });

      it('should error on short strings', () => {
        expect(Validators.minLength(2)(new FormControl('a'))).toEqual({
          'minlength': {'requiredLength': 2, 'actualLength': 1}
        });
      });
    });

    describe('maxLength', () => {
      it('should not error on an empty string',
         () => { expect(Validators.maxLength(2)(new FormControl(''))).toEqual(null); });

      it('should not error on null',
         () => { expect(Validators.maxLength(2)(new FormControl(null))).toEqual(null); });

      it('should not error on valid strings',
         () => { expect(Validators.maxLength(2)(new FormControl('aa'))).toEqual(null); });

      it('should error on long strings', () => {
        expect(Validators.maxLength(2)(new FormControl('aaa'))).toEqual({
          'maxlength': {'requiredLength': 2, 'actualLength': 3}
        });
      });
    });

    describe('pattern', () => {
      it('should not error on an empty string',
         () => { expect(Validators.pattern('[a-zA-Z ]*')(new FormControl(''))).toEqual(null); });

      it('should not error on null',
         () => { expect(Validators.pattern('[a-zA-Z ]*')(new FormControl(null))).toEqual(null); });

      it('should not error on valid strings', () => {
        expect(Validators.pattern('[a-zA-Z ]*')(new FormControl('aaAA'))).toEqual(null);
      });

      it('should error on failure to match string', () => {
        expect(Validators.pattern('[a-zA-Z ]*')(new FormControl('aaa0'))).toEqual({
          'pattern': {'requiredPattern': '^[a-zA-Z ]*$', 'actualValue': 'aaa0'}
        });
      });
    });

    describe('compose', () => {
      it('should return null when given null',
         () => { expect(Validators.compose(null)).toBe(null); });

      it('should collect errors from all the validators', () => {
        var c = Validators.compose([validator('a', true), validator('b', true)]);
        expect(c(new FormControl(''))).toEqual({'a': true, 'b': true});
      });

      it('should run validators left to right', () => {
        var c = Validators.compose([validator('a', 1), validator('a', 2)]);
        expect(c(new FormControl(''))).toEqual({'a': 2});
      });

      it('should return null when no errors', () => {
        var c = Validators.compose([Validators.nullValidator, Validators.nullValidator]);
        expect(c(new FormControl(''))).toEqual(null);
      });

      it('should ignore nulls', () => {
        var c = Validators.compose([null, Validators.required]);
        expect(c(new FormControl(''))).toEqual({'required': true});
      });
    });

    describe('composeAsync', () => {
      function asyncValidator(expected: any /** TODO #9100 */, response: any /** TODO #9100 */) {
        return (c: any /** TODO #9100 */) => {
          var emitter = new EventEmitter();
          var res = c.value != expected ? response : null;

          PromiseWrapper.scheduleMicrotask(() => {
            ObservableWrapper.callEmit(emitter, res);
            // this is required because of a bug in ObservableWrapper
            // where callComplete can fire before callEmit
            // remove this one the bug is fixed
            TimerWrapper.setTimeout(() => { ObservableWrapper.callComplete(emitter); }, 0);
          });
          return emitter;
        };
      }

      it('should return null when given null',
         () => { expect(Validators.composeAsync(null)).toEqual(null); });

      it('should collect errors from all the validators', fakeAsync(() => {
           var c = Validators.composeAsync([
             asyncValidator('expected', {'one': true}), asyncValidator('expected', {'two': true})
           ]);

           var value: any /** TODO #9100 */ = null;
           (<Promise<any>>c(new FormControl('invalid'))).then(v => value = v);

           tick(1);

           expect(value).toEqual({'one': true, 'two': true});
         }));

      it('should return null when no errors', fakeAsync(() => {
           var c = Validators.composeAsync([asyncValidator('expected', {'one': true})]);

           var value: any /** TODO #9100 */ = null;
           (<Promise<any>>c(new FormControl('expected'))).then(v => value = v);

           tick(1);

           expect(value).toEqual(null);
         }));

      it('should ignore nulls', fakeAsync(() => {
           var c = Validators.composeAsync([asyncValidator('expected', {'one': true}), null]);

           var value: any /** TODO #9100 */ = null;
           (<Promise<any>>c(new FormControl('invalid'))).then(v => value = v);

           tick(1);

           expect(value).toEqual({'one': true});
         }));
    });
  });
}
