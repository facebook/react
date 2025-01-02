/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class LRU<TKey, TValue> {
  #size: number;
  #cache: Map<TKey, TValue> = new Map();

  constructor(size: number) {
    this.#size = size;
  }

  get(key: TKey): TValue | void {
    let item = this.#cache.get(key);
    if (item !== undefined) {
      this.#cache.delete(key);
      this.#cache.set(key, item);
    }
    return item;
  }

  set(key: TKey, val: TValue): void {
    if (this.#cache.has(key)) {
      this.#cache.delete(key);
    } else if (this.#cache.size >= this.#size) {
      this.#cache.delete(this.first());
    }
    this.#cache.set(key, val);
  }

  clear(): void {
    this.#cache.clear();
  }

  first(): TKey {
    return this.#cache.keys().next().value;
  }
}
