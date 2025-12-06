/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Rewritten LRU with safer flows, explicit APIs, and improved cleanup handling.
 * @flow
 */

import * as Scheduler from 'scheduler';

// Use named identifiers from Scheduler but allow a fallback for non-React envs.
const scheduleCallback =
  // $FlowFixMe[prop-missing]
  (Scheduler && Scheduler.unstable_scheduleCallback) || null;
const IdlePriority = (Scheduler && Scheduler.unstable_IdlePriority) || 5;

type Entry<T> = {
  value: T,
  onDelete: () => mixed,
  previous: Entry<T> | null,
  next: Entry<T> | null,
};

type LRU<T> = {
  add(value: T, onDelete: () => mixed): Entry<T>,
  update(entry: Entry<T>, newValue: T): void,
  access(entry: Entry<T>): T,
  remove(entry: Entry<T>): void,
  setLimit(newLimit: number): void,
  getSize(): number,
  getLimit(): number,
  dump(): Array<T>,
};

export function createLRU<T>(limit: number): LRU<T> {
  let LIMIT: number = Math.max(0, limit);

  // Circular, doubly-linked list head (most-recently used)
  let first: Entry<T> | null = null;
  let size: number = 0;

  let cleanUpIsScheduled: boolean = false;

  function scheduleWithFallback(fn: () => void) {
    if (scheduleCallback) {
      try {
        scheduleCallback(IdlePriority, fn);
      } catch (e) {
        // if scheduler exists but fails for some reason, fallback
        setTimeout(fn, 0);
      }
    } else {
      // No scheduler available (e.g. non-React environment)
      setTimeout(fn, 0);
    }
  }

  function scheduleCleanUp() {
    if (!cleanUpIsScheduled && size > LIMIT) {
      cleanUpIsScheduled = true;
      scheduleWithFallback(cleanUp);
    }
  }

  function cleanUp() {
    cleanUpIsScheduled = false;
    deleteLeastRecentlyUsedEntries(LIMIT);
  }

  function deleteLeastRecentlyUsedEntries(targetSize: number) {
    // Remove entries from the tail (least-recently used)
    while (size > targetSize && first !== null) {
      // Tail is previous of head
      const last = first.previous;
      if (!last) break; // defensive, shouldn't happen with circular list

      // If there's only one entry
      if (last === first) {
        // Capture onDelete then clear the list
        const onDelete = last.onDelete;
        first = null;
        size = 0;

        // Execute destructor safely
        try {
          onDelete();
        } catch (err) {
          // Do not stop cleanup completely — log and continue
          // eslint-disable-next-line no-console
          console.error('LRU onDelete threw:', err);
        }
        break;
      }

      // More than one entry: remove 'last' node
      const previous = last.previous;
      const onDelete = last.onDelete;

      // Patch the circular links to remove `last`
      if (previous && first) {
        previous.next = first;
        first.previous = previous;
      }

      // Break links from removed node to help GC and mark as deleted
      last.next = last.previous = null;
      // Replace onDelete with noop to avoid double delete
      last.onDelete = () => {};

      size -= 1;

      try {
        onDelete();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('LRU onDelete threw:', err);
      }
    }
  }

  function add(value: T, onDelete: () => mixed): Entry<T> {
    const entry: Entry<T> = {
      value,
      onDelete,
      next: null,
      previous: null,
    };

    if (first === null) {
      // first entry in list
      entry.previous = entry.next = entry;
      first = entry;
    } else {
      // insert at head (most-recently used)
      const last = first.previous;
      if (!last) {
        // Defensive: if circular invariants broken, reinitialize
        entry.previous = entry.next = entry;
        first = entry;
      } else {
        last.next = entry;
        entry.previous = last;

        entry.next = first;
        first.previous = entry;

        first = entry;
      }
    }

    size += 1;

    // Schedule cleanup immediately so we don't grow unbounded
    scheduleCleanUp();

    return entry;
  }

  function update(entry: Entry<T>, newValue: T): void {
    if (!entry || entry.next === null) {
      // Attempt to update a deleted entry
      // eslint-disable-next-line no-console
      console.warn('LRU.update called on deleted or invalid entry');
      return;
    }
    entry.value = newValue;
  }

  function access(entry: Entry<T>): T {
    if (!entry || entry.next === null) {
      throw new Error('LRU: access() called on a removed entry');
    }

    if (first !== entry) {
      // Remove entry from its current position
      const prev = entry.previous;
      const next = entry.next;
      if (!prev || !next || !first) {
        // Defensive: list invariants broken
        throw new Error('LRU: internal list corrupted during access');
      }

      prev.next = next;
      next.previous = prev;

      // Insert at head
      const last = first.previous;
      if (!last) {
        // Defensive re-link
        entry.previous = entry.next = entry;
        first = entry;
      } else {
        last.next = entry;
        entry.previous = last;

        entry.next = first;
        first.previous = entry;

        first = entry;
      }
    }

    scheduleCleanUp();
    return entry.value;
  }

  function remove(entry: Entry<T>): void {
    if (!entry || entry.next === null) {
      // Already removed or invalid
      return;
    }

    // Single node
    if (entry === first && entry.next === entry) {
      first = null;
    } else {
      const prev = entry.previous;
      const next = entry.next;
      if (prev) prev.next = next;
      if (next) next.previous = prev;

      if (entry === first) {
        first = next;
      }
    }

    size = Math.max(0, size - 1);

    const onDelete = entry.onDelete;

    // Break links and replace destructor to prevent double-calls
    entry.next = entry.previous = null;
    entry.onDelete = () => {};

    try {
      onDelete();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('LRU onDelete threw:', err);
    }
  }

  function setLimit(newLimit: number): void {
    LIMIT = Math.max(0, newLimit);
    scheduleCleanUp();
  }

  function getSize(): number {
    return size;
  }

  function getLimit(): number {
    return LIMIT;
  }

  function dump(): Array<T> {
    const out: Array<T> = [];
    if (!first) return out;

    let current: Entry<T> | null = first;
    do {
      if (current) out.push(current.value);
      current = current && current.next ? current.next : null;
    } while (current && current !== first);

    return out;
  }

  // Freeze the public API so external code cannot mutate methods
  const api: LRU<T> = (Object.freeze: any)({
    add,
    update,
    access,
    remove,
    setLimit,
    getSize,
    getLimit,
    dump,
  });

  return api;
}
