import {BaseException} from '../facade/exceptions';
import {Type, isBlank, isFunction, isType, normalizeBool, stringify} from '../facade/lang';


/**
 * Describes how the {@link Injector} should instantiate a given token.
 *
 * See {@link provide}.
 *
 * ### Example ([live demo](http://plnkr.co/edit/GNAyj6K6PfYg2NBzgwZ5?p%3Dpreview&p=preview))
 *
 * ```javascript
 * var injector = Injector.resolveAndCreate([
 *   new Provider("message", { useValue: 'Hello' })
 * ]);
 *
 * expect(injector.get("message")).toEqual('Hello');
 * ```
 * @ts2dart_const
 * @deprecated
 */
export class Provider {
  /**
   * Token used when retrieving this provider. Usually, it is a type {@link Type}.
   */
  token: any /** TODO #9100 */;

  /**
   * Binds a DI token to an implementation class.
   *
   * ### Example ([live demo](http://plnkr.co/edit/RSTG86qgmoxCyj9SWPwY?p=preview))
   *
   * Because `useExisting` and `useClass` are often confused, the example contains
   * both use cases for easy comparison.
   *
   * ```typescript
   * class Vehicle {}
   *
   * class Car extends Vehicle {}
   *
   * var injectorClass = Injector.resolveAndCreate([
   *   Car,
   *   {provide: Vehicle,  useClass: Car }
   * ]);
   * var injectorAlias = Injector.resolveAndCreate([
   *   Car,
   *   {provide: Vehicle,  useExisting: Car }
   * ]);
   *
   * expect(injectorClass.get(Vehicle)).not.toBe(injectorClass.get(Car));
   * expect(injectorClass.get(Vehicle) instanceof Car).toBe(true);
   *
   * expect(injectorAlias.get(Vehicle)).toBe(injectorAlias.get(Car));
   * expect(injectorAlias.get(Vehicle) instanceof Car).toBe(true);
   * ```
   */
  useClass: Type;

  /**
   * Binds a DI token to a value.
   *
   * ### Example ([live demo](http://plnkr.co/edit/UFVsMVQIDe7l4waWziES?p=preview))
   *
   * ```javascript
   * var injector = Injector.resolveAndCreate([
   *   new Provider("message", { useValue: 'Hello' })
   * ]);
   *
   * expect(injector.get("message")).toEqual('Hello');
   * ```
   */
  useValue: any /** TODO #9100 */;

  /**
   * Binds a DI token to an existing token.
   *
   * {@link Injector} returns the same instance as if the provided token was used.
   * This is in contrast to `useClass` where a separate instance of `useClass` is returned.
   *
   * ### Example ([live demo](http://plnkr.co/edit/QsatsOJJ6P8T2fMe9gr8?p=preview))
   *
   * Because `useExisting` and `useClass` are often confused the example contains
   * both use cases for easy comparison.
   *
   * ```typescript
   * class Vehicle {}
   *
   * class Car extends Vehicle {}
   *
   * var injectorAlias = Injector.resolveAndCreate([
   *   Car,
   *   {provide: Vehicle,  useExisting: Car }
   * ]);
   * var injectorClass = Injector.resolveAndCreate([
   *   Car,
   *   {provide: Vehicle,  useClass: Car }
   * ]);
   *
   * expect(injectorAlias.get(Vehicle)).toBe(injectorAlias.get(Car));
   * expect(injectorAlias.get(Vehicle) instanceof Car).toBe(true);
   *
   * expect(injectorClass.get(Vehicle)).not.toBe(injectorClass.get(Car));
   * expect(injectorClass.get(Vehicle) instanceof Car).toBe(true);
   * ```
   */
  useExisting: any /** TODO #9100 */;

  /**
   * Binds a DI token to a function which computes the value.
   *
   * ### Example ([live demo](http://plnkr.co/edit/Scoxy0pJNqKGAPZY1VVC?p=preview))
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([
   *   {provide: Number,  useFactory: () => { return 1+2; }},
   *   new Provider(String, { useFactory: (value) => { return "Value: " + value; },
   *                       deps: [Number] })
   * ]);
   *
   * expect(injector.get(Number)).toEqual(3);
   * expect(injector.get(String)).toEqual('Value: 3');
   * ```
   *
   * Used in conjunction with dependencies.
   */
  useFactory: Function;

