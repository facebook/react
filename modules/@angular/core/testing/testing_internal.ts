import {provide} from '../index';
import {StringMapWrapper} from '../src/facade/collection';
import {Math, global, isFunction, isPromise} from '../src/facade/lang';

import {AsyncTestCompleter} from './async_test_completer';
import {getTestInjector, inject} from './test_injector';

export {MockAnimationDriver} from './animation/mock_animation_driver';
export {MockAnimationPlayer} from './animation/mock_animation_player';
export {AsyncTestCompleter} from './async_test_completer';
export {inject} from './test_injector';
export {expect} from './testing';

export var proxy: ClassDecorator = (t: any /** TODO #9100 */) => t;

var _global = <any>(typeof window === 'undefined' ? global : window);

export var afterEach: Function = _global.afterEach;

var jsmBeforeEach = _global.beforeEach;
var jsmDescribe = _global.describe;
var jsmDDescribe = _global.fdescribe;
var jsmXDescribe = _global.xdescribe;
var jsmIt = _global.it;
var jsmIIt = _global.fit;
var jsmXIt = _global.xit;

var runnerStack: any[] /** TODO #9100 */ = [];
var inIt = false;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 3000;
var globalTimeOut = jasmine.DEFAULT_TIMEOUT_INTERVAL;

var testInjector = getTestInjector();

/**
 * Mechanism to run `beforeEach()` functions of Angular tests.
 *
 * Note: Jasmine own `beforeEach` is used by this library to handle DI providers.
 */
class BeforeEachRunner {
  private _fns: Array<Function> = [];

  constructor(private _parent: BeforeEachRunner) {}

  beforeEach(fn: Function): void { this._fns.push(fn); }

  run(): void {
    if (this._parent) this._parent.run();
    this._fns.forEach((fn) => { fn(); });
  }
}

// Reset the test providers before each test
jsmBeforeEach(() => { testInjector.reset(); });

function _describe(jsmFn: any /** TODO #9100 */, ...args: any[] /** TODO #9100 */) {
  var parentRunner = runnerStack.length === 0 ? null : runnerStack[runnerStack.length - 1];
  var runner = new BeforeEachRunner(parentRunner);
  runnerStack.push(runner);
  var suite = jsmFn(...args);
  runnerStack.pop();
  return suite;
}

export function describe(...args: any[] /** TODO #9100 */): void {
  return _describe(jsmDescribe, ...args);
}

export function ddescribe(...args: any[] /** TODO #9100 */): void {
  return _describe(jsmDDescribe, ...args);
}

export function xdescribe(...args: any[] /** TODO #9100 */): void {
  return _describe(jsmXDescribe, ...args);
}

export function beforeEach(fn: Function): void {
  if (runnerStack.length > 0) {
    // Inside a describe block, beforeEach() uses a BeforeEachRunner
    runnerStack[runnerStack.length - 1].beforeEach(fn);
  } else {
    // Top level beforeEach() are delegated to jasmine
    jsmBeforeEach(fn);
  }
}

/**
 * Allows overriding default providers defined in test_injector.js.
 *
 * The given function must return a list of DI providers.
 *
 * Example:
 *
 *   beforeEachProviders(() => [
 *     {provide: Compiler, useClass: MockCompiler},
 *     {provide: SomeToken, useValue: myValue},
 *   ]);
 */
export function beforeEachProviders(fn: any /** TODO #9100 */): void {
  jsmBeforeEach(() => {
    var providers = fn();
    if (!providers) return;
    testInjector.addProviders(providers);
  });
}

/**
 * @deprecated
 */
export function beforeEachBindings(fn: any /** TODO #9100 */): void {
  beforeEachProviders(fn);
}

