import {LowerCasePipe} from '@angular/common';
import {afterEach, beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing/testing_internal';

export function main() {
  describe('LowerCasePipe', () => {
    var upper: string;
    var lower: string;
    var pipe: LowerCasePipe;

    beforeEach(() => {
      lower = 'something';
      upper = 'SOMETHING';
      pipe = new LowerCasePipe();
    });

    describe('transform', () => {
      it('should return lowercase', () => {
        var val = pipe.transform(upper);
        expect(val).toEqual(lower);
      });

      it('should lowercase when there is a new value', () => {
        var val = pipe.transform(upper);
        expect(val).toEqual(lower);
        var val2 = pipe.transform('WAT');
        expect(val2).toEqual('wat');
      });

      it('should not support other objects',
         () => { expect(() => pipe.transform(<any>{})).toThrowError(); });
    });

  });
}
