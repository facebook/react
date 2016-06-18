import {ListWrapper} from '../facade/collection';
import {BaseException, WrappedException} from '../facade/exceptions';
import {isBlank, stringify} from '../facade/lang';

import {ReflectiveInjector} from './reflective_injector';
import {ReflectiveKey} from './reflective_key';

function findFirstClosedCycle(keys: any[]): any[] {
  var res: any[] /** TODO #9100 */ = [];
  for (var i = 0; i < keys.length; ++i) {
    if (ListWrapper.contains(res, keys[i])) {
      res.push(keys[i]);
      return res;
    } else {
      res.push(keys[i]);
    }
  }
  return res;
}

function constructResolvingPath(keys: any[]): string {
  if (keys.length > 1) {
    var reversed = findFirstClosedCycle(ListWrapper.reversed(keys));
    var tokenStrs = reversed.map(k => stringify(k.token));
    return ' (' + tokenStrs.join(' -> ') + ')';
  } else {
    return '';
  }
}


/**
 * Base class for all errors arising from misconfigured providers.
 * @stable
 */
export class AbstractProviderError extends BaseException {
  /** @internal */
  message: string;

  /** @internal */
  keys: ReflectiveKey[];

  /** @internal */
  injectors: ReflectiveInjector[];

  /** @internal */
  constructResolvingMessage: Function;

  constructor(
      injector: ReflectiveInjector, key: ReflectiveKey, constructResolvingMessage: Function) {
    super('DI Exception');
    this.keys = [key];
    this.injectors = [injector];
    this.constructResolvingMessage = constructResolvingMessage;
    this.message = this.constructResolvingMessage(this.keys);
  }

  addKey(injector: ReflectiveInjector, key: ReflectiveKey): void {
    this.injectors.push(injector);
    this.keys.push(key);
    this.message = this.constructResolvingMessage(this.keys);
  }

  get context() { return this.injectors[this.injectors.length - 1].debugContext(); }
}

/**
 * Thrown when trying to retrieve a dependency by `Key` from {@link Injector}, but the
 * {@link Injector} does not have a {@link Provider} for {@link Key}.
 *
 * ### Example ([live demo](http://plnkr.co/edit/vq8D3FRB9aGbnWJqtEPE?p=preview))
 *
 * ```typescript
 * class A {
 *   constructor(b:B) {}
 * }
 *
 * expect(() => Injector.resolveAndCreate([A])).toThrowError();
 * ```
 * @stable
 */
export class NoProviderError extends AbstractProviderError {
  constructor(injector: ReflectiveInjector, key: ReflectiveKey) {
    super(injector, key, function(keys: any[]) {
      var first = stringify(ListWrapper.first(keys).token);
      return `No provider for ${first}!${constructResolvingPath(keys)}`;
    });
  }
}

/**
 * Thrown when dependencies form a cycle.
 *
 * ### Example ([live demo](http://plnkr.co/edit/wYQdNos0Tzql3ei1EV9j?p=info))
 *
 * ```typescript
 * var injector = Injector.resolveAndCreate([
 *   {provide: "one", useFactory: (two) => "two", deps: [[new Inject("two")]]},
 *   {provide: "two", useFactory: (one) => "one", deps: [[new Inject("one")]]}
 * ]);
 *
 * expect(() => injector.get("one")).toThrowError();
 * ```
 *
 * Retrieving `A` or `B` throws a `CyclicDependencyError` as the graph above cannot be constructed.
 * @stable
 */
export class CyclicDependencyError extends AbstractProviderError {
  constructor(injector: ReflectiveInjector, key: ReflectiveKey) {
    super(injector, key, function(keys: any[]) {
      return `Cannot instantiate cyclic dependency!${constructResolvingPath(keys)}`;
    });
  }
}

/**
 * Thrown when a constructing type returns with an Error.
 *
 * The `InstantiationError` class contains the original error plus the dependency graph which caused
 * this object to be instantiated.
 *
 * ### Example ([live demo](http://plnkr.co/edit/7aWYdcqTQsP0eNqEdUAf?p=preview))
 *
 * ```typescript
 * class A {
 *   constructor() {
 *     throw new Error('message');
 *   }
 * }
 *
 * var injector = Injector.resolveAndCreate([A]);

 * try {
 *   injector.get(A);
 * } catch (e) {
 *   expect(e instanceof InstantiationError).toBe(true);
 *   expect(e.originalException.message).toEqual("message");
 *   expect(e.originalStack).toBeDefined();
 * }
 * ```
 * @stable
 */
