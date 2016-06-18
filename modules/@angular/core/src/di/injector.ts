import {unimplemented} from '../facade/exceptions';

const _THROW_IF_NOT_FOUND = /*@ts2dart_const*/ new Object();
export const THROW_IF_NOT_FOUND = /*@ts2dart_const*/ _THROW_IF_NOT_FOUND;

/**
 * @stable
 */
export abstract class Injector {
  static THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;

  /**
   * Retrieves an instance from the injector based on the provided token.
   * If not found:
   * - Throws {@link NoProviderError} if no `notFoundValue` that is not equal to
   * Injector.THROW_IF_NOT_FOUND is given
   * - Returns the `notFoundValue` otherwise
   *
   * ### Example ([live demo](http://plnkr.co/edit/HeXSHg?p=preview))
   *
   * ```typescript
   * var injector = ReflectiveInjector.resolveAndCreate([
   *   {provide: "validToken", useValue: "Value"}
   * ]);
   * expect(injector.get("validToken")).toEqual("Value");
   * expect(() => injector.get("invalidToken")).toThrowError();
   * ```
   *
   * `Injector` returns itself when given `Injector` as a token.
   *
   * ```typescript
   * var injector = ReflectiveInjector.resolveAndCreate([]);
   * expect(injector.get(Injector)).toBe(injector);
   * ```
   */
  get(token: any, notFoundValue?: any): any { return unimplemented(); }
}
