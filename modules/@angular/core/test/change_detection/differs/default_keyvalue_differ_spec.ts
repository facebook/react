import {DefaultKeyValueDiffer, DefaultKeyValueDifferFactory} from '@angular/core/src/change_detection/differs/default_keyvalue_differ';
import {afterEach, beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing/testing_internal';

import {NumberWrapper, isJsObject} from '../../../src/facade/lang';
import {kvChangesAsString} from '../../change_detection/util';


// todo(vicb): Update the code & tests for object equality
export function main() {
  describe('keyvalue differ', function() {
    describe('DefaultKeyValueDiffer', function() {
      var differ: any /** TODO #9100 */;
      var m: Map<any, any>;

      beforeEach(() => {
        differ = new DefaultKeyValueDiffer();
        m = new Map();
      });

      afterEach(() => { differ = null; });

      it('should detect additions', () => {
        differ.check(m);

        m.set('a', 1);
        differ.check(m);
        expect(differ.toString())
            .toEqual(kvChangesAsString({map: ['a[null->1]'], additions: ['a[null->1]']}));

        m.set('b', 2);
        differ.check(m);
        expect(differ.toString())
            .toEqual(kvChangesAsString(
                {map: ['a', 'b[null->2]'], previous: ['a'], additions: ['b[null->2]']}));
      });

      it('should handle changing key/values correctly', () => {
        m.set(1, 10);
        m.set(2, 20);
        differ.check(m);

        m.set(2, 10);
        m.set(1, 20);
        differ.check(m);
        expect(differ.toString()).toEqual(kvChangesAsString({
          map: ['1[10->20]', '2[20->10]'],
          previous: ['1[10->20]', '2[20->10]'],
          changes: ['1[10->20]', '2[20->10]']
        }));
      });

      it('should expose previous and current value', () => {
        var previous: any /** TODO #9100 */, current: any /** TODO #9100 */;

        m.set(1, 10);
        differ.check(m);

        m.set(1, 20);
        differ.check(m);

        differ.forEachChangedItem((record: any /** TODO #9100 */) => {
          previous = record.previousValue;
          current = record.currentValue;
        });

        expect(previous).toEqual(10);
        expect(current).toEqual(20);
      });

      it('should do basic map watching', () => {
        differ.check(m);

        m.set('a', 'A');
        differ.check(m);
        expect(differ.toString())
            .toEqual(kvChangesAsString({map: ['a[null->A]'], additions: ['a[null->A]']}));

        m.set('b', 'B');
        differ.check(m);
        expect(differ.toString())
            .toEqual(kvChangesAsString(
                {map: ['a', 'b[null->B]'], previous: ['a'], additions: ['b[null->B]']}));

        m.set('b', 'BB');
        m.set('d', 'D');
        differ.check(m);
        expect(differ.toString()).toEqual(kvChangesAsString({
          map: ['a', 'b[B->BB]', 'd[null->D]'],
          previous: ['a', 'b[B->BB]'],
          additions: ['d[null->D]'],
          changes: ['b[B->BB]']
        }));

        m.delete('b');
        differ.check(m);
        expect(differ.toString())
            .toEqual(kvChangesAsString(
                {map: ['a', 'd'], previous: ['a', 'b[BB->null]', 'd'], removals: ['b[BB->null]']}));

        m.clear();
        differ.check(m);
        expect(differ.toString()).toEqual(kvChangesAsString({
          previous: ['a[A->null]', 'd[D->null]'],
          removals: ['a[A->null]', 'd[D->null]']
        }));
      });

      it('should test string by value rather than by reference (DART)', () => {
        m.set('foo', 'bar');
        differ.check(m);

        var f = 'f';
        var oo = 'oo';
        var b = 'b';
        var ar = 'ar';

        m.set(f + oo, b + ar);
        differ.check(m);

        expect(differ.toString()).toEqual(kvChangesAsString({map: ['foo'], previous: ['foo']}));
      });

      it('should not see a NaN value as a change (JS)', () => {
        m.set('foo', NumberWrapper.NaN);
        differ.check(m);

        differ.check(m);
        expect(differ.toString()).toEqual(kvChangesAsString({map: ['foo'], previous: ['foo']}));
      });

      // JS specific tests (JS Objects)
      if (isJsObject({})) {
        describe('JsObject changes', () => {
          it('should support JS Object', () => {
            var f = new DefaultKeyValueDifferFactory();
            expect(f.supports({})).toBeTruthy();
            expect(f.supports('not supported')).toBeFalsy();
            expect(f.supports(0)).toBeFalsy();
            expect(f.supports(null)).toBeFalsy();
          });

          it('should do basic object watching', () => {
            let m = {};
            differ.check(m);

            (m as any /** TODO #9100 */)['a'] = 'A';
            differ.check(m);
            expect(differ.toString())
                .toEqual(kvChangesAsString({map: ['a[null->A]'], additions: ['a[null->A]']}));

            (m as any /** TODO #9100 */)['b'] = 'B';
            differ.check(m);
            expect(differ.toString())
                .toEqual(kvChangesAsString(
                    {map: ['a', 'b[null->B]'], previous: ['a'], additions: ['b[null->B]']}));

            (m as any /** TODO #9100 */)['b'] = 'BB';
            (m as any /** TODO #9100 */)['d'] = 'D';
            differ.check(m);
            expect(differ.toString()).toEqual(kvChangesAsString({
              map: ['a', 'b[B->BB]', 'd[null->D]'],
              previous: ['a', 'b[B->BB]'],
              additions: ['d[null->D]'],
              changes: ['b[B->BB]']
            }));

            m = {};
            (m as any /** TODO #9100 */)['a'] = 'A';
            (m as any /** TODO #9100 */)['d'] = 'D';
            differ.check(m);
            expect(differ.toString()).toEqual(kvChangesAsString({
              map: ['a', 'd'],
              previous: ['a', 'b[BB->null]', 'd'],
              removals: ['b[BB->null]']
            }));

            m = {};
            differ.check(m);
            expect(differ.toString()).toEqual(kvChangesAsString({
              previous: ['a[A->null]', 'd[D->null]'],
              removals: ['a[A->null]', 'd[D->null]']
            }));
          });
        });

        describe('diff', () => {
          it('should return self when there is a change', () => {
            m.set('a', 'A');
            expect(differ.diff(m)).toBe(differ);
          });

          it('should return null when there is no change', () => {
            m.set('a', 'A');
            differ.diff(m);
            expect(differ.diff(m)).toEqual(null);
          });

          it('should treat null as an empty list', () => {
            m.set('a', 'A');
            differ.diff(m);
            expect(differ.diff(null).toString())
                .toEqual(kvChangesAsString({previous: ['a[A->null]'], removals: ['a[A->null]']}));
          });

          it('should throw when given an invalid collection', () => {
            expect(() => differ.diff('invalid'))
                .toThrowErrorWith('Error trying to diff \'invalid\'');
          });
        });
      }
    });
  });
}
