import {AsyncTestCompleter, afterEach, beforeEach, ddescribe, describe, expect, iit, inject, it} from '@angular/core/testing/testing_internal';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

import {parseCookieValue} from '../../src/browser/browser_adapter';

export function main() {
  describe('cookies', () => {
    it('parses cookies', () => {
      let cookie = 'other-cookie=false; xsrf-token=token-value; is_awesome=true; ffo=true;';
      expect(parseCookieValue(cookie, 'xsrf-token')).toBe('token-value');
    });
    it('handles encoded keys', () => {
      expect(parseCookieValue('whitespace%20token=token-value', 'whitespace token'))
          .toBe('token-value');
    });
    it('handles encoded values', () => {
      expect(parseCookieValue('token=whitespace%20', 'token')).toBe('whitespace ');
      expect(parseCookieValue('token=whitespace%0A', 'token')).toBe('whitespace\n');
    });
    it('sets cookie values', () => {
      getDOM().setCookie('my test cookie', 'my test value');
      getDOM().setCookie('my other cookie', 'my test value 2');
      expect(getDOM().getCookie('my test cookie')).toBe('my test value');
    });
  });
}
