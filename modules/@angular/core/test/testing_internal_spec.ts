import {SpyObject} from '@angular/core/testing/testing_internal';

import {MapWrapper} from '../../platform-browser/src/facade/collection';
import {RegExpWrapper} from '../../router/src/facade/lang';
import {beforeEach, containsRegexp, ddescribe, describe, expect, iit, it, tick} from '../testing';

class TestObj {
  prop: any /** TODO #9100 */;
  constructor(prop: any /** TODO #9100 */) { this.prop = prop; }
  someFunc(): number { return -1; }
  someComplexFunc(a: any /** TODO #9100 */) { return a; }
}

class SpyTestObj extends SpyObject {
  constructor() { super(TestObj); }
}


export function main() {
  describe('testing', () => {
    describe('equality', () => {
      it('should structurally compare objects', () => {
        var expected = new TestObj(new TestObj({'one': [1, 2]}));
        var actual = new TestObj(new TestObj({'one': [1, 2]}));
        var falseActual = new TestObj(new TestObj({'one': [1, 3]}));

        expect(actual).toEqual(expected);
        expect(falseActual).not.toEqual(expected);
      });
    });

    describe('toMatchPAttern', () => {
      it('should assert that a string matches a given pattern', () => {
        expect('matias').toMatchPattern(/ias$/g);
        expect('tobias').toMatchPattern(/ias$/g);
        expect('joonas').not.toMatchPattern(/ias$/g);
      });
    });

    describe('toEqual for Maps', () => {
      it('should detect equality for same reference', () => {
        var m1 = MapWrapper.createFromStringMap({'a': 1});
        expect(m1).toEqual(m1);
      });

      it('should detect equality for same content', () => {
        expect(MapWrapper.createFromStringMap({'a': 1})).toEqual(MapWrapper.createFromStringMap({
          'a': 1
        }));
      });

      it('should detect missing entries', () => {
        expect(MapWrapper.createFromStringMap({
          'a': 1
        })).not.toEqual(MapWrapper.createFromStringMap({}));
      });

      it('should detect different values', () => {
        expect(MapWrapper.createFromStringMap({
          'a': 1
        })).not.toEqual(MapWrapper.createFromStringMap({'a': 2}));
      });

      it('should detect additional entries', () => {
        expect(MapWrapper.createFromStringMap({
          'a': 1
        })).not.toEqual(MapWrapper.createFromStringMap({'a': 1, 'b': 1}));
      });
    });

    describe('spy objects', () => {
      var spyObj: any /** TODO #9100 */;

      beforeEach(() => { spyObj = <any>new SpyTestObj(); });

      it('should return a new spy func with no calls',
         () => { expect(spyObj.spy('someFunc')).not.toHaveBeenCalled(); });

      it('should record function calls', () => {
        spyObj.spy('someFunc')
            .andCallFake((a: any /** TODO #9100 */, b: any /** TODO #9100 */) => {return a + b});

        expect(spyObj.someFunc(1, 2)).toEqual(3);
        expect(spyObj.spy('someFunc')).toHaveBeenCalledWith(1, 2);
      });

      it('should match multiple function calls', () => {
        spyObj.someFunc(1, 2);
        spyObj.someFunc(3, 4);
        expect(spyObj.spy('someFunc')).toHaveBeenCalledWith(1, 2);
        expect(spyObj.spy('someFunc')).toHaveBeenCalledWith(3, 4);
      });

      it('should match null arguments', () => {
        spyObj.someFunc(null, 'hello');
        expect(spyObj.spy('someFunc')).toHaveBeenCalledWith(null, 'hello');
      });

      it('should match using deep equality', () => {
        spyObj.someComplexFunc([1]);
        expect(spyObj.spy('someComplexFunc')).toHaveBeenCalledWith([1]);
      });

      it('should support stubs', () => {
        var s = SpyObject.stub({'a': 1}, {'b': 2});

        expect(s.a()).toEqual(1);
        expect(s.b()).toEqual(2);
      });

      it('should create spys for all methods',
         () => { expect(() => spyObj.someFunc()).not.toThrow(); });

      it('should create a default spy that does not fail for numbers', () => {
        // Previously needed for rtts_assert. Revisit this behavior.
        expect(spyObj.someFunc()).toBe(null);
      });
    });

    describe('containsRegexp', () => {

      it('should allow any prefix and suffix', () => {
        expect(RegExpWrapper.firstMatch(containsRegexp('b'), 'abc')).toBeTruthy();
        expect(RegExpWrapper.firstMatch(containsRegexp('b'), 'adc')).toBeFalsy();
      });

      it('should match various special characters', () => {
        expect(RegExpWrapper.firstMatch(containsRegexp('a.b'), 'a.b')).toBeTruthy();
        expect(RegExpWrapper.firstMatch(containsRegexp('axb'), 'a.b')).toBeFalsy();
      });

    });
  });
}
