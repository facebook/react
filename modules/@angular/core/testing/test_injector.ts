import {PLATFORM_INITIALIZER, Provider, ReflectiveInjector, Type} from '../index';
import {lockRunMode} from '../src/application_ref';
import {ListWrapper} from '../src/facade/collection';
import {BaseException} from '../src/facade/exceptions';
import {FunctionWrapper, isPresent} from '../src/facade/lang';

import {async} from './async';
import {AsyncTestCompleter} from './async_test_completer';

export {async} from './async';

export class TestInjector {
  private _instantiated: boolean = false;

  private _injector: ReflectiveInjector = null;

  private _providers: Array<Type|Provider|any[]|any> = [];

  reset() {
    this._injector = null;
    this._providers = [];
    this._instantiated = false;
  }

  platformProviders: Array<Type|Provider|any[]|any> = [];

  applicationProviders: Array<Type|Provider|any[]|any> = [];

  addProviders(providers: Array<Type|Provider|any[]|any>) {
    if (this._instantiated) {
      throw new BaseException('Cannot add providers after test injector is instantiated');
    }
    this._providers = ListWrapper.concat(this._providers, providers);
  }

  createInjector() {
    lockRunMode();
    var rootInjector = ReflectiveInjector.resolveAndCreate(this.platformProviders);
    this._injector = rootInjector.resolveAndCreateChild(
        ListWrapper.concat(this.applicationProviders, this._providers));
    this._instantiated = true;
    return this._injector;
  }

  get(token: any) {
    if (!this._instantiated) {
      this.createInjector();
    }
    return this._injector.get(token);
  }

  execute(tokens: any[], fn: Function): any {
    if (!this._instantiated) {
      this.createInjector();
    }
    var params = tokens.map(t => this._injector.get(t));
    return FunctionWrapper.apply(fn, params);
  }
}

var _testInjector: TestInjector = null;

export function getTestInjector() {
  if (_testInjector == null) {
    _testInjector = new TestInjector();
  }
  return _testInjector;
}

/**
 * Set the providers that the test injector should use. These should be providers
 * common to every test in the suite.
 *
 * This may only be called once, to set up the common providers for the current test
 * suite on teh current platform. If you absolutely need to change the providers,
 * first use `resetBaseTestProviders`.
 *
 * Test Providers for individual platforms are available from
 * 'angular2/platform/testing/<platform_name>'.
 */
export function setBaseTestProviders(
    platformProviders: Array<Type|Provider|any[]>,
    applicationProviders: Array<Type|Provider|any[]>) {
  var testInjector = getTestInjector();
  if (testInjector.platformProviders.length > 0 || testInjector.applicationProviders.length > 0) {
    throw new BaseException('Cannot set base providers because it has already been called');
  }
  testInjector.platformProviders = platformProviders;
  testInjector.applicationProviders = applicationProviders;
  var injector = testInjector.createInjector();
  let inits: Function[] = injector.get(PLATFORM_INITIALIZER, null);
  if (isPresent(inits)) {
    inits.forEach(init => init());
  }
  testInjector.reset();
}

/**
 * Reset the providers for the test injector.
 */
export function resetBaseTestProviders() {
  var testInjector = getTestInjector();
  testInjector.platformProviders = [];
  testInjector.applicationProviders = [];
  testInjector.reset();
}

/**
 * Allows injecting dependencies in `beforeEach()` and `it()`.
 *
 * Example:
 *
 * ```
 * beforeEach(inject([Dependency, AClass], (dep, object) => {
 *   // some code that uses `dep` and `object`
 *   // ...
 * }));
 *
 * it('...', inject([AClass], (object) => {
 *   object.doSomething();
 *   expect(...);
 * })
 * ```
 *
 * Notes:
 * - inject is currently a function because of some Traceur limitation the syntax should
 * eventually
 *   becomes `it('...', @Inject (object: AClass, async: AsyncTestCompleter) => { ... });`
 *
 */
export function inject(tokens: any[], fn: Function): Function {
  let testInjector = getTestInjector();
  if (tokens.indexOf(AsyncTestCompleter) >= 0) {
    // Return an async test method that returns a Promise if AsyncTestCompleter is one of the
    // injected tokens.
    return () => {
      let completer: AsyncTestCompleter = testInjector.get(AsyncTestCompleter);
      testInjector.execute(tokens, fn);
      return completer.promise;
    };
  } else {
    // Return a synchronous test method with the injected tokens.
    return () => { return getTestInjector().execute(tokens, fn); };
  }
}

export class InjectSetupWrapper {
  constructor(private _providers: () => any) {}

  private _addProviders() {
    var additionalProviders = this._providers();
    if (additionalProviders.length > 0) {
      getTestInjector().addProviders(additionalProviders);
    }
  }

  inject(tokens: any[], fn: Function): Function {
    return () => {
      this._addProviders();
      return inject_impl(tokens, fn)();
    };
  }

  /** @deprecated {use async(withProviders().inject())} */
  injectAsync(tokens: any[], fn: Function): Function {
    return () => {
      this._addProviders();
      return injectAsync_impl(tokens, fn)();
    };
  }
}

export function withProviders(providers: () => any) {
  return new InjectSetupWrapper(providers);
}

/**
 * @deprecated {use async(inject())}
 *
 * Allows injecting dependencies in `beforeEach()` and `it()`. The test must return
 * a promise which will resolve when all asynchronous activity is complete.
 *
 * Example:
 *
 * ```
 * it('...', injectAsync([AClass], (object) => {
 *   return object.doSomething().then(() => {
 *     expect(...);
 *   });
 * })
 * ```
 *
 */
export function injectAsync(tokens: any[], fn: Function): Function {
  return async(inject(tokens, fn));
}

// This is to ensure inject(Async) within InjectSetupWrapper doesn't call itself
// when transpiled to Dart.
var inject_impl = inject;
var injectAsync_impl = injectAsync;
