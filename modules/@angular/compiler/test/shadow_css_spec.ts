import {describe, beforeEach, it, expect, ddescribe, iit,} from '@angular/core/testing/testing_internal';
import {ShadowCss, processRules, CssRule} from '@angular/compiler/src/shadow_css';

import {RegExpWrapper, StringWrapper, isPresent} from '../src/facade/lang';
import {normalizeCSS} from '@angular/platform-browser/testing';

export function main() {
  describe('ShadowCss', function() {

    function s(css: string, contentAttr: string, hostAttr: string = '') {
      var shadowCss = new ShadowCss();
      var shim = shadowCss.shimCssText(css, contentAttr, hostAttr);
      var nlRegexp = /\n/g;
      return normalizeCSS(StringWrapper.replaceAll(shim, nlRegexp, ''));
    }

    it('should handle empty string', () => { expect(s('', 'a')).toEqual(''); });

    it('should add an attribute to every rule', () => {
      var css = 'one {color: red;}two {color: red;}';
      var expected = 'one[a] {color:red;}two[a] {color:red;}';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should handle invalid css', () => {
      var css = 'one {color: red;}garbage';
      var expected = 'one[a] {color:red;}garbage';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should add an attribute to every selector', () => {
      var css = 'one, two {color: red;}';
      var expected = 'one[a], two[a] {color:red;}';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should support newlines in the selector and content ', () => {
      var css = 'one, \ntwo {\ncolor: red;}';
      var expected = 'one[a], two[a] {color:red;}';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should handle media rules', () => {
      var css = '@media screen and (max-width:800px, max-height:100%) {div {font-size:50px;}}';
      var expected =
          '@media screen and (max-width:800px, max-height:100%) {div[a] {font-size:50px;}}';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should handle media rules with simple rules', () => {
      var css = '@media screen and (max-width: 800px) {div {font-size: 50px;}} div {}';
      var expected = '@media screen and (max-width:800px) {div[a] {font-size:50px;}} div[a] {}';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should handle support rules', () => {
      var css = '@supports (display: flex) {section {display: flex;}}';
      var expected = '@supports (display:flex) {section[a] {display:flex;}}';
      expect(s(css, 'a')).toEqual(expected);
    });

    // Check that the browser supports unprefixed CSS animation
    it('should handle keyframes rules', () => {
      var css = '@keyframes foo {0% {transform:translate(-50%) scaleX(0);}}';
      expect(s(css, 'a')).toEqual(css);
    });

    it('should handle -webkit-keyframes rules', () => {
      var css = '@-webkit-keyframes foo {0% {-webkit-transform:translate(-50%) scaleX(0);}}';
      expect(s(css, 'a')).toEqual(css);
    });

    it('should handle complicated selectors', () => {
      expect(s('one::before {}', 'a')).toEqual('one[a]::before {}');
      expect(s('one two {}', 'a')).toEqual('one[a] two[a] {}');
      expect(s('one > two {}', 'a')).toEqual('one[a] > two[a] {}');
      expect(s('one + two {}', 'a')).toEqual('one[a] + two[a] {}');
      expect(s('one ~ two {}', 'a')).toEqual('one[a] ~ two[a] {}');
      var res = s('.one.two > three {}', 'a');  // IE swap classes
      expect(res == '.one.two[a] > three[a] {}' || res == '.two.one[a] > three[a] {}')
          .toEqual(true);
      expect(s('one[attr="value"] {}', 'a')).toEqual('one[attr="value"][a] {}');
      expect(s('one[attr=value] {}', 'a')).toEqual('one[attr="value"][a] {}');
      expect(s('one[attr^="value"] {}', 'a')).toEqual('one[attr^="value"][a] {}');
      expect(s('one[attr$="value"] {}', 'a')).toEqual('one[attr$="value"][a] {}');
      expect(s('one[attr*="value"] {}', 'a')).toEqual('one[attr*="value"][a] {}');
      expect(s('one[attr|="value"] {}', 'a')).toEqual('one[attr|="value"][a] {}');
      expect(s('one[attr] {}', 'a')).toEqual('one[attr][a] {}');
      expect(s('[is="one"] {}', 'a')).toEqual('[is="one"][a] {}');
    });

    it('should handle :host', () => {
      expect(s(':host {}', 'a', 'a-host')).toEqual('[a-host] {}');
      expect(s(':host(.x,.y) {}', 'a', 'a-host')).toEqual('[a-host].x, [a-host].y {}');
      expect(s(':host(.x,.y) > .z {}', 'a', 'a-host'))
          .toEqual('[a-host].x > .z, [a-host].y > .z {}');
    });

    it('should handle :host-context', () => {
      expect(s(':host-context(.x) {}', 'a', 'a-host')).toEqual('[a-host].x, .x [a-host] {}');
      expect(s(':host-context(.x) > .y {}', 'a', 'a-host'))
          .toEqual('[a-host].x > .y, .x [a-host] > .y {}');
    });

    it('should support polyfill-next-selector', () => {
      var css = s('polyfill-next-selector {content: \'x > y\'} z {}', 'a');
      expect(css).toEqual('x[a] > y[a]{}');

      css = s('polyfill-next-selector {content: "x > y"} z {}', 'a');
      expect(css).toEqual('x[a] > y[a]{}');
    });

    it('should support polyfill-unscoped-rule', () => {
      var css = s('polyfill-unscoped-rule {content: \'#menu > .bar\';color: blue;}', 'a');
      expect(StringWrapper.contains(css, '#menu > .bar {;color:blue;}')).toBeTruthy();

      css = s('polyfill-unscoped-rule {content: "#menu > .bar";color: blue;}', 'a');
      expect(StringWrapper.contains(css, '#menu > .bar {;color:blue;}')).toBeTruthy();
    });

    it('should support multiple instances polyfill-unscoped-rule', () => {
      var css =
          s('polyfill-unscoped-rule {content: \'foo\';color: blue;}' +
                'polyfill-unscoped-rule {content: \'bar\';color: blue;}',
            'a');
      expect(StringWrapper.contains(css, 'foo {;color:blue;}')).toBeTruthy();
      expect(StringWrapper.contains(css, 'bar {;color:blue;}')).toBeTruthy();
    });

    it('should support polyfill-rule', () => {
      var css = s('polyfill-rule {content: \':host.foo .bar\';color: blue;}', 'a', 'a-host');
      expect(css).toEqual('[a-host].foo .bar {;color:blue;}');

      css = s('polyfill-rule {content: ":host.foo .bar";color:blue;}', 'a', 'a-host');
      expect(css).toEqual('[a-host].foo .bar {;color:blue;}');
    });

    it('should handle ::shadow', () => {
      var css = s('x::shadow > y {}', 'a');
      expect(css).toEqual('x[a] > y[a] {}');
    });

    it('should handle /deep/', () => {
      var css = s('x /deep/ y {}', 'a');
      expect(css).toEqual('x[a] y {}');
    });

    it('should handle >>>', () => {
      var css = s('x >>> y {}', 'a');
      expect(css).toEqual('x[a] y {}');
    });

    it('should pass through @import directives', () => {
      var styleStr = '@import url("https://fonts.googleapis.com/css?family=Roboto");';
      var css = s(styleStr, 'a');
      expect(css).toEqual(styleStr);
    });

    it('should shim rules after @import', () => {
      var styleStr = '@import url("a"); div {}';
      var css = s(styleStr, 'a');
      expect(css).toEqual('@import url("a"); div[a] {}');
    });

    it('should leave calc() unchanged', () => {
      var styleStr = 'div {height:calc(100% - 55px);}';
      var css = s(styleStr, 'a');
      expect(css).toEqual('div[a] {height:calc(100% - 55px);}');
    });

    it('should strip comments', () => { expect(s('/* x */b {c}', 'a')).toEqual('b[a] {c}'); });

    it('should ignore special characters in comments',
       () => { expect(s('/* {;, */b {c}', 'a')).toEqual('b[a] {c}'); });

    it('should support multiline comments',
       () => { expect(s('/* \n */b {c}', 'a')).toEqual('b[a] {c}'); });
  });

  describe('processRules', () => {
    describe('parse rules', () => {
      function captureRules(input: string): CssRule[] {
        var result: any[] /** TODO #9100 */ = [];
        processRules(input, (cssRule: any /** TODO #9100 */) => {
          result.push(cssRule);
          return cssRule;
        });
        return result;
      }

      it('should work with empty css', () => { expect(captureRules('')).toEqual([]); });

      it('should capture a rule without body',
         () => { expect(captureRules('a;')).toEqual([new CssRule('a', '')]); });

      it('should capture css rules with body',
         () => { expect(captureRules('a {b}')).toEqual([new CssRule('a', 'b')]); });

      it('should capture css rules with nested rules', () => {
        expect(captureRules('a {b {c}} d {e}')).toEqual([
          new CssRule('a', 'b {c}'), new CssRule('d', 'e')
        ]);
      });

      it('should capture multiple rules where some have no body', () => {
        expect(captureRules('@import a ; b {c}')).toEqual([
          new CssRule('@import a', ''), new CssRule('b', 'c')
        ]);
      });
    });

    describe('modify rules', () => {
      it('should allow to change the selector while preserving whitespaces', () => {
        expect(processRules(
                   '@import a; b {c {d}} e {f}', (cssRule: any /** TODO #9100 */) => new CssRule(
                                                     cssRule.selector + '2', cssRule.content)))
            .toEqual('@import a2; b2 {c {d}} e2 {f}');
      });

      it('should allow to change the content', () => {
        expect(processRules(
                   'a {b}', (cssRule: any /** TODO #9100 */) =>
                                new CssRule(cssRule.selector, cssRule.content + '2')))
            .toEqual('a {b2}');
      });
    });
  });
}
