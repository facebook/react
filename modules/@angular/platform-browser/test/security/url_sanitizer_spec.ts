import * as t from '@angular/core/testing/testing_internal';

import {getDOM} from '../../src/dom/dom_adapter';
import {sanitizeUrl} from '../../src/security/url_sanitizer';

export function main() {
  t.describe('URL sanitizer', () => {
    let logMsgs: string[];
    let originalLog: (msg: any) => any;

    t.beforeEach(() => {
      logMsgs = [];
      originalLog = getDOM().log;  // Monkey patch DOM.log.
      getDOM().log = (msg) => logMsgs.push(msg);
    });
    t.afterEach(() => { getDOM().log = originalLog; });

    t.it('reports unsafe URLs', () => {
      t.expect(sanitizeUrl('javascript:evil()')).toBe('unsafe:javascript:evil()');
      t.expect(logMsgs.join('\n')).toMatch(/sanitizing unsafe URL value/);
    });


    t.describe('valid URLs', () => {
      const validUrls = [
        '',
        'http://abc',
        'HTTP://abc',
        'https://abc',
        'HTTPS://abc',
        'ftp://abc',
        'FTP://abc',
        'mailto:me@example.com',
        'MAILTO:me@example.com',
        'tel:123-123-1234',
        'TEL:123-123-1234',
        '#anchor',
        '/page1.md',
        'http://JavaScript/my.js',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/',  // Truncated.
        'data:video/webm;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/',
      ];
      for (let url of validUrls) {
        t.it(`valid ${url}`, () => t.expect(sanitizeUrl(url)).toEqual(url));
      }
    });

    t.describe('invalid URLs', () => {
      const invalidUrls = [
        'javascript:evil()',
        'JavaScript:abc',
        'evilNewProtocol:abc',
        ' \n Java\n Script:abc',
        '&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;',
        '&#106&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;',
        '&#106 &#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;',
        '&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058',
        '&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A;',
        'jav&#x09;ascript:alert();',
        'jav\u0000ascript:alert();',
        'data:;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/',
        'data:,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/',
        'data:iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/',
        'data:text/javascript;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/',
        'data:application/x-msdownload;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/',
      ];
      for (let url of invalidUrls) {
        t.it(`valid ${url}`, () => t.expect(sanitizeUrl(url)).toMatch(/^unsafe:/));
      }
    });
  });
}
