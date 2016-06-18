import * as t from '@angular/core/testing/testing_internal';

import {getDOM} from '../../src/dom/dom_adapter';
import {sanitizeStyle} from '../../src/security/style_sanitizer';

export function main() {
  t.describe('Style sanitizer', () => {
    let logMsgs: string[];
    let originalLog: (msg: any) => any;

    t.beforeEach(() => {
      logMsgs = [];
      originalLog = getDOM().log;  // Monkey patch DOM.log.
      getDOM().log = (msg) => logMsgs.push(msg);
    });
    t.afterEach(() => { getDOM().log = originalLog; });

    function expectSanitize(v: string) { return t.expect(sanitizeStyle(v)); }

    t.it('sanitizes values', () => {
      expectSanitize('abc').toEqual('abc');
      expectSanitize('50px').toEqual('50px');
      expectSanitize('rgb(255, 0, 0)').toEqual('rgb(255, 0, 0)');
      expectSanitize('expression(haha)').toEqual('unsafe');
    });
    t.it('rejects unblanaced quotes', () => { expectSanitize('"value" "').toEqual('unsafe'); });
    t.it('accepts transform functions', () => {
      expectSanitize('rotate(90deg)').toEqual('rotate(90deg)');
      expectSanitize('rotate(javascript:evil())').toEqual('unsafe');
      expectSanitize('translateX(12px, -5px)').toEqual('translateX(12px, -5px)');
      expectSanitize('scale3d(1, 1, 2)').toEqual('scale3d(1, 1, 2)');
    });
    t.it('sanitizes URLs', () => {
      expectSanitize('url(foo/bar.png)').toEqual('url(foo/bar.png)');
      expectSanitize('url( foo/bar.png\n )').toEqual('url( foo/bar.png\n )');
      expectSanitize('url(javascript:evil())').toEqual('unsafe');
      expectSanitize('url(strangeprotocol:evil)').toEqual('unsafe');
    });
    t.it('accepts quoted URLs', () => {
      expectSanitize('url("foo/bar.png")').toEqual('url("foo/bar.png")');
      expectSanitize(`url('foo/bar.png')`).toEqual(`url('foo/bar.png')`);
      expectSanitize(`url(  'foo/bar.png'\n )`).toEqual(`url(  'foo/bar.png'\n )`);
      expectSanitize('url("javascript:evil()")').toEqual('unsafe');
      expectSanitize('url( " javascript:evil() " )').toEqual('unsafe');
    });
  });
}
