import {ddescribe, describe, it, iit, xit, expect, beforeEach, afterEach, inject,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {ReplacePipe} from '@angular/common';
import {RegExpWrapper, StringJoiner} from '../../src/facade/lang';

export function main() {
  describe('ReplacePipe', () => {
    var someNumber: number;
    var str: string;
    var pipe: ReplacePipe;

    beforeEach(() => {
      someNumber = 42;
      str = 'Douglas Adams';
      pipe = new ReplacePipe();
    });

    describe('transform', () => {

      it('should not support input other than strings and numbers', () => {
        expect(() => pipe.transform({}, 'Douglas', 'Hugh')).toThrow();
        expect(() => pipe.transform([1, 2, 3], 'Douglas', 'Hugh')).toThrow();
      });

      it('should not support patterns other than strings and regular expressions', () => {
        expect(() => pipe.transform(str, <any>{}, 'Hugh')).toThrow();
        expect(() => pipe.transform(str, <any>null, 'Hugh')).toThrow();
        expect(() => pipe.transform(str, <any>123, 'Hugh')).toThrow();
      });

      it('should not support replacements other than strings and functions', () => {
        expect(() => pipe.transform(str, 'Douglas', <any>{})).toThrow();
        expect(() => pipe.transform(str, 'Douglas', <any>null)).toThrow();
        expect(() => pipe.transform(str, 'Douglas', <any>123)).toThrow();
      });

      it('should return a new string with the pattern replaced', () => {
        var result1 = pipe.transform(str, 'Douglas', 'Hugh');

        var result2 = pipe.transform(str, RegExpWrapper.create('a'), '_');

        var result3 = pipe.transform(str, RegExpWrapper.create('a', 'i'), '_');

        var f = ((x: any) => { return 'Adams!'; });

        var result4 = pipe.transform(str, 'Adams', f);

        var result5 = pipe.transform(someNumber, '2', '4');

        expect(result1).toEqual('Hugh Adams');
        expect(result2).toEqual('Dougl_s Ad_ms');
        expect(result3).toEqual('Dougl_s _d_ms');
        expect(result4).toEqual('Douglas Adams!');
        expect(result5).toEqual('44');
      });

    });

  });
}
