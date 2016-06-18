import * as t from '@angular/core/testing/testing_internal';
import {browserDetection} from '@angular/platform-browser/testing';

import {getDOM} from '../../src/dom/dom_adapter';
import {sanitizeHtml} from '../../src/security/html_sanitizer';

export function main() {
  t.describe('HTML sanitizer', () => {
    let originalLog: (msg: any) => any = null;
    let logMsgs: string[];

    t.beforeEach(() => {
      logMsgs = [];
      originalLog = getDOM().log;  // Monkey patch DOM.log.
      getDOM().log = (msg) => logMsgs.push(msg);
    });
    t.afterEach(() => { getDOM().log = originalLog; });

    t.it('serializes nested structures', () => {
      t.expect(sanitizeHtml('<div alt="x"><p>a</p>b<b>c<a alt="more">d</a></b>e</div>'))
          .toEqual('<div alt="x"><p>a</p>b<b>c<a alt="more">d</a></b>e</div>');
      t.expect(logMsgs).toEqual([]);
    });
    t.it('serializes self closing elements', () => {
      t.expect(sanitizeHtml('<p>Hello <br> World</p>')).toEqual('<p>Hello <br> World</p>');
    });
    t.it('supports namespaced elements', () => {
      t.expect(sanitizeHtml('a<my:hr/><my:div>b</my:div>c')).toEqual('abc');
    });
    t.it('supports namespaced attributes', () => {
      t.expect(sanitizeHtml('<a xlink:href="something">t</a>'))
          .toEqual('<a xlink:href="something">t</a>');
      t.expect(sanitizeHtml('<a xlink:evil="something">t</a>')).toEqual('<a>t</a>');
      t.expect(sanitizeHtml('<a xlink:href="javascript:foo()">t</a>'))
          .toEqual('<a xlink:href="unsafe:javascript:foo()">t</a>');
    });

    t.it('supports sanitizing plain text', () => {
      t.expect(sanitizeHtml('Hello, World')).toEqual('Hello, World');
    });
    t.it('ignores non-element, non-attribute nodes', () => {
      t.expect(sanitizeHtml('<!-- comments? -->no.')).toEqual('no.');
      t.expect(sanitizeHtml('<?pi nodes?>no.')).toEqual('no.');
      t.expect(logMsgs.join('\n')).toMatch(/sanitizing HTML stripped some content/);
    });
    t.it('escapes entities', () => {
      t.expect(sanitizeHtml('<p>Hello &lt; World</p>')).toEqual('<p>Hello &lt; World</p>');
      t.expect(sanitizeHtml('<p>Hello < World</p>')).toEqual('<p>Hello &lt; World</p>');
      t.expect(sanitizeHtml('<p alt="% &amp; &quot; !">Hello</p>'))
          .toEqual('<p alt="% &amp; &#34; !">Hello</p>');  // NB: quote encoded as ASCII &#34;.
    });
    t.describe('should strip dangerous elements', () => {
      let dangerousTags = [
        'frameset', 'form', 'param', 'object', 'embed', 'textarea', 'input', 'button', 'option',
        'select', 'script', 'style', 'link', 'base', 'basefont'
      ];

      for (let tag of dangerousTags) {
        t.it(
            `${tag}`, () => { t.expect(sanitizeHtml(`<${tag}>evil!</${tag}>`)).toEqual('evil!'); });
      }
      t.it(`swallows frame entirely`, () => {
        t.expect(sanitizeHtml(`<frame>evil!</frame>`)).not.toContain('<frame>');
      });
    });
    t.describe('should strip dangerous attributes', () => {
      let dangerousAttrs = ['id', 'name', 'style'];

      for (let attr of dangerousAttrs) {
        t.it(`${attr}`, () => {
          t.expect(sanitizeHtml(`<a ${attr}="x">evil!</a>`)).toEqual('<a>evil!</a>');
        });
      }
    });

    if (browserDetection.isWebkit) {
      t.it('should prevent mXSS attacks', function() {
        t.expect(sanitizeHtml('<a href="&#x3000;javascript:alert(1)">CLICKME</a>'))
            .toEqual('<a href="unsafe:javascript:alert(1)">CLICKME</a>');
      });
    }
  });
}
