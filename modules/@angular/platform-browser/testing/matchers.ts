import {getDOM} from '../src/dom/dom_adapter';
import {StringMapWrapper} from '../src/facade/collection';
import {global, isString} from '../src/facade/lang';


/**
 * Jasmine matchers that check Angular specific conditions.
 */
export interface NgMatchers extends jasmine.Matchers {
  /**
   * Expect the value to be a `Promise`.
   *
   * ## Example
   *
   * {@example testing/ts/matchers.ts region='toBePromise'}
   */
  toBePromise(): boolean;

  /**
   * Expect the value to be an instance of a class.
   *
   * ## Example
   *
   * {@example testing/ts/matchers.ts region='toBeAnInstanceOf'}
   */
  toBeAnInstanceOf(expected: any): boolean;

  /**
   * Expect the element to have exactly the given text.
   *
   * ## Example
   *
   * {@example testing/ts/matchers.ts region='toHaveText'}
   */
  toHaveText(expected: any): boolean;

  /**
   * Expect the element to have the given CSS class.
   *
   * ## Example
   *
   * {@example testing/ts/matchers.ts region='toHaveCssClass'}
   */
  toHaveCssClass(expected: any): boolean;

  /**
   * Expect the element to have the given CSS styles.
   *
   * ## Example
   *
   * {@example testing/ts/matchers.ts region='toHaveCssStyle'}
   */
  toHaveCssStyle(expected: any): boolean;

  /**
   * Expect a class to implement the interface of the given class.
   *
   * ## Example
   *
   * {@example testing/ts/matchers.ts region='toImplement'}
   */
  toImplement(expected: any): boolean;

  /**
   * Expect an exception to contain the given error text.
   *
   * ## Example
   *
   * {@example testing/ts/matchers.ts region='toContainError'}
   */
  toContainError(expected: any): boolean;

  /**
   * Expect a function to throw an error with the given error text when executed.
   *
   * ## Example
   *
   * {@example testing/ts/matchers.ts region='toThrowErrorWith'}
   */
  toThrowErrorWith(expectedMessage: any): boolean;

  /**
   * Expect a string to match the given regular expression.
   *
   * ## Example
   *
   * {@example testing/ts/matchers.ts region='toMatchPattern'}
   */
  toMatchPattern(expectedMessage: any): boolean;

  /**
   * Invert the matchers.
   */
  not: NgMatchers;
}

var _global = <any>(typeof window === 'undefined' ? global : window);

/**
 * Jasmine matching function with Angular matchers mixed in.
 *
 * ## Example
 *
 * {@example testing/ts/matchers.ts region='toHaveText'}
 */
export var expect: (actual: any) => NgMatchers = <any>_global.expect;


// Some Map polyfills don't polyfill Map.toString correctly, which
// gives us bad error messages in tests.
// The only way to do this in Jasmine is to monkey patch a method
// to the object :-(
(Map as any /** TODO #???? */).prototype['jasmineToString'] = function() {
  var m = this;
  if (!m) {
    return '' + m;
  }
  var res: any[] /** TODO #???? */ = [];
  m.forEach((v: any /** TODO #???? */, k: any /** TODO #???? */) => { res.push(`${k}:${v}`); });
  return `{ ${res.join(',')} }`;
};

