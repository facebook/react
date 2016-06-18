import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit, beforeEachProviders,} from '@angular/core/testing/testing_internal';

import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {el, stringifyElement} from '@angular/platform-browser/testing';

export function main() {
  describe('dom adapter', () => {
    it('should not coalesque text nodes', () => {
      var el1 = el('<div>a</div>');
      var el2 = el('<div>b</div>');
      getDOM().appendChild(el2, getDOM().firstChild(el1));
      expect(getDOM().childNodes(el2).length).toBe(2);

      var el2Clone = getDOM().clone(el2);
      expect(getDOM().childNodes(el2Clone).length).toBe(2);
    });

    it('should clone correctly', () => {
      var el1 = el('<div x="y">a<span>b</span></div>');
      var clone = getDOM().clone(el1);

      expect(clone).not.toBe(el1);
      getDOM().setAttribute(clone, 'test', '1');
      expect(stringifyElement(clone)).toEqual('<div test="1" x="y">a<span>b</span></div>');
      expect(getDOM().getAttribute(el1, 'test')).toBeFalsy();

      var cNodes = getDOM().childNodes(clone);
      var firstChild = cNodes[0];
      var secondChild = cNodes[1];
      expect(getDOM().parentElement(firstChild)).toBe(clone);
      expect(getDOM().nextSibling(firstChild)).toBe(secondChild);
      expect(getDOM().isTextNode(firstChild)).toBe(true);

      expect(getDOM().parentElement(secondChild)).toBe(clone);
      expect(getDOM().nextSibling(secondChild)).toBeFalsy();
      expect(getDOM().isElementNode(secondChild)).toBe(true);

    });

    it('should be able to create text nodes and use them with the other APIs', () => {
      var t = getDOM().createTextNode('hello');
      expect(getDOM().isTextNode(t)).toBe(true);
      var d = getDOM().createElement('div');
      getDOM().appendChild(d, t);
      expect(getDOM().getInnerHTML(d)).toEqual('hello');
    });

    it('should set className via the class attribute', () => {
      var d = getDOM().createElement('div');
      getDOM().setAttribute(d, 'class', 'class1');
      expect(d.className).toEqual('class1');
    });

    it('should allow to remove nodes without parents', () => {
      var d = getDOM().createElement('div');
      expect(() => getDOM().remove(d)).not.toThrow();
    });

    if (getDOM().supportsDOMEvents()) {
      describe('getBaseHref', () => {
        beforeEach(() => getDOM().resetBaseElement());

        it('should return null if base element is absent',
           () => { expect(getDOM().getBaseHref()).toBeNull(); });

        it('should return the value of the base element', () => {
          var baseEl = getDOM().createElement('base');
          getDOM().setAttribute(baseEl, 'href', '/drop/bass/connon/');
          var headEl = getDOM().defaultDoc().head;
          getDOM().appendChild(headEl, baseEl);

          var baseHref = getDOM().getBaseHref();
          getDOM().removeChild(headEl, baseEl);
          getDOM().resetBaseElement();

          expect(baseHref).toEqual('/drop/bass/connon/');
        });

        it('should return a relative url', () => {
          var baseEl = getDOM().createElement('base');
          getDOM().setAttribute(baseEl, 'href', 'base');
          var headEl = getDOM().defaultDoc().head;
          getDOM().appendChild(headEl, baseEl);

          var baseHref = getDOM().getBaseHref();
          getDOM().removeChild(headEl, baseEl);
          getDOM().resetBaseElement();

          expect(baseHref.endsWith('/base')).toBe(true);
        });
      });
    }


  });
}
