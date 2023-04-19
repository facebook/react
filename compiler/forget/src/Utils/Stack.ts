/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface Stack<T> {
  push(value: T): Stack<T>;

  pop(): Stack<T>;

  contains(value: T): boolean;

  each(fn: (value: T) => void): void;

  get value(): T | null;
}

export function create<T>(value: T): Stack<T> {
  return new Node(value);
}

export function empty<T>(): Stack<T> {
  return EMPTY as any;
}

class Node<T> implements Stack<T> {
  #value: T;
  #next: Stack<T>;

  constructor(value: T, next: Stack<T> = EMPTY as any) {
    this.#value = value;
    this.#next = next;
  }

  push(value: T): Node<T> {
    return new Node(value, this);
  }

  pop(): Stack<T> {
    return this.#next;
  }

  contains(value: T): boolean {
    return (
      value === this.#value ||
      (this.#next !== null && this.#next.contains(value))
    );
  }
  each(fn: (value: T) => void): void {
    fn(this.#value);
    this.#next.each(fn);
  }

  get value(): T {
    return this.#value;
  }
}

class Empty<T> implements Stack<T> {
  push(value: T): Stack<T> {
    return new Node(value, this);
  }
  pop(): Stack<T> {
    return this;
  }
  contains(_value: T): boolean {
    return false;
  }
  each(_fn: (value: T) => void): void {
    return;
  }
  get value(): T | null {
    return null;
  }
}

const EMPTY: Stack<void> = new Empty();