_global.beforeEach(function() {
  jasmine.addMatchers({
    // Custom handler for Map as Jasmine does not support it yet
    toEqual: function(util, customEqualityTesters) {
      return {
        compare: function(actual: any /** TODO #???? */, expected: any /** TODO #???? */) {
          return {pass: util.equals(actual, expected, [compareMap])};
        }
      };

      function compareMap(actual: any /** TODO #???? */, expected: any /** TODO #???? */) {
        if (actual instanceof Map) {
          var pass = actual.size === expected.size;
          if (pass) {
            actual.forEach((v: any /** TODO #???? */, k: any /** TODO #???? */) => {
              pass = pass && util.equals(v, expected.get(k));
            });
          }
          return pass;
        } else {
          return undefined;
        }
      }
    },

    toBePromise: function() {
      return {
        compare: function(actual: any /** TODO #???? */, expectedClass: any /** TODO #???? */) {
          var pass = typeof actual === 'object' && typeof actual.then === 'function';
          return {pass: pass, get message() { return 'Expected ' + actual + ' to be a promise'; }};
        }
      };
    },

    toBeAnInstanceOf: function() {
      return {
        compare: function(actual: any /** TODO #???? */, expectedClass: any /** TODO #???? */) {
          var pass = typeof actual === 'object' && actual instanceof expectedClass;
          return {
            pass: pass,
            get message() {
              return 'Expected ' + actual + ' to be an instance of ' + expectedClass;
            }
          };
        }
      };
    },

    toHaveText: function() {
      return {
        compare: function(actual: any /** TODO #???? */, expectedText: any /** TODO #???? */) {
          var actualText = elementText(actual);
          return {
            pass: actualText == expectedText,
            get message() { return 'Expected ' + actualText + ' to be equal to ' + expectedText; }
          };
        }
      };
    },

    toHaveCssClass: function() {
      return {compare: buildError(false), negativeCompare: buildError(true)};

      function buildError(isNot: any /** TODO #???? */) {
        return function(actual: any /** TODO #???? */, className: any /** TODO #???? */) {
          return {
            pass: getDOM().hasClass(actual, className) == !isNot,
            get message() {
              return `Expected ${actual.outerHTML} ${isNot ? 'not ' : ''}to contain the CSS class "${className}"`;
            }
          };
        };
      }
    },

    toHaveCssStyle: function() {
      return {
        compare: function(actual: any /** TODO #???? */, styles: any /** TODO #???? */) {
          var allPassed: any /** TODO #???? */;
          if (isString(styles)) {
            allPassed = getDOM().hasStyle(actual, styles);
          } else {
            allPassed = !StringMapWrapper.isEmpty(styles);
            StringMapWrapper.forEach(
                styles, (style: any /** TODO #???? */, prop: any /** TODO #???? */) => {
                  allPassed = allPassed && getDOM().hasStyle(actual, prop, style);
                });
          }

          return {
            pass: allPassed,
            get message() {
              var expectedValueStr = isString(styles) ? styles : JSON.stringify(styles);
              return `Expected ${actual.outerHTML} ${!allPassed ? ' ' : 'not '}to contain the
                      CSS ${isString(styles) ? 'property' : 'styles'} "${expectedValueStr}"`;
            }
          };
        }
      };
    },

    toContainError: function() {
      return {
        compare: function(actual: any /** TODO #???? */, expectedText: any /** TODO #???? */) {
          var errorMessage = actual.toString();
          return {
            pass: errorMessage.indexOf(expectedText) > -1,
            get message() { return 'Expected ' + errorMessage + ' to contain ' + expectedText; }
          };
        }
      };
    },

    toThrowErrorWith: function() {
      return {
        compare: function(actual: any /** TODO #???? */, expectedText: any /** TODO #???? */) {
          try {
            actual();
            return {
              pass: false,
              get message() { return 'Was expected to throw, but did not throw'; }
            };
          } catch (e) {
            var errorMessage = e.toString();
            return {
              pass: errorMessage.indexOf(expectedText) > -1,
              get message() { return 'Expected ' + errorMessage + ' to contain ' + expectedText; }
            };
          }
        }
      };
    },

    toMatchPattern() {
      return {compare: buildError(false), negativeCompare: buildError(true)};

      function buildError(isNot: any /** TODO #???? */) {
        return function(actual: any /** TODO #???? */, regex: any /** TODO #???? */) {
          return {
            pass: regex.test(actual) == !isNot,
            get message() {
              return `Expected ${actual} ${isNot ? 'not ' : ''}to match ${regex.toString()}`;
            }
          };
        };
      }
    },

    toImplement: function() {
      return {
        compare: function(
            actualObject: any /** TODO #???? */, expectedInterface: any /** TODO #???? */) {
          var objProps = Object.keys(actualObject.constructor.prototype);
          var intProps = Object.keys(expectedInterface.prototype);

          var missedMethods: any[] /** TODO #???? */ = [];
          intProps.forEach((k) => {
            if (!actualObject.constructor.prototype[k]) missedMethods.push(k);
          });

          return {
            pass: missedMethods.length == 0,
            get message() {
              return 'Expected ' + actualObject + ' to have the following methods: ' +
                  missedMethods.join(', ');
            }
          };
        }
      };
    }
  });
});

function elementText(n: any /** TODO #???? */): any /** TODO #???? */ {
  var hasNodes = (n: any /** TODO #???? */) => {
    var children = getDOM().childNodes(n);
    return children && children.length > 0;
  };

  if (n instanceof Array) {
    return n.map(elementText).join('');
  }

  if (getDOM().isCommentNode(n)) {
    return '';
  }

  if (getDOM().isElementNode(n) && getDOM().tagName(n) == 'CONTENT') {
    return elementText(Array.prototype.slice.apply(getDOM().getDistributedNodes(n)));
  }

  if (getDOM().hasShadowRoot(n)) {
    return elementText(getDOM().childNodesAsList(getDOM().getShadowRoot(n)));
  }

  if (hasNodes(n)) {
    return elementText(getDOM().childNodesAsList(n));
  }

  return getDOM().getText(n);
}