  /**
   * Specifies a set of dependencies
   * (as `token`s) which should be injected into the factory function.
   *
   * ### Example ([live demo](http://plnkr.co/edit/Scoxy0pJNqKGAPZY1VVC?p=preview))
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([
   *   {provide: Number,  useFactory: () => { return 1+2; }},
   *   new Provider(String, { useFactory: (value) => { return "Value: " + value; },
   *                       deps: [Number] })
   * ]);
   *
   * expect(injector.get(Number)).toEqual(3);
   * expect(injector.get(String)).toEqual('Value: 3');
   * ```
   *
   * Used in conjunction with `useFactory`.
   */
  dependencies: Object[];

  /** @internal */
  _multi: boolean;

  constructor(
      token: any /** TODO #9100 */, {useClass, useValue, useExisting, useFactory, deps, multi}: {
        useClass?: Type,
        useValue?: any,
        useExisting?: any,
        useFactory?: Function,
        deps?: Object[],
        multi?: boolean
      }) {
    this.token = token;
    this.useClass = useClass;
    this.useValue = useValue;
    this.useExisting = useExisting;
    this.useFactory = useFactory;
    this.dependencies = deps;
    this._multi = multi;
  }

  // TODO: Provide a full working example after alpha38 is released.
  /**
   * Creates multiple providers matching the same token (a multi-provider).
   *
   * Multi-providers are used for creating pluggable service, where the system comes
   * with some default providers, and the user can register additional providers.
   * The combination of the default providers and the additional providers will be
   * used to drive the behavior of the system.
   *
   * ### Example
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([
   *   new Provider("Strings", { useValue: "String1", multi: true}),
   *   new Provider("Strings", { useValue: "String2", multi: true})
   * ]);
   *
   * expect(injector.get("Strings")).toEqual(["String1", "String2"]);
   * ```
   *
   * Multi-providers and regular providers cannot be mixed. The following
   * will throw an exception:
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([
   *   new Provider("Strings", { useValue: "String1", multi: true }),
   *   new Provider("Strings", { useValue: "String2"})
   * ]);
   * ```
   */
  get multi(): boolean { return normalizeBool(this._multi); }
}

/**
 * See {@link Provider} instead.
 *
 * @deprecated
 * @ts2dart_const
 */
export class Binding extends Provider {
  constructor(token: any /** TODO #9100 */, {toClass, toValue, toAlias, toFactory, deps, multi}: {
    toClass?: Type,
    toValue?: any,
    toAlias?: any,
    toFactory: Function, deps?: Object[], multi?: boolean
  }) {
    super(token, {
      useClass: toClass,
      useValue: toValue,
      useExisting: toAlias,
      useFactory: toFactory,
      deps: deps,
      multi: multi
    });
  }

  /**
   * @deprecated
   */
  get toClass() { return this.useClass; }

  /**
   * @deprecated
   */
  get toAlias() { return this.useExisting; }

  /**
   * @deprecated
   */
  get toFactory() { return this.useFactory; }

  /**
   * @deprecated
   */
  get toValue() { return this.useValue; }
}

/**
 * Creates a {@link Provider}.
 *
 * To construct a {@link Provider}, bind a `token` to either a class, a value, a factory function,
 * or
 * to an existing `token`.
 * See {@link ProviderBuilder} for more details.
 *
 * The `token` is most commonly a class or {@link OpaqueToken-class.html}.
 *
 * @deprecated
 */
export function bind(token: any /** TODO #9100 */): ProviderBuilder {
  return new ProviderBuilder(token);
}

/**
 * Helper class for the {@link bind} function.
 * @deprecated
 */
export class ProviderBuilder {
  constructor(public token: any /** TODO #9100 */) {}

