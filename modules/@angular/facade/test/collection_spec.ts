import {beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing';

import {ListWrapper, MapWrapper, StringMapWrapper} from '../src/collection';

export function main() {
  describe('ListWrapper', () => {
    var l: number[];

    describe('splice', () => {
      it('should remove sublist of given length and return it', () => {
        var list = [1, 2, 3, 4, 5, 6];
        expect(ListWrapper.splice(list, 1, 3)).toEqual([2, 3, 4]);
        expect(list).toEqual([1, 5, 6]);
      });

      it('should support negative start', () => {
        var list = [1, 2, 3, 4, 5, 6];
        expect(ListWrapper.splice(list, -5, 3)).toEqual([2, 3, 4]);
        expect(list).toEqual([1, 5, 6]);
      });
    });

    describe('fill', () => {
      beforeEach(() => { l = [1, 2, 3, 4]; });

      it('should fill the whole list if neither start nor end are specified', () => {
        ListWrapper.fill(l, 9);
        expect(l).toEqual([9, 9, 9, 9]);
      });

      it('should fill up to the end if end is not specified', () => {
        ListWrapper.fill(l, 9, 1);
        expect(l).toEqual([1, 9, 9, 9]);
      });

      it('should support negative start', () => {
        ListWrapper.fill(l, 9, -1);
        expect(l).toEqual([1, 2, 3, 9]);
      });

      it('should support negative end', () => {
        ListWrapper.fill(l, 9, -2, -1);
        expect(l).toEqual([1, 2, 9, 4]);
      });
    });

    describe('slice', () => {
      beforeEach(() => { l = [1, 2, 3, 4]; });

      it('should return the whole list if neither start nor end are specified', () => {
        expect(ListWrapper.slice(l)).toEqual([1, 2, 3, 4]);
      });

      it('should return up to the end if end is not specified', () => {
        expect(ListWrapper.slice(l, 1)).toEqual([2, 3, 4]);
      });

      it('should support negative start', () => { expect(ListWrapper.slice(l, -1)).toEqual([4]); });

      it('should support negative end', () => {
        expect(ListWrapper.slice(l, -3, -1)).toEqual([2, 3]);
      });

      it('should return empty list if start is greater than end', () => {
        expect(ListWrapper.slice(l, 4, 2)).toEqual([]);
        expect(ListWrapper.slice(l, -2, -4)).toEqual([]);
      });
    });

    describe('indexOf', () => {
      beforeEach(() => { l = [1, 2, 3, 4]; });

      it('should find values that exist', () => { expect(ListWrapper.indexOf(l, 1)).toEqual(0); });

      it('should not find values that do not exist',
         () => { expect(ListWrapper.indexOf(l, 9)).toEqual(-1); });

      it('should respect the startIndex parameter',
         () => { expect(ListWrapper.indexOf(l, 1, 1)).toEqual(-1); });
    });

    describe('maximum', () => {
      it('should return the maximal element', () => {
        expect(ListWrapper.maximum([1, 2, 3, 4], x => x)).toEqual(4);
      });

      it('should ignore null values', () => {
        expect(ListWrapper.maximum([null, 2, 3, null], x => x)).toEqual(3);
      });

      it('should use the provided function to determine maximum', () => {
        expect(ListWrapper.maximum([1, 2, 3, 4], x => -x)).toEqual(1);
      });

      it('should return null for an empty list',
         () => { expect(ListWrapper.maximum([], x => x)).toEqual(null); });
    });

    describe('forEachWithIndex', () => {
      var l: any /** TODO #9100 */;

      beforeEach(() => { l = ['a', 'b']; });

      it('should iterate over an array passing values and indices', () => {
        var record: any[] /** TODO #9100 */ = [];
        ListWrapper.forEachWithIndex(l, (value, index) => record.push([value, index]));
        expect(record).toEqual([['a', 0], ['b', 1]]);
      });
    });
  });

  describe('StringMapWrapper', () => {
    describe('equals', () => {
      it('should return true when comparing empty maps',
         () => { expect(StringMapWrapper.equals({}, {})).toBe(true); });

      it('should return true when comparing the same map', () => {
        var m1: {[key: string]: number} = {'a': 1, 'b': 2, 'c': 3};
        expect(StringMapWrapper.equals(m1, m1)).toBe(true);
      });

      it('should return true when comparing different maps with the same keys and values', () => {
        var m1: {[key: string]: number} = {'a': 1, 'b': 2, 'c': 3};
        var m2: {[key: string]: number} = {'a': 1, 'b': 2, 'c': 3};
        expect(StringMapWrapper.equals(m1, m2)).toBe(true);
      });

      it('should return false when comparing maps with different numbers of keys', () => {
        var m1: {[key: string]: number} = {'a': 1, 'b': 2, 'c': 3};
        var m2: {[key: string]: number} = {'a': 1, 'b': 2, 'c': 3, 'd': 4};
        expect(StringMapWrapper.equals(m1, m2)).toBe(false);
        expect(StringMapWrapper.equals(m2, m1)).toBe(false);
      });

      it('should return false when comparing maps with different keys', () => {
        var m1: {[key: string]: number} = {'a': 1, 'b': 2, 'c': 3};
        var m2: {[key: string]: number} = {'a': 1, 'b': 2, 'CC': 3};
        expect(StringMapWrapper.equals(m1, m2)).toBe(false);
        expect(StringMapWrapper.equals(m2, m1)).toBe(false);
      });

      it('should return false when comparing maps with different values', () => {
        var m1: {[key: string]: number} = {'a': 1, 'b': 2, 'c': 3};
        var m2: {[key: string]: number} = {'a': 1, 'b': 20, 'c': 3};
        expect(StringMapWrapper.equals(m1, m2)).toBe(false);
        expect(StringMapWrapper.equals(m2, m1)).toBe(false);
      });
    });

    describe('MapWrapper', () => {
      it('should return a list of keys values', () => {
        var m = new Map();
        m.set('a', 'b');
        expect(MapWrapper.keys(m)).toEqual(['a']);
        expect(MapWrapper.values(m)).toEqual(['b']);
      });
    });
  });
}
