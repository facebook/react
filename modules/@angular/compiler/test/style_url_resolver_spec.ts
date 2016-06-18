import {extractStyleUrls, isStyleUrlResolvable} from '@angular/compiler/src/style_url_resolver';
import {UrlResolver} from '@angular/compiler/src/url_resolver';
import {beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing';

export function main() {
  describe('extractStyleUrls', () => {
    var urlResolver: any /** TODO #9100 */;

    beforeEach(() => { urlResolver = new UrlResolver(); });

    it('should not resolve "url()" urls', () => {
      var css = `
      .foo {
        background-image: url("double.jpg");
        background-image: url('simple.jpg');
        background-image: url(noquote.jpg);
      }`;
      var resolvedCss = extractStyleUrls(urlResolver, 'http://ng.io', css).style;
      expect(resolvedCss).toEqual(css);
    });

    it('should extract "@import" urls', () => {
      var css = `
      @import '1.css';
      @import "2.css";
      `;
      var styleWithImports = extractStyleUrls(urlResolver, 'http://ng.io', css);
      expect(styleWithImports.style.trim()).toEqual('');
      expect(styleWithImports.styleUrls).toEqual(['http://ng.io/1.css', 'http://ng.io/2.css']);
    });

    it('should extract "@import url()" urls', () => {
      var css = `
      @import url('3.css');
      @import url("4.css");
      @import url(5.css);
      `;
      var styleWithImports = extractStyleUrls(urlResolver, 'http://ng.io', css);
      expect(styleWithImports.style.trim()).toEqual('');
      expect(styleWithImports.styleUrls).toEqual([
        'http://ng.io/3.css', 'http://ng.io/4.css', 'http://ng.io/5.css'
      ]);
    });

    it('should extract "@import urls and keep rules in the same line', () => {
      var css = `@import url('some.css');div {color: red};`;
      var styleWithImports = extractStyleUrls(urlResolver, 'http://ng.io', css);
      expect(styleWithImports.style.trim()).toEqual('div {color: red};');
      expect(styleWithImports.styleUrls).toEqual(['http://ng.io/some.css']);
    });

    it('should extract media query in "@import"', () => {
      var css = `
      @import 'print1.css' print;
      @import url(print2.css) print;
      `;
      var styleWithImports = extractStyleUrls(urlResolver, 'http://ng.io', css);
      expect(styleWithImports.style.trim()).toEqual('');
      expect(styleWithImports.styleUrls).toEqual([
        'http://ng.io/print1.css', 'http://ng.io/print2.css'
      ]);
    });

    it('should leave absolute non-package @import urls intact', () => {
      var css = `@import url('http://server.com/some.css');`;
      var styleWithImports = extractStyleUrls(urlResolver, 'http://ng.io', css);
      expect(styleWithImports.style.trim()).toEqual(`@import url('http://server.com/some.css');`);
      expect(styleWithImports.styleUrls).toEqual([]);
    });

    it('should resolve package @import urls', () => {
      var css = `@import url('package:a/b/some.css');`;
      var styleWithImports = extractStyleUrls(new FakeUrlResolver(), 'http://ng.io', css);
      expect(styleWithImports.style.trim()).toEqual(``);
      expect(styleWithImports.styleUrls).toEqual(['fake_resolved_url']);
    });

  });

  describe('isStyleUrlResolvable', () => {
    it('should resolve relative urls',
       () => { expect(isStyleUrlResolvable('someUrl.css')).toBe(true); });

    it('should resolve package: urls',
       () => { expect(isStyleUrlResolvable('package:someUrl.css')).toBe(true); });

    it('should resolve asset: urls',
       () => { expect(isStyleUrlResolvable('asset:someUrl.css')).toBe(true); });

    it('should not resolve empty urls', () => {
      expect(isStyleUrlResolvable(null)).toBe(false);
      expect(isStyleUrlResolvable('')).toBe(false);
    });

    it('should not resolve urls with other schema',
       () => { expect(isStyleUrlResolvable('http://otherurl')).toBe(false); });

    it('should not resolve urls with absolute paths', () => {
      expect(isStyleUrlResolvable('/otherurl')).toBe(false);
      expect(isStyleUrlResolvable('//otherurl')).toBe(false);
    });
  });
}

/// The real thing behaves differently between Dart and JS for package URIs.
class FakeUrlResolver extends UrlResolver {
  constructor() { super(); }

  resolve(baseUrl: string, url: string): string { return 'fake_resolved_url'; }
}
