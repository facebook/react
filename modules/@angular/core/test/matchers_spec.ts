import {describe, it, iit, ddescribe, expect, tick, beforeEach,} from '../testing';

import {getDOM} from '../../platform-browser/src/dom/dom_adapter';

export function main() {
  describe('testing', () => {
    describe('toHaveCssClass', () => {
      it('should assert that the CSS class is present', () => {
        var el = getDOM().createElement('div');
        getDOM().addClass(el, 'matias');
        expect(el).toHaveCssClass('matias');
      });

      it('should assert that the CSS class is not present', () => {
        var el = getDOM().createElement('div');
        getDOM().addClass(el, 'matias');
        expect(el).not.toHaveCssClass('fatias');
      });
    });
  });
}
