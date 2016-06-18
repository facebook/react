import {BaseException} from '../facade/exceptions';
import {isBlank, stringify} from '../facade/lang';

import {resolveForwardRef} from './forward_ref';


/**
 * A unique object used for retrieving items from the {@link ReflectiveInjector}.
 *
 * Keys have:
 * - a system-wide unique `id`.
 * - a `token`.
 *
 * `Key` is used internally by {@link ReflectiveInjector} because its system-wide unique `id` allows
 * the
 * injector to store created objects in a more efficient way.
 *
 * `Key` should not be created directly. {@link ReflectiveInjector} creates keys automatically when
 * resolving
 * providers.
 * @experimental
 */
export class ReflectiveKey {
  /**
   * Private
   */
  constructor(public token: Object, public id: number) {
    if (isBlank(token)) {
      throw new BaseException('Token must be defined!');
    }
  }

  /**
   * Returns a stringified token.
   */
  get displayName(): string { return stringify(this.token); }

  /**
   * Retrieves a `Key` for a token.
   */
  static get(token: Object): ReflectiveKey {
    return _globalKeyRegistry.get(resolveForwardRef(token));
  }

  /**
   * @returns the number of keys registered in the system.
   */
  static get numberOfKeys(): number { return _globalKeyRegistry.numberOfKeys; }
}

/**
 * @internal
 */
export class KeyRegistry {
  private _allKeys = new Map<Object, ReflectiveKey>();

  get(token: Object): ReflectiveKey {
    if (token instanceof ReflectiveKey) return token;

    if (this._allKeys.has(token)) {
      return this._allKeys.get(token);
    }

    var newKey = new ReflectiveKey(token, ReflectiveKey.numberOfKeys);
    this._allKeys.set(token, newKey);
    return newKey;
  }

  get numberOfKeys(): number { return this._allKeys.size; }
}

var _globalKeyRegistry = new KeyRegistry();