function _it(jsmFn: Function, name: string, testFn: Function, testTimeOut: number): void {
  if (runnerStack.length == 0) {
    // This left here intentionally, as we should never get here, and it aids debugging.
    debugger;
    throw new Error('Empty Stack!');
  }
  var runner = runnerStack[runnerStack.length - 1];
  var timeOut = Math.max(globalTimeOut, testTimeOut);

  jsmFn(name, (done: any /** TODO #9100 */) => {
    var completerProvider = {
      provide: AsyncTestCompleter,
      useFactory: () => {
        // Mark the test as async when an AsyncTestCompleter is injected in an it()
        if (!inIt) throw new Error('AsyncTestCompleter can only be injected in an "it()"');
        return new AsyncTestCompleter();
      }
    };
    testInjector.addProviders([completerProvider]);
    runner.run();

    inIt = true;
    if (testFn.length == 0) {
      let retVal = testFn();
      if (isPromise(retVal)) {
        // Asynchronous test function that returns a Promise - wait for completion.
        (<Promise<any>>retVal).then(done, done.fail);
      } else {
        // Synchronous test function - complete immediately.
        done();
      }
    } else {
      // Asynchronous test function that takes in 'done' parameter.
      testFn(done);
    }
    inIt = false;
  }, timeOut);
}

export function it(
    name: any /** TODO #9100 */, fn: any /** TODO #9100 */,
    timeOut: any /** TODO #9100 */ = null): void {
  return _it(jsmIt, name, fn, timeOut);
}

export function xit(
    name: any /** TODO #9100 */, fn: any /** TODO #9100 */,
    timeOut: any /** TODO #9100 */ = null): void {
  return _it(jsmXIt, name, fn, timeOut);
}

export function iit(
    name: any /** TODO #9100 */, fn: any /** TODO #9100 */,
    timeOut: any /** TODO #9100 */ = null): void {
  return _it(jsmIIt, name, fn, timeOut);
}

export interface GuinessCompatibleSpy extends jasmine.Spy {
  /** By chaining the spy with and.returnValue, all calls to the function will return a specific
   * value. */
  andReturn(val: any): void;
  /** By chaining the spy with and.callFake, all calls to the spy will delegate to the supplied
   * function. */
  andCallFake(fn: Function): GuinessCompatibleSpy;
  /** removes all recorded calls */
  reset(): any /** TODO #9100 */;
}

export class SpyObject {
  constructor(type: any /** TODO #9100 */ = null) {
    if (type) {
      for (var prop in type.prototype) {
        var m: any /** TODO #9100 */ = null;
        try {
          m = type.prototype[prop];
        } catch (e) {
          // As we are creating spys for abstract classes,
          // these classes might have getters that throw when they are accessed.
          // As we are only auto creating spys for methods, this
          // should not matter.
        }
        if (typeof m === 'function') {
          this.spy(prop);
        }
      }
    }
  }
  // Noop so that SpyObject has the same interface as in Dart
  noSuchMethod(args: any /** TODO #9100 */) {}

  spy(name: any /** TODO #9100 */) {
    if (!(this as any /** TODO #9100 */)[name]) {
      (this as any /** TODO #9100 */)[name] = this._createGuinnessCompatibleSpy(name);
    }
    return (this as any /** TODO #9100 */)[name];
  }

  prop(name: any /** TODO #9100 */, value: any /** TODO #9100 */) {
    (this as any /** TODO #9100 */)[name] = value;
  }

  static stub(
      object: any /** TODO #9100 */ = null, config: any /** TODO #9100 */ = null,
      overrides: any /** TODO #9100 */ = null) {
    if (!(object instanceof SpyObject)) {
      overrides = config;
      config = object;
      object = new SpyObject();
    }

    var m = StringMapWrapper.merge(config, overrides);
    StringMapWrapper.forEach(m, (value: any /** TODO #9100 */, key: any /** TODO #9100 */) => {
      object.spy(key).andReturn(value);
    });
    return object;
  }

  /** @internal */
  _createGuinnessCompatibleSpy(name: any /** TODO #9100 */): GuinessCompatibleSpy {
    var newSpy: GuinessCompatibleSpy = <any>jasmine.createSpy(name);
    newSpy.andCallFake = <any>newSpy.and.callFake;
    newSpy.andReturn = <any>newSpy.and.returnValue;
    newSpy.reset = <any>newSpy.calls.reset;
    // revisit return null here (previously needed for rtts_assert).
    newSpy.and.returnValue(null);
    return newSpy;
  }
}
