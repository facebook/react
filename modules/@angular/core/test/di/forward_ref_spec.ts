import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {forwardRef, resolveForwardRef} from '@angular/core/src/di';
import {Type} from '../../src/facade/lang';

export function main() {
  describe('forwardRef', function() {
    it('should wrap and unwrap the reference', () => {
      var ref = forwardRef(() => String);
      expect(ref instanceof Type).toBe(true);
      expect(resolveForwardRef(ref)).toBe(String);
    });
  });
}
