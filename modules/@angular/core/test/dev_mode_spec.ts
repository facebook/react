import {isDevMode} from '@angular/core';

import {beforeEach, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '../testing';

export function main() {
  describe('dev mode', () => {
    it('is enabled in our tests by default', () => { expect(isDevMode()).toBe(true); });
  });
}