export class InstantiationError extends WrappedException {
  /** @internal */
  keys: ReflectiveKey[];

  /** @internal */
  injectors: ReflectiveInjector[];

  constructor(
      injector: ReflectiveInjector, originalException: any /** TODO #9100 */,
      originalStack: any /** TODO #9100 */, key: ReflectiveKey) {
    super('DI Exception', originalException, originalStack, null);
    this.keys = [key];
    this.injectors = [injector];
  }

  addKey(injector: ReflectiveInjector, key: ReflectiveKey): void {
    this.injectors.push(injector);
    this.keys.push(key);
  }

  get wrapperMessage(): string {
    var first = stringify(ListWrapper.first(this.keys).token);
    return `Error during instantiation of ${first}!${constructResolvingPath(this.keys)}.`;
  }

  get causeKey(): ReflectiveKey { return this.keys[0]; }

  get context() { return this.injectors[this.injectors.length - 1].debugContext(); }
}

/**
 * Thrown when an object other then {@link Provider} (or `Type`) is passed to {@link Injector}
 * creation.
 *
 * ### Example ([live demo](http://plnkr.co/edit/YatCFbPAMCL0JSSQ4mvH?p=preview))
 *
 * ```typescript
 * expect(() => Injector.resolveAndCreate(["not a type"])).toThrowError();
 * ```
 * @stable
 */
export class InvalidProviderError extends BaseException {
  constructor(provider: any /** TODO #9100 */) {
    super(`Invalid provider - only instances of Provider and Type are allowed, got: ${provider}`);
  }
}

/**
 * Thrown when the class has no annotation information.
 *
 * Lack of annotation information prevents the {@link Injector} from determining which dependencies
 * need to be injected into the constructor.
 *
 * ### Example ([live demo](http://plnkr.co/edit/rHnZtlNS7vJOPQ6pcVkm?p=preview))
 *
 * ```typescript
 * class A {
 *   constructor(b) {}
 * }
 *
 * expect(() => Injector.resolveAndCreate([A])).toThrowError();
 * ```
 *
 * This error is also thrown when the class not marked with {@link Injectable} has parameter types.
 *
 * ```typescript
 * class B {}
 *
 * class A {
 *   constructor(b:B) {} // no information about the parameter types of A is available at runtime.
 * }
 *
 * expect(() => Injector.resolveAndCreate([A,B])).toThrowError();
 * ```
 * @stable
 */
export class NoAnnotationError extends BaseException {
  constructor(typeOrFunc: any /** TODO #9100 */, params: any[][]) {
    super(NoAnnotationError._genMessage(typeOrFunc, params));
  }

  private static _genMessage(typeOrFunc: any /** TODO #9100 */, params: any[][]) {
    var signature: any[] /** TODO #9100 */ = [];
    for (var i = 0, ii = params.length; i < ii; i++) {
      var parameter = params[i];
      if (isBlank(parameter) || parameter.length == 0) {
        signature.push('?');
      } else {
        signature.push(parameter.map(stringify).join(' '));
      }
    }
    return 'Cannot resolve all parameters for \'' + stringify(typeOrFunc) + '\'(' +
        signature.join(', ') + '). ' +
        'Make sure that all the parameters are decorated with Inject or have valid type annotations and that \'' +
        stringify(typeOrFunc) + '\' is decorated with Injectable.';
  }
}

/**
 * Thrown when getting an object by index.
 *
 * ### Example ([live demo](http://plnkr.co/edit/bRs0SX2OTQiJzqvjgl8P?p=preview))
 *
 * ```typescript
 * class A {}
 *
 * var injector = Injector.resolveAndCreate([A]);
 *
 * expect(() => injector.getAt(100)).toThrowError();
 * ```
 * @stable
 */
export class OutOfBoundsError extends BaseException {
  constructor(index: any /** TODO #9100 */) { super(`Index ${index} is out-of-bounds.`); }
}

// TODO: add a working example after alpha38 is released
/**
 * Thrown when a multi provider and a regular provider are bound to the same token.
 *
 * ### Example
 *
 * ```typescript
 * expect(() => Injector.resolveAndCreate([
 *   new Provider("Strings", {useValue: "string1", multi: true}),
 *   new Provider("Strings", {useValue: "string2", multi: false})
 * ])).toThrowError();
 * ```
 */
export class MixingMultiProvidersWithRegularProvidersError extends BaseException {
  constructor(provider1: any /** TODO #9100 */, provider2: any /** TODO #9100 */) {
    super(
        'Cannot mix multi providers and regular providers, got: ' + provider1.toString() + ' ' +
        provider2.toString());
  }
}
