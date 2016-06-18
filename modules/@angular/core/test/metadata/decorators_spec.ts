import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';

import {Component, Directive} from '@angular/core';
import {reflector} from '@angular/core/src/reflection/reflection';

export function main() {
  describe('es5 decorators', () => {
    it('should declare directive class', () => {
      var MyDirective = Directive({}).Class({constructor: function() { this.works = true; }});
      expect(new MyDirective().works).toEqual(true);
    });

    it('should declare Component class', () => {
      var MyComponent =
          Component({}).View({}).View({}).Class({constructor: function() { this.works = true; }});
      expect(new MyComponent().works).toEqual(true);
    });

    it('should create type in ES5', () => {
      function MyComponent(){};
      var as: any /** TODO #9100 */;
      (<any>MyComponent).annotations = as = Component({}).View({});
      expect(reflector.annotations(MyComponent)).toEqual(as.annotations);
    });
  });
}
