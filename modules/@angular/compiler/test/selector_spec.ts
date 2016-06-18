import {SelectorMatcher} from '@angular/compiler/src/selector';
import {CssSelector} from '@angular/compiler/src/selector';
import {beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {el} from '@angular/platform-browser/testing';

export function main() {
  describe('SelectorMatcher', () => {
    var matcher: any /** TODO #9100 */, selectableCollector: any /** TODO #9100 */,
        s1: any /** TODO #9100 */, s2: any /** TODO #9100 */, s3: any /** TODO #9100 */,
        s4: any /** TODO #9100 */;
    var matched: any[];

    function reset() { matched = []; }

    beforeEach(() => {
      reset();
      s1 = s2 = s3 = s4 = null;
      selectableCollector = (selector: any /** TODO #9100 */, context: any /** TODO #9100 */) => {
        matched.push(selector);
        matched.push(context);
      };
      matcher = new SelectorMatcher();
    });

    it('should select by element name case sensitive', () => {
      matcher.addSelectables(s1 = CssSelector.parse('someTag'), 1);

      expect(matcher.match(CssSelector.parse('SOMEOTHERTAG')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(matcher.match(CssSelector.parse('SOMETAG')[0], selectableCollector)).toEqual(false);
      expect(matched).toEqual([]);

      expect(matcher.match(CssSelector.parse('someTag')[0], selectableCollector)).toEqual(true);
      expect(matched).toEqual([s1[0], 1]);
    });

    it('should select by class name case insensitive', () => {
      matcher.addSelectables(s1 = CssSelector.parse('.someClass'), 1);
      matcher.addSelectables(s2 = CssSelector.parse('.someClass.class2'), 2);

      expect(matcher.match(CssSelector.parse('.SOMEOTHERCLASS')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(matcher.match(CssSelector.parse('.SOMECLASS')[0], selectableCollector)).toEqual(true);
      expect(matched).toEqual([s1[0], 1]);

      reset();
      expect(matcher.match(CssSelector.parse('.someClass.class2')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1, s2[0], 2]);
    });

    it('should select by attr name case sensitive independent of the value', () => {
      matcher.addSelectables(s1 = CssSelector.parse('[someAttr]'), 1);
      matcher.addSelectables(s2 = CssSelector.parse('[someAttr][someAttr2]'), 2);

      expect(matcher.match(CssSelector.parse('[SOMEOTHERATTR]')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(matcher.match(CssSelector.parse('[SOMEATTR]')[0], selectableCollector)).toEqual(false);
      expect(matched).toEqual([]);

      expect(matcher.match(CssSelector.parse('[SOMEATTR=someValue]')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(matcher.match(CssSelector.parse('[someAttr][someAttr2]')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1, s2[0], 2]);

      reset();
      expect(matcher.match(
                 CssSelector.parse('[someAttr=someValue][someAttr2]')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1, s2[0], 2]);

      reset();
      expect(matcher.match(
                 CssSelector.parse('[someAttr2][someAttr=someValue]')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1, s2[0], 2]);

      reset();
      expect(matcher.match(
                 CssSelector.parse('[someAttr2=someValue][someAttr]')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1, s2[0], 2]);
    });

    it('should select by attr name only once if the value is from the DOM', () => {
      matcher.addSelectables(s1 = CssSelector.parse('[some-decor]'), 1);

      var elementSelector = new CssSelector();
      var element = el('<div attr></div>');
      var empty = getDOM().getAttribute(element, 'attr');
      elementSelector.addAttribute('some-decor', empty);
      matcher.match(elementSelector, selectableCollector);
      expect(matched).toEqual([s1[0], 1]);
    });

    it('should select by attr name case sensitive and value case insensitive', () => {
      matcher.addSelectables(s1 = CssSelector.parse('[someAttr=someValue]'), 1);

      expect(matcher.match(CssSelector.parse('[SOMEATTR=SOMEOTHERATTR]')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(matcher.match(CssSelector.parse('[SOMEATTR=SOMEVALUE]')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(matcher.match(CssSelector.parse('[someAttr=SOMEVALUE]')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1]);
    });

    it('should select by element name, class name and attribute name with value', () => {
      matcher.addSelectables(s1 = CssSelector.parse('someTag.someClass[someAttr=someValue]'), 1);

      expect(matcher.match(
                 CssSelector.parse('someOtherTag.someOtherClass[someOtherAttr]')[0],
                 selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(
          matcher.match(
              CssSelector.parse('someTag.someOtherClass[someOtherAttr]')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(matcher.match(
                 CssSelector.parse('someTag.someClass[someOtherAttr]')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(
          matcher.match(CssSelector.parse('someTag.someClass[someAttr]')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);

      expect(
          matcher.match(
              CssSelector.parse('someTag.someClass[someAttr=someValue]')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1]);
    });

    it('should select by many attributes and independent of the value', () => {
      matcher.addSelectables(s1 = CssSelector.parse('input[type=text][control]'), 1);

      var cssSelector = new CssSelector();
      cssSelector.setElement('input');
      cssSelector.addAttribute('type', 'text');
      cssSelector.addAttribute('control', 'one');

      expect(matcher.match(cssSelector, selectableCollector)).toEqual(true);
      expect(matched).toEqual([s1[0], 1]);
    });

    it('should select independent of the order in the css selector', () => {
      matcher.addSelectables(s1 = CssSelector.parse('[someAttr].someClass'), 1);
      matcher.addSelectables(s2 = CssSelector.parse('.someClass[someAttr]'), 2);
      matcher.addSelectables(s3 = CssSelector.parse('.class1.class2'), 3);
      matcher.addSelectables(s4 = CssSelector.parse('.class2.class1'), 4);

      expect(matcher.match(CssSelector.parse('[someAttr].someClass')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1, s2[0], 2]);

      reset();
      expect(matcher.match(CssSelector.parse('.someClass[someAttr]')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1, s2[0], 2]);

      reset();
      expect(matcher.match(CssSelector.parse('.class1.class2')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s3[0], 3, s4[0], 4]);

      reset();
      expect(matcher.match(CssSelector.parse('.class2.class1')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s4[0], 4, s3[0], 3]);
    });

    it('should not select with a matching :not selector', () => {
      matcher.addSelectables(CssSelector.parse('p:not(.someClass)'), 1);
      matcher.addSelectables(CssSelector.parse('p:not([someAttr])'), 2);
      matcher.addSelectables(CssSelector.parse(':not(.someClass)'), 3);
      matcher.addSelectables(CssSelector.parse(':not(p)'), 4);
      matcher.addSelectables(CssSelector.parse(':not(p[someAttr])'), 5);

      expect(matcher.match(CssSelector.parse('p.someClass[someAttr]')[0], selectableCollector))
          .toEqual(false);
      expect(matched).toEqual([]);
    });

    it('should select with a non matching :not selector', () => {
      matcher.addSelectables(s1 = CssSelector.parse('p:not(.someClass)'), 1);
      matcher.addSelectables(s2 = CssSelector.parse('p:not(.someOtherClass[someAttr])'), 2);
      matcher.addSelectables(s3 = CssSelector.parse(':not(.someClass)'), 3);
      matcher.addSelectables(s4 = CssSelector.parse(':not(.someOtherClass[someAttr])'), 4);

      expect(matcher.match(
                 CssSelector.parse('p[someOtherAttr].someOtherClass')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1, s2[0], 2, s3[0], 3, s4[0], 4]);
    });

    it('should match with multiple :not selectors', () => {
      matcher.addSelectables(s1 = CssSelector.parse('div:not([a]):not([b])'), 1);
      expect(matcher.match(CssSelector.parse('div[a]')[0], selectableCollector)).toBe(false);
      expect(matcher.match(CssSelector.parse('div[b]')[0], selectableCollector)).toBe(false);
      expect(matcher.match(CssSelector.parse('div[c]')[0], selectableCollector)).toBe(true);
    });

    it('should select with one match in a list', () => {
      matcher.addSelectables(s1 = CssSelector.parse('input[type=text], textbox'), 1);

      expect(matcher.match(CssSelector.parse('textbox')[0], selectableCollector)).toEqual(true);
      expect(matched).toEqual([s1[1], 1]);

      reset();
      expect(matcher.match(CssSelector.parse('input[type=text]')[0], selectableCollector))
          .toEqual(true);
      expect(matched).toEqual([s1[0], 1]);
    });

    it('should not select twice with two matches in a list', () => {
      matcher.addSelectables(s1 = CssSelector.parse('input, .someClass'), 1);

      expect(matcher.match(CssSelector.parse('input.someclass')[0], selectableCollector))
          .toEqual(true);
      expect(matched.length).toEqual(2);
      expect(matched).toEqual([s1[0], 1]);
    });
  });

  describe('CssSelector.parse', () => {
    it('should detect element names', () => {
      var cssSelector = CssSelector.parse('sometag')[0];
      expect(cssSelector.element).toEqual('sometag');
      expect(cssSelector.toString()).toEqual('sometag');
    });

    it('should detect class names', () => {
      var cssSelector = CssSelector.parse('.someClass')[0];
      expect(cssSelector.classNames).toEqual(['someclass']);

      expect(cssSelector.toString()).toEqual('.someclass');
    });

    it('should detect attr names', () => {
      var cssSelector = CssSelector.parse('[attrname]')[0];
      expect(cssSelector.attrs).toEqual(['attrname', '']);

      expect(cssSelector.toString()).toEqual('[attrname]');
    });

    it('should detect attr values', () => {
      var cssSelector = CssSelector.parse('[attrname=attrvalue]')[0];
      expect(cssSelector.attrs).toEqual(['attrname', 'attrvalue']);
      expect(cssSelector.toString()).toEqual('[attrname=attrvalue]');
    });

    it('should detect multiple parts', () => {
      var cssSelector = CssSelector.parse('sometag[attrname=attrvalue].someclass')[0];
      expect(cssSelector.element).toEqual('sometag');
      expect(cssSelector.attrs).toEqual(['attrname', 'attrvalue']);
      expect(cssSelector.classNames).toEqual(['someclass']);

      expect(cssSelector.toString()).toEqual('sometag.someclass[attrname=attrvalue]');
    });

    it('should detect multiple attributes', () => {
      var cssSelector = CssSelector.parse('input[type=text][control]')[0];
      expect(cssSelector.element).toEqual('input');
      expect(cssSelector.attrs).toEqual(['type', 'text', 'control', '']);

      expect(cssSelector.toString()).toEqual('input[type=text][control]');
    });

    it('should detect :not', () => {
      var cssSelector = CssSelector.parse('sometag:not([attrname=attrvalue].someclass)')[0];
      expect(cssSelector.element).toEqual('sometag');
      expect(cssSelector.attrs.length).toEqual(0);
      expect(cssSelector.classNames.length).toEqual(0);

      var notSelector = cssSelector.notSelectors[0];
      expect(notSelector.element).toEqual(null);
      expect(notSelector.attrs).toEqual(['attrname', 'attrvalue']);
      expect(notSelector.classNames).toEqual(['someclass']);

      expect(cssSelector.toString()).toEqual('sometag:not(.someclass[attrname=attrvalue])');
    });

    it('should detect :not without truthy', () => {
      var cssSelector = CssSelector.parse(':not([attrname=attrvalue].someclass)')[0];
      expect(cssSelector.element).toEqual('*');

      var notSelector = cssSelector.notSelectors[0];
      expect(notSelector.attrs).toEqual(['attrname', 'attrvalue']);
      expect(notSelector.classNames).toEqual(['someclass']);

      expect(cssSelector.toString()).toEqual('*:not(.someclass[attrname=attrvalue])');
    });

    it('should throw when nested :not', () => {
      expect(() => {
        CssSelector.parse('sometag:not(:not([attrname=attrvalue].someclass))')[0];
      }).toThrowError('Nesting :not is not allowed in a selector');
    });

    it('should throw when multiple selectors in :not', () => {
      expect(() => {
        CssSelector.parse('sometag:not(a,b)');
      }).toThrowError('Multiple selectors in :not are not supported');
    });

    it('should detect lists of selectors', () => {
      var cssSelectors = CssSelector.parse('.someclass,[attrname=attrvalue], sometag');
      expect(cssSelectors.length).toEqual(3);

      expect(cssSelectors[0].classNames).toEqual(['someclass']);
      expect(cssSelectors[1].attrs).toEqual(['attrname', 'attrvalue']);
      expect(cssSelectors[2].element).toEqual('sometag');
    });

    it('should detect lists of selectors with :not', () => {
      var cssSelectors =
          CssSelector.parse('input[type=text], :not(textarea), textbox:not(.special)');
      expect(cssSelectors.length).toEqual(3);

      expect(cssSelectors[0].element).toEqual('input');
      expect(cssSelectors[0].attrs).toEqual(['type', 'text']);

      expect(cssSelectors[1].element).toEqual('*');
      expect(cssSelectors[1].notSelectors[0].element).toEqual('textarea');

      expect(cssSelectors[2].element).toEqual('textbox');
      expect(cssSelectors[2].notSelectors[0].classNames).toEqual(['special']);
    });
  });

  describe('CssSelector.getMatchingElementTemplate', () => {
    it('should create an element with a tagName, classes, and attributes with the correct casing',
       () => {
         let selector = CssSelector.parse('Blink.neon.hotpink[Sweet][Dismissable=false]')[0];
         let template = selector.getMatchingElementTemplate();

         expect(template).toEqual('<Blink class="neon hotpink" Sweet Dismissable="false"></Blink>');
       });

    it('should create an element without a tag name', () => {
      let selector = CssSelector.parse('[fancy]')[0];
      let template = selector.getMatchingElementTemplate();

      expect(template).toEqual('<div fancy></div>');
    });

    it('should ignore :not selectors', () => {
      let selector = CssSelector.parse('grape:not(.red)')[0];
      let template = selector.getMatchingElementTemplate();

      expect(template).toEqual('<grape></grape>');
    });
  });
}
