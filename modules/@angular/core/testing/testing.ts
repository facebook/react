/**
 * Public Test Library for unit testing Angular2 Applications. Uses the
 * Jasmine framework.
 */
import {isPromise} from '../src/facade/lang';

import {TestInjector, async, getTestInjector, inject, injectAsync} from './test_injector';

export {async, inject, injectAsync} from './test_injector';

declare var global: any;

var _global = <any>(typeof window === 'undefined' ? global : window);

export var expect: Function = _global.expect;

/**
 * Run a function (with an optional asynchronous callback) after each test case.
 *
 * See http://jasmine.github.io/ for more details.
 *
 * ## Example:
 *
 * {@example testing/ts/testing.ts region='afterEach'}
 */
export var afterEach: Function = _global.afterEach;

/**
 * Group test cases together under a common description prefix.
 *
 * See http://jasmine.github.io/ for more details.
 *
 * ## Example:
 *
 * {@example testing/ts/testing.ts region='describeIt'}
 */
export var describe: Function = _global.describe;

/**
 * See {@link fdescribe}.
 */
export var ddescribe: Function = _global.fdescribe;

/**
 * Like {@link describe}, but instructs the test runner to only run
 * the test cases in this group. This is useful for debugging.
 *
 * See http://jasmine.github.io/ for more details.
 *
 * ## Example:
 *
 * {@example testing/ts/testing.ts region='fdescribe'}
 */
export var fdescribe: Function = _global.fdescribe;

/**
 * Like {@link describe}, but instructs the test runner to exclude
 * this group of test cases from execution. This is useful for
 * debugging, or for excluding broken tests until they can be fixed.
 *
 * See http://jasmine.github.io/ for more details.
 *
 * ## Example:
 *
 * {@example testing/ts/testing.ts region='xdescribe'}
 */
export var xdescribe: Function = _global.xdescribe;

var jsmBeforeEach = _global.beforeEach;
var jsmIt = _global.it;
var jsmIIt = _global.fit;
var jsmXIt = _global.xit;

var testInjector: TestInjector = getTestInjector();

// Reset the test providers before each test.
jsmBeforeEach(() => { testInjector.reset(); });

/**
 * Allows overriding default providers of the test injector,
 * which are defined in test_injector.js.
 *
 * The given function must return a list of DI providers.
 *
 * ## Example:
 *
 * {@example testing/ts/testing.ts region='beforeEachProviders'}
 */
export function beforeEachProviders(fn: () => Array<any>): void {
  jsmBeforeEach(() => {
    var providers = fn();
    if (!providers) return;
    try {
      testInjector.addProviders(providers);
    } catch (e) {
      throw new Error(
          'beforeEachProviders was called after the injector had ' +
          'been used in a beforeEach or it block. This invalidates the ' +
          'test injector');
    }
  });
}

function _wrapTestFn(fn: Function) {
  // Wraps a test or beforeEach function to handle synchronous and asynchronous execution.
  return (done: any) => {
    if (fn.length === 0) {
      let retVal = fn();
      if (isPromise(retVal)) {
        // Asynchronous test function - wait for completion.
        (<Promise<any>>retVal).then(done, done.fail);
      } else {
        // Synchronous test function - complete immediately.
        done();
      }
    } else {
      // Asynchronous test function that takes "done" as parameter.
      fn(done);
    }
  };
}

function _it(jsmFn: Function, name: string, testFn: Function, testTimeOut: number): void {
  jsmFn(name, _wrapTestFn(testFn), testTimeOut);
}

/**
 * Wrapper around Jasmine beforeEach function.
 *
 * beforeEach may be used with the `inject` function to fetch dependencies.
 *
 * See http://jasmine.github.io/ for more details.
 *
 * ## Example:
 *
 * {@example testing/ts/testing.ts region='beforeEach'}
 */
export function beforeEach(fn: Function): void {
  jsmBeforeEach(_wrapTestFn(fn));
}

/**
 * Define a single test case with the given test name and execution function.
 *
 * The test function can be either a synchronous function, the result of {@link async},
 * or an injected function created via {@link inject}.
 *
 * Wrapper around Jasmine it function. See http://jasmine.github.io/ for more details.
 *
 * ## Example:
 *
 * {@example testing/ts/testing.ts region='describeIt'}
 */
export function it(name: string, fn: Function, timeOut: number = null): void {
  return _it(jsmIt, name, fn, timeOut);
}

/**
 * Like {@link it}, but instructs the test runner to exclude this test
 * entirely. Useful for debugging or for excluding broken tests until
 * they can be fixed.
 *
 * Wrapper around Jasmine xit function. See http://jasmine.github.io/ for more details.
 *
 * ## Example:
 *
 * {@example testing/ts/testing.ts region='xit'}
 */
export function xit(name: string, fn: Function, timeOut: number = null): void {
  return _it(jsmXIt, name, fn, timeOut);
}

/**
 * See {@link fit}.
 */
export function iit(name: string, fn: Function, timeOut: number = null): void {
  return _it(jsmIIt, name, fn, timeOut);
}

/**
 * Like {@link it}, but instructs the test runner to only run this test.
 * Useful for debugging.
 *
 * Wrapper around Jasmine fit function. See http://jasmine.github.io/ for more details.
 *
 * ## Example:
 *
 * {@example testing/ts/testing.ts region='fit'}
 */
export function fit(name: string, fn: Function, timeOut: number = null): void {
  return _it(jsmIIt, name, fn, timeOut);
}