  /**
   * Binds a DI token to a class.
   *
   * ### Example ([live demo](http://plnkr.co/edit/ZpBCSYqv6e2ud5KXLdxQ?p=preview))
   *
   * Because `toAlias` and `toClass` are often confused, the example contains
   * both use cases for easy comparison.
   *
   * ```typescript
   * class Vehicle {}
   *
   * class Car extends Vehicle {}
   *
   * var injectorClass = Injector.resolveAndCreate([
   *   Car,
   *   {provide: Vehicle, useClass: Car}
   * ]);
   * var injectorAlias = Injector.resolveAndCreate([
   *   Car,
   *   {provide: Vehicle, useExisting: Car}
   * ]);
   *
   * expect(injectorClass.get(Vehicle)).not.toBe(injectorClass.get(Car));
   * expect(injectorClass.get(Vehicle) instanceof Car).toBe(true);
   *
   * expect(injectorAlias.get(Vehicle)).toBe(injectorAlias.get(Car));
   * expect(injectorAlias.get(Vehicle) instanceof Car).toBe(true);
   * ```
   */
  toClass(type: Type): Provider {
    if (!isType(type)) {
      throw new BaseException(
          `Trying to create a class provider but "${stringify(type)}" is not a class!`);
    }
    return new Provider(this.token, {useClass: type});
  }

  /**
   * Binds a DI token to a value.
   *
   * ### Example ([live demo](http://plnkr.co/edit/G024PFHmDL0cJFgfZK8O?p=preview))
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([
   *   {provide: 'message', useValue: 'Hello'}
   * ]);
   *
   * expect(injector.get('message')).toEqual('Hello');
   * ```
   */
  toValue(value: any): Provider { return new Provider(this.token, {useValue: value}); }

  /**
   * Binds a DI token to an existing token.
   *
   * Angular will return the same instance as if the provided token was used. (This is
   * in contrast to `useClass` where a separate instance of `useClass` will be returned.)
   *
   * ### Example ([live demo](http://plnkr.co/edit/uBaoF2pN5cfc5AfZapNw?p=preview))
   *
   * Because `toAlias` and `toClass` are often confused, the example contains
   * both use cases for easy comparison.
   *
   * ```typescript
   * class Vehicle {}
   *
   * class Car extends Vehicle {}
   *
   * var injectorAlias = Injector.resolveAndCreate([
   *   Car,
   *   {provide: Vehicle, useExisting: Car}
   * ]);
   * var injectorClass = Injector.resolveAndCreate([
   *   Car,
   *   {provide: Vehicle, useClass: Car})
   * ]);
   *
   * expect(injectorAlias.get(Vehicle)).toBe(injectorAlias.get(Car));
   * expect(injectorAlias.get(Vehicle) instanceof Car).toBe(true);
   *
   * expect(injectorClass.get(Vehicle)).not.toBe(injectorClass.get(Car));
   * expect(injectorClass.get(Vehicle) instanceof Car).toBe(true);
   * ```
   */
  toAlias(aliasToken: /*Type*/ any): Provider {
    if (isBlank(aliasToken)) {
      throw new BaseException(`Can not alias ${stringify(this.token)} to a blank value!`);
    }
    return new Provider(this.token, {useExisting: aliasToken});
  }

  /**
   * Binds a DI token to a function which computes the value.
   *
   * ### Example ([live demo](http://plnkr.co/edit/OejNIfTT3zb1iBxaIYOb?p=preview))
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([
   *   {provide: Number, useFactory: () => { return 1+2; }},
   *   {provide: String, useFactory: (v) => { return "Value: " + v; }, deps: [Number]}
   * ]);
   *
   * expect(injector.get(Number)).toEqual(3);
   * expect(injector.get(String)).toEqual('Value: 3');
   * ```
   */
  toFactory(factory: Function, dependencies?: any[]): Provider {
    if (!isFunction(factory)) {
      throw new BaseException(
          `Trying to create a factory provider but "${stringify(factory)}" is not a function!`);
    }
    return new Provider(this.token, {useFactory: factory, deps: dependencies});
  }
}

/**
 * Creates a {@link Provider}.
 *
 * See {@link Provider} for more details.
 *
 * <!-- TODO: improve the docs -->
 * @deprecated
 */
export function provide(
    token: any /** TODO #9100 */, {useClass, useValue, useExisting, useFactory, deps, multi}: {
      useClass?: Type,
      useValue?: any,
      useExisting?: any,
      useFactory?: Function,
      deps?: Object[],
      multi?: boolean
    }): Provider {
  return new Provider(token, {
    useClass: useClass,
    useValue: useValue,
    useExisting: useExisting,
    useFactory: useFactory,
    deps: deps,
    multi: multi
  });
}
