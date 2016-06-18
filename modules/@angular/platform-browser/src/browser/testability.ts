import {GetTestability, Injectable, Testability, TestabilityRegistry, setTestabilityGetter} from '@angular/core';

import {getDOM} from '../dom/dom_adapter';
import {ListWrapper} from '../facade/collection';
import {global, isPresent} from '../facade/lang';



class PublicTestability {
  /** @internal */
  _testability: Testability;

  constructor(testability: Testability) { this._testability = testability; }

  isStable(): boolean { return this._testability.isStable(); }

  whenStable(callback: Function) { this._testability.whenStable(callback); }

  findBindings(using: any, provider: string, exactMatch: boolean): any[] {
    return this.findProviders(using, provider, exactMatch);
  }

  findProviders(using: any, provider: string, exactMatch: boolean): any[] {
    return this._testability.findBindings(using, provider, exactMatch);
  }
}

export class BrowserGetTestability implements GetTestability {
  static init() { setTestabilityGetter(new BrowserGetTestability()); }

  addToWindow(registry: TestabilityRegistry): void {
    global.getAngularTestability = (elem: any, findInAncestors: boolean = true) => {
      var testability = registry.findTestabilityInTree(elem, findInAncestors);
      if (testability == null) {
        throw new Error('Could not find testability for element.');
      }
      return new PublicTestability(testability);
    };

    global.getAllAngularTestabilities = () => {
      var testabilities = registry.getAllTestabilities();
      return testabilities.map((testability) => { return new PublicTestability(testability); });
    };

    global.getAllAngularRootElements = () => registry.getAllRootElements();

    var whenAllStable = (callback: any /** TODO #9100 */) => {
      var testabilities = global.getAllAngularTestabilities();
      var count = testabilities.length;
      var didWork = false;
      var decrement = function(didWork_: any /** TODO #9100 */) {
        didWork = didWork || didWork_;
        count--;
        if (count == 0) {
          callback(didWork);
        }
      };
      testabilities.forEach(function(testability: any /** TODO #9100 */) {
        testability.whenStable(decrement);
      });
    };

    if (!global.frameworkStabilizers) {
      global.frameworkStabilizers = ListWrapper.createGrowableSize(0);
    }
    global.frameworkStabilizers.push(whenAllStable);
  }

  findTestabilityInTree(registry: TestabilityRegistry, elem: any, findInAncestors: boolean):
      Testability {
    if (elem == null) {
      return null;
    }
    var t = registry.getTestability(elem);
    if (isPresent(t)) {
      return t;
    } else if (!findInAncestors) {
      return null;
    }
    if (getDOM().isShadowRoot(elem)) {
      return this.findTestabilityInTree(registry, getDOM().getHost(elem), true);
    }
    return this.findTestabilityInTree(registry, getDOM().parentElement(elem), true);
  }
}
