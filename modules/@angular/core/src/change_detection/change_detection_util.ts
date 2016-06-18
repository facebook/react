import {areIterablesEqual, isListLikeIterable} from '../facade/collection';
import {isPrimitive, looseIdentical} from '../facade/lang';

export {looseIdentical} from '../facade/lang';

export var uninitialized: Object = /*@ts2dart_const*/ new Object();

export function devModeEqual(a: any, b: any): boolean {
  if (isListLikeIterable(a) && isListLikeIterable(b)) {
    return areIterablesEqual(a, b, devModeEqual);

  } else if (
      !isListLikeIterable(a) && !isPrimitive(a) && !isListLikeIterable(b) && !isPrimitive(b)) {
    return true;

  } else {
    return looseIdentical(a, b);
  }
}

/**
 * Indicates that the result of a {@link PipeMetadata} transformation has changed even though the
 * reference
 * has not changed.
 *
 * The wrapped value will be unwrapped by change detection, and the unwrapped value will be stored.
 *
 * Example:
 *
 * ```
 * if (this._latestValue === this._latestReturnedValue) {
 *    return this._latestReturnedValue;
 *  } else {
 *    this._latestReturnedValue = this._latestValue;
 *    return WrappedValue.wrap(this._latestValue); // this will force update
 *  }
 * ```
 * @stable
 */
export class WrappedValue {
  constructor(public wrapped: any) {}

  static wrap(value: any): WrappedValue { return new WrappedValue(value); }
}

/**
 * Helper class for unwrapping WrappedValue s
 */
export class ValueUnwrapper {
  public hasWrappedValue = false;

  unwrap(value: any): any {
    if (value instanceof WrappedValue) {
      this.hasWrappedValue = true;
      return value.wrapped;
    }
    return value;
  }

  reset() { this.hasWrappedValue = false; }
}

/**
 * Represents a basic change from a previous to a new value.
 * @stable
 */
export class SimpleChange {
  constructor(public previousValue: any, public currentValue: any) {}

  /**
   * Check whether the new value is the first value assigned.
   */
  isFirstChange(): boolean { return this.previousValue === uninitialized; }
}
